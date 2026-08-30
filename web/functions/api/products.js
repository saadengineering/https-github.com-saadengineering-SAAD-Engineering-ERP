export async function onRequest(context) {
  const { request, env } = context;

  // Check D1 binding
  if (!env.DB) {
    return Response.json(
      {
        success: false,
        message: "D1 database binding DB is not configured."
      },
      { status: 500 }
    );
  }

  try {
    // =========================
    // GET — Get all products
    // =========================
    if (request.method === "GET") {
      const result = await env.DB
        .prepare(`
          SELECT *
          FROM products
          ORDER BY id DESC
        `)
        .all();

      return Response.json({
        success: true,
        products: result.results || []
      });
    }

    // =========================
    // POST — Add product
    // =========================
    if (request.method === "POST") {
      const data = await request.json();

      const name = String(data.name || "").trim();
      const part_no = String(data.part_no || "").trim();
      const brand = String(data.brand || "").trim();
      const category = String(data.category || "").trim();
      const unit = String(data.unit || "").trim();
      const purchase_price = Number(data.purchase_price) || 0;
      const selling_price = Number(data.selling_price) || 0;
      const stock = Number(data.stock) || 0;
      const min_stock = Number(data.min_stock) || 0;
      const image = String(data.image || "").trim();
      const description = String(data.description || "").trim();

      if (!name) {
        return Response.json(
          {
            success: false,
            message: "Product name is required."
          },
          { status: 400 }
        );
      }

      const result = await env.DB
        .prepare(`
          INSERT INTO products
          (
            name,
            part_no,
            brand,
            category,
            unit,
            purchase_price,
            selling_price,
            stock,
            min_stock,
            image,
            description
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          name,
          part_no,
          brand,
          category,
          unit,
          purchase_price,
          selling_price,
          stock,
          min_stock,
          image,
          description
        )
        .run();

      return Response.json({
        success: true,
        message: "Product added successfully.",
        id: result.meta?.last_row_id || null
      });
    }

    // =========================
    // PUT — Update product
    // =========================
    if (request.method === "PUT") {
      const data = await request.json();

      // IMPORTANT:
      // Accept id from either "id" or "product_id"
      const id = Number(data.id || data.product_id || 0);

      const name = String(data.name || "").trim();
      const part_no = String(data.part_no || "").trim();
      const brand = String(data.brand || "").trim();
      const category = String(data.category || "").trim();
      const unit = String(data.unit || "").trim();
      const purchase_price = Number(data.purchase_price) || 0;
      const selling_price = Number(data.selling_price) || 0;
      const stock = Number(data.stock) || 0;
      const min_stock = Number(data.min_stock) || 0;
      const image = String(data.image || "").trim();
      const description = String(data.description || "").trim();

      if (!id) {
        return Response.json(
          {
            success: false,
            message: "Product ID is required."
          },
          { status: 400 }
        );
      }

      if (!name) {
        return Response.json(
          {
            success: false,
            message: "Product name is required."
          },
          { status: 400 }
        );
      }

      const result = await env.DB
        .prepare(`
          UPDATE products
          SET
            name = ?,
            part_no = ?,
            brand = ?,
            category = ?,
            unit = ?,
            purchase_price = ?,
            selling_price = ?,
            stock = ?,
            min_stock = ?,
            image = ?,
            description = ?
          WHERE id = ?
        `)
        .bind(
          name,
          part_no,
          brand,
          category,
          unit,
          purchase_price,
          selling_price,
          stock,
          min_stock,
          image,
          description,
          id
        )
        .run();

      return Response.json({
        success: true,
        message: "Product updated successfully.",
        id: id,
        changes: result.meta?.changes || 0
      });
    }

    // =========================
    // DELETE — Delete product
    // =========================
    if (request.method === "DELETE") {
      const data = await request.json();

      const id = Number(data.id || data.product_id || 0);

      if (!id) {
        return Response.json(
          {
            success: false,
            message: "Product ID is required."
          },
          { status: 400 }
        );
      }

      const result = await env.DB
        .prepare(`
          DELETE FROM products
          WHERE id = ?
        `)
        .bind(id)
        .run();

      return Response.json({
        success: true,
        message: "Product deleted successfully.",
        id: id,
        changes: result.meta?.changes || 0
      });
    }

    // =========================
    // Unsupported method
    // =========================
    return Response.json(
      {
        success: false,
        message: "Method not allowed."
      },
      { status: 405 }
    );

  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "API error.",
        error: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
