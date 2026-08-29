export async function onRequest(context) {
  const { request, env } = context;

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
    // GET — Read all products
    if (request.method === "GET") {
      const result = await env.DB
        .prepare(
          `SELECT * FROM products ORDER BY id DESC`
        )
        .all();

      return Response.json({
        success: true,
        products: result.results || []
      });
    }

    // POST — Add a new product
    if (request.method === "POST") {
      const data = await request.json();

      const {
        name = "",
        part_no = "",
        brand = "",
        category = "",
        unit = "",
        purchase_price = 0,
        selling_price = 0,
        stock = 0,
        min_stock = 0,
        image = "",
        description = ""
      } = data;

      if (!name.trim()) {
        return Response.json(
          {
            success: false,
            message: "Product name is required."
          },
          { status: 400 }
        );
      }

      const result = await env.DB
        .prepare(
          `INSERT INTO products
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          name.trim(),
          part_no.trim(),
          brand.trim(),
          category.trim(),
          unit.trim(),
          Number(purchase_price) || 0,
          Number(selling_price) || 0,
          Number(stock) || 0,
          Number(min_stock) || 0,
          image.trim(),
          description.trim()
        )
        .run();

      return Response.json({
        success: true,
        message: "Product added successfully.",
        id: result.meta?.last_row_id || null
      });
    }

    // PUT — Update an existing product
    if (request.method === "PUT") {
      const data = await request.json();

      const {
        id,
        name = "",
        part_no = "",
        brand = "",
        category = "",
        unit = "",
        purchase_price = 0,
        selling_price = 0,
        stock = 0,
        min_stock = 0,
        image = "",
        description = ""
      } = data;

      if (!id) {
        return Response.json(
          {
            success: false,
            message: "Product ID is required."
          },
          { status: 400 }
        );
      }

      await env.DB
        .prepare(
          `UPDATE products SET
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
          WHERE id = ?`
        )
        .bind(
          name.trim(),
          part_no.trim(),
          brand.trim(),
          category.trim(),
          unit.trim(),
          Number(purchase_price) || 0,
          Number(selling_price) || 0,
          Number(stock) || 0,
          Number(min_stock) || 0,
          image.trim(),
          description.trim(),
          Number(id)
        )
        .run();

      return Response.json({
        success: true,
        message: "Product updated successfully."
      });
    }

    // DELETE — Delete a product
    if (request.method === "DELETE") {
      const data = await request.json();

      if (!data.id) {
        return Response.json(
          {
            success: false,
            message: "Product ID is required."
          },
          { status: 400 }
        );
      }

      await env.DB
        .prepare(
          `DELETE FROM products WHERE id = ?`
        )
        .bind(Number(data.id))
        .run();

      return Response.json({
        success: true,
        message: "Product deleted successfully."
      });
    }

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
        error: error.message
      },
      { status: 500 }
    );
  }
}
