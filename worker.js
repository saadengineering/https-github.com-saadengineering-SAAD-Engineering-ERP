const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

async function ensureSchema(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS saad_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cat TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS saad_product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    public_url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS saad_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    product TEXT DEFAULT '',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // Repair older installations that already have the tables but are missing
  // one of the columns used by the current admin/API.
  const ensureColumn = async (table, column, definition) => {
    const info = await db.prepare(`PRAGMA table_info(${table})`).all();
    const names = new Set(info.results.map(x => x.name));
    if (!names.has(column)) await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  };
  await ensureColumn('saad_products','cat',"TEXT DEFAULT ''");
  await ensureColumn('saad_products','description',"TEXT DEFAULT ''");
  await ensureColumn('saad_products','created_at',"TEXT DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('saad_product_images','product_id','INTEGER');
  await ensureColumn('saad_product_images','public_url','TEXT');
  await ensureColumn('saad_product_images','created_at',"TEXT DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn('saad_inquiries','email',"TEXT DEFAULT ''");
  await ensureColumn('saad_inquiries','product',"TEXT DEFAULT ''");
  await ensureColumn('saad_inquiries','status',"TEXT DEFAULT 'New'");
  await ensureColumn('saad_inquiries','created_at',"TEXT DEFAULT CURRENT_TIMESTAMP");
}

function json(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json"}});
}

export default {
 async fetch(request,env){
  if(request.method==="OPTIONS") return new Response(null,{headers:CORS});
  try{
   if(!env.DB) return json({ok:false,error:"D1 binding DB is missing"},500);
   await ensureSchema(env.DB);
   const path=new URL(request.url).pathname.replace(/^\/api/,"");

   if(path==="/health" && request.method==="GET"){
    const checks = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('saad_products','saad_product_images','saad_inquiries') ORDER BY name").all();
    return json({ok:true,d1:true,tables:checks.results.map(x=>x.name),message:"SAAD Engineering API + D1 connected"});
   }

   if(path==="/products" && request.method==="GET"){
    const r=await env.DB.prepare("SELECT id,name,cat,description,created_at FROM saad_products ORDER BY id DESC").all();
    const products=[];
    for(const p of r.results){
      const imgs=await env.DB.prepare("SELECT public_url FROM saad_product_images WHERE product_id=? ORDER BY id").bind(p.id).all();
      products.push({id:p.id,name:p.name,cat:p.cat,desc:p.description,images:imgs.results.map(x=>x.public_url)});
    }
    return json(products);
   }

   if(path==="/products" && request.method==="POST") return saveProduct(request,env,null);

   let m=path.match(/^\/products\/(\d+)$/);
   if(m && request.method==="PUT") return saveProduct(request,env,Number(m[1]));
   if(m && request.method==="DELETE"){
    await env.DB.prepare("DELETE FROM saad_product_images WHERE product_id=?").bind(Number(m[1])).run();
    await env.DB.prepare("DELETE FROM saad_products WHERE id=?").bind(Number(m[1])).run();
    return json({ok:true});
   }

   if(path==="/inquiries" && request.method==="GET"){
    const r=await env.DB.prepare("SELECT id,name,phone,email,product,message,status,created_at AS date FROM saad_inquiries ORDER BY id DESC").all();
    return json(r.results);
   }
   if(path==="/inquiries" && request.method==="POST"){
    const b=await request.json();
    await env.DB.prepare("INSERT INTO saad_inquiries(name,phone,email,product,message,status) VALUES(?,?,?,?,?,?)")
      .bind(String(b.name||""),String(b.phone||""),String(b.email||""),String(b.product||""),String(b.message||""),"New").run();
    return json({ok:true});
   }
   m=path.match(/^\/inquiries\/(\d+)$/);
   if(m && request.method==="PUT"){
    const b=await request.json();
    await env.DB.prepare("UPDATE saad_inquiries SET status=? WHERE id=?").bind(String(b.status||"Replied"),Number(m[1])).run();
    return json({ok:true});
   }
   if(m && request.method==="DELETE"){
    await env.DB.prepare("DELETE FROM saad_inquiries WHERE id=?").bind(Number(m[1])).run();
    return json({ok:true});
   }

   return json({ok:false,error:"API route not found",path},404);
  }catch(e){
   return json({ok:false,error:String(e?.message||e)},500);
  }
 }
};

async function saveProduct(request,env,id){
 const b=await request.json();
 const name=String(b.name||"").trim();
 if(!name) return json({ok:false,error:"Product name is required"},400);

 if(id){
   await env.DB.prepare("UPDATE saad_products SET name=?,cat=?,description=? WHERE id=?")
     .bind(name,String(b.cat||""),String(b.desc||""),id).run();
   await env.DB.prepare("DELETE FROM saad_product_images WHERE product_id=?").bind(id).run();
 }else{
   const r=await env.DB.prepare("INSERT INTO saad_products(name,cat,description) VALUES(?,?,?)")
     .bind(name,String(b.cat||""),String(b.desc||"")).run();
   id=r.meta.last_row_id;
 }
 for(const u of (Array.isArray(b.images)?b.images:[])){
   if(typeof u==="string" && u.startsWith("https://res.cloudinary.com/"))
     await env.DB.prepare("INSERT INTO saad_product_images(product_id,public_url) VALUES(?,?)").bind(id,u).run();
 }
 return json({ok:true,id});
}
