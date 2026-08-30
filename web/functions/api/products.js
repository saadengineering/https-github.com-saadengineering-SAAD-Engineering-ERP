export async function onRequest(context) {
  const { request, env } = context;

  // ---------------------------------------------------------
  // D1 DATABASE CHECK
  // ---------------------------------------------------------
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
    // ========================================================
    // GET — READ ALL PRODUCTS
    // ========================================================
    if (request.method === "GET") {
      const result = await env.DB
        .prepare(`
          SELECT
            id,
            name,
            cat,
            description,
            created_at
          FROM saad_products
          ORDER BY id DESC
        `)
        .all();

      return Response.json({
        success: true,
        products: result.results || []
      });
    }

    // ========================================================
    // POST — ADD NEW PRODUCT
    // ========================================================
    if (request.method === "POST") {
      const data = await request.json();

      // Support both "name" and "product_name"
      const name = String(
        data.name ?? data.product_name ?? ""
      ).trim();

      // Support both "cat" and "category"
      const category = String(
        data.cat ?? data.category ?? ""
      ).trim();

      const description = String(
        data.description ?? ""
      ).trim();

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
          INSERT INTO saad_products
          (
            name,
            cat,
            description
          )
          VALUES (?, ?, ?)
        `)
        .bind(
          name,
          category,
          description
        )
        .run();

      return Response.json({
        success: true,
        message: "Product added successfully.",
        id: result.meta?.last_row_id || null
      });
    }

    // ========================================================
    // PUT — UPDATE PRODUCT
    // ========================================================
    if (request.method === "PUT") {
      const data = await request.json();

      const id = Number(data.id);

      const name = String(
        data.name ?? data.product_name ?? ""
      ).trim();

      const category = String(
        data.cat ?? data.category ?? ""
      ).trim();

      const description = String(
        data.description ?? ""
      ).trim();

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
          UPDATE saad_products
          SET
            name = ?,
            cat = ?,
            description = ?
          WHERE id = ?
        `)
        .bind(
          name,
          category,
          description,
          id
        )
        .run();

      return Response.json({
        success: true,
        message: "Product updated successfully.",
        changes: result.meta?.changes || 0
      });
    }

    // ========================================================
    // DELETE — DELETE PRODUCT
    // ========================================================
    if (request.method === "DELETE") {
      const data = await request.json();

      const id = Number(data.id);

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
          DELETE FROM saad_products
          WHERE id = ?
        `)
        .bind(id)
        .run();

      return Response.json({
        success: true,
        message: "Product deleted successfully.",
        changes: result.meta?.changes || 0
      });
    }

    // ========================================================
    // METHOD NOT ALLOWED
    // ========================================================
    return Response.json(
      {
        success: false,
        message: "Method not allowed."
      },
      { status: 405 }
    );

  } catch (error) {
    console.error("Products API Error:", error);

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
