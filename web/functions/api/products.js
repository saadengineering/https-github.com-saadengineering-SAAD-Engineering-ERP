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

  const json = (data, status = 200) =>
    Response.json(data, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  try {
    // --------------------------------------------------
    // OPTIONS
    // --------------------------------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // --------------------------------------------------
    // GET — Get all products
    // --------------------------------------------------
    if (request.method === "GET") {
      const result = await env.DB
        .prepare(`
          SELECT
            id,
            product_code,
            item_no,
            name,
            product_name,
            category,
            section,
            brand,
            model,
            unit,
            price,
            unit_price,
            stock,
            stock_qty,
            min_stock,
            status,
            description,
            remarks,
            image,
            image_url,
            created_by,
            created_at,
            updated_at
          FROM products
          ORDER BY id DESC
        `)
        .all();

      return json({
        success: true,
        products: result.results || []
      });
    }

    // --------------------------------------------------
    // POST — Add product
    // --------------------------------------------------
    if (request.method === "POST") {
      const data = await request.json();

      const productCode = String(data.product_code || "").trim();
      const itemNo = String(data.item_no || "").trim();

      const name = String(
        data.name || data.product_name || ""
      ).trim();

      const productName = String(
        data.product_name || data.name || ""
      ).trim();

      const category = String(
        data.category || data.cat || ""
      ).trim();

      const section = String(data.section || "").trim();
      const brand = String(data.brand || "").trim();
      const model = String(data.model || "").trim();
      const unit = String(data.unit || "").trim();

      const description = String(
        data.description || ""
      ).trim();

      const remarks = String(
        data.remarks || ""
      ).trim();

      const status = String(
        data.status || "active"
      ).trim();

      const createdBy = String(
        data.created_by || ""
      ).trim();

      const image = String(
        data.image || ""
      ).trim();

      const imageUrl = String(
        data.image_url || ""
      ).trim();

      if (!name) {
        return json(
          {
            success: false,
            message: "Product name is required."
          },
          400
        );
      }

      // Keep numeric fields numeric.
      // Empty values become 0 instead of invalid text.
      const price =
        data.price === "" ||
        data.price === null ||
        data.price === undefined ||
        data.price === "N/A"
          ? 0
          : Number(data.price);

      const unitPrice =
        data.unit_price === "" ||
        data.unit_price === null ||
        data.unit_price === undefined ||
        data.unit_price === "N/A"
          ? 0
          : Number(data.unit_price);

      const stock =
        data.stock === "" ||
        data.stock === null ||
        data.stock === undefined
          ? 0
          : Number(data.stock);

      const stockQty =
        data.stock_qty === "" ||
        data.stock_qty === null ||
        data.stock_qty === undefined
          ? 0
          : Number(data.stock_qty);

      const minStock =
        data.min_stock === "" ||
        data.min_stock === null ||
        data.min_stock === undefined
          ? 0
          : Number(data.min_stock);

      if (
        !Number.isFinite(price) ||
        !Number.isFinite(unitPrice) ||
        !Number.isFinite(stock) ||
        !Number.isFinite(stockQty) ||
        !Number.isFinite(minStock)
      ) {
        return json(
          {
            success: false,
            message: "Numeric product values are invalid."
          },
          400
        );
      }

      const result = await env.DB
        .prepare(`
          INSERT INTO products (
            product_code,
            item_no,
            name,
            product_name,
            category,
            section,
            brand,
            model,
            unit,
            price,
            stock,
            stock_qty,
            min_stock,
            status,
            description,
            remarks,
            image,
            image_url,
            created_by,
            unit_price
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          productCode,
          itemNo,
          name,
          productName,
          category,
          section,
          brand,
          model,
          unit,
          price,
          stock,
          stockQty,
          minStock,
          status,
          description,
          remarks,
          image,
          imageUrl,
          createdBy,
          unitPrice
        )
        .run();

      return json({
        success: true,
        message: "Product added successfully.",
        id: result.meta?.last_row_id || null
      });
    }

    // --------------------------------------------------
    // PUT — Update product
    // --------------------------------------------------
    if (request.method === "PUT") {
      const data = await request.json();

      const id = Number(
        data.id || data.product_id || 0
      );

      if (!id) {
        return json(
          {
            success: false,
            message: "Product ID is required."
          },
          400
        );
      }

      const existing = await env.DB
        .prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `)
        .bind(id)
        .first();

      if (!existing) {
        return json(
          {
            success: false,
            message: "Product not found."
          },
          404
        );
      }

      /*
       * Partial-update behaviour:
       * If a field is not supplied, keep the existing value.
       * This prevents accidental blanking of existing data.
       */

      const productCode =
        data.product_code !== undefined
          ? String(data.product_code || "").trim()
          : existing.product_code || "";

      const itemNo =
        data.item_no !== undefined
          ? String(data.item_no || "").trim()
          : existing.item_no || "";

      const name =
        data.name !== undefined
          ? String(data.name || "").trim()
          : existing.name || "";

      const productName =
        data.product_name !== undefined
          ? String(data.product_name || "").trim()
          : existing.product_name || name;

      const category =
        data.category !== undefined ||
        data.cat !== undefined
          ? String(
              data.category !== undefined
                ? data.category
                : data.cat || ""
            ).trim()
          : existing.category || "";

      const section =
        data.section !== undefined
          ? String(data.section || "").trim()
          : existing.section || "";

      const brand =
        data.brand !== undefined
          ? String(data.brand || "").trim()
          : existing.brand || "";

      const model =
        data.model !== undefined
          ? String(data.model || "").trim()
          : existing.model || "";

      const unit =
        data.unit !== undefined
          ? String(data.unit || "").trim()
          : existing.unit || "";

      const description =
        data.description !== undefined
          ? String(data.description || "").trim()
          : existing.description || "";

      const remarks =
        data.remarks !== undefined
          ? String(data.remarks || "").trim()
          : existing.remarks || "";

      const status =
        data.status !== undefined
          ? String(data.status || "active").trim()
          : existing.status || "active";

      const createdBy =
        data.created_by !== undefined
          ? String(data.created_by || "").trim()
          : existing.created_by || "";

      const image =
        data.image !== undefined
          ? String(data.image || "").trim()
          : existing.image || "";

      const imageUrl =
        data.image_url !== undefined
          ? String(data.image_url || "").trim()
          : existing.image_url || "";

      const price =
        data.price !== undefined
          ? (
              data.price === "" ||
              data.price === null ||
              data.price === "N/A"
                ? 0
                : Number(data.price)
            )
          : Number(existing.price || 0);

      const unitPrice =
        data.unit_price !== undefined
          ? (
              data.unit_price === "" ||
              data.unit_price === null ||
              data.unit_price === "N/A"
                ? 0
                : Number(data.unit_price)
            )
          : Number(existing.unit_price || 0);

      const stock =
        data.stock !== undefined
          ? (
              data.stock === "" ||
              data.stock === null
                ? 0
                : Number(data.stock)
            )
          : Number(existing.stock || 0);

      const stockQty =
        data.stock_qty !== undefined
          ? (
              data.stock_qty === "" ||
              data.stock_qty === null
                ? 0
                : Number(data.stock_qty)
            )
          : Number(existing.stock_qty || 0);

      const minStock =
        data.min_stock !== undefined
          ? (
              data.min_stock === "" ||
              data.min_stock === null
                ? 0
                : Number(data.min_stock)
            )
          : Number(existing.min_stock || 0);

      if (!name) {
        return json(
          {
            success: false,
            message: "Product name is required."
          },
          400
        );
      }

      if (
        !Number.isFinite(price) ||
        !Number.isFinite(unitPrice) ||
        !Number.isFinite(stock) ||
        !Number.isFinite(stockQty) ||
        !Number.isFinite(minStock)
      ) {
        return json(
          {
            success: false,
            message: "Numeric product values are invalid."
          },
          400
        );
      }

      const result = await env.DB
        .prepare(`
          UPDATE products
          SET
            product_code = ?,
            item_no = ?,
            name = ?,
            product_name = ?,
            category = ?,
            section = ?,
            brand = ?,
            model = ?,
            unit = ?,
            price = ?,
            unit_price = ?,
            stock = ?,
            stock_qty = ?,
            min_stock = ?,
            status = ?,
            description = ?,
            remarks = ?,
            image = ?,
            image_url = ?,
            created_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          productCode,
          itemNo,
          name,
          productName,
          category,
          section,
          brand,
          model,
          unit,
          price,
          unitPrice,
          stock,
          stockQty,
          minStock,
          status,
          description,
          remarks,
          image,
          imageUrl,
          createdBy,
          id
        )
        .run();

      return json({
        success: true,
        message: "Product updated successfully.",
        id,
        changes: result.meta?.changes || 0
      });
    }

    // --------------------------------------------------
    // DELETE — Delete product
    // --------------------------------------------------
    if (request.method === "DELETE") {
      const data = await request.json();

      const id = Number(
        data.id || data.product_id || 0
      );

      if (!id) {
        return json(
          {
            success: false,
            message: "Product ID is required."
          },
          400
        );
      }

      const existing = await env.DB
        .prepare(`
          SELECT id
          FROM products
          WHERE id = ?
        `)
        .bind(id)
        .first();

      if (!existing) {
        return json(
          {
            success: false,
            message: "Product not found."
          },
          404
        );
      }

      /*
       * Protect products that are already referenced
       * by transactional tables.
       */

      const purchaseRef = await env.DB
        .prepare(`
          SELECT id
          FROM purchase_items
          WHERE product_id = ?
          LIMIT 1
        `)
        .bind(id)
        .first();

      const invoiceRef = await env.DB
        .prepare(`
          SELECT id
          FROM invoice_items
          WHERE product_id = ?
          LIMIT 1
        `)
        .bind(id)
        .first();

      const quotationRef = await env.DB
        .prepare(`
          SELECT id
          FROM quotation_items
          WHERE product_id = ?
          LIMIT 1
        `)
        .bind(id)
        .first();

      if (purchaseRef || invoiceRef || quotationRef) {
        return json(
          {
            success: false,
            message:
              "Product cannot be deleted because it is already used in a transaction."
          },
          409
        );
      }

      const result = await env.DB
        .prepare(`
          DELETE FROM products
          WHERE id = ?
        `)
        .bind(id)
        .run();

      return json({
        success: true,
        message: "Product deleted successfully.",
        id,
        changes: result.meta?.changes || 0
      });
    }

    // --------------------------------------------------
    // Unsupported method
    // --------------------------------------------------
    return json(
      {
        success: false,
        message: "Method not allowed."
      },
      405
    );

  } catch (error) {
    return json(
      {
        success: false,
        message: "API error.",
        error: error?.message || String(error)
      },
      500
    );
  }
}
