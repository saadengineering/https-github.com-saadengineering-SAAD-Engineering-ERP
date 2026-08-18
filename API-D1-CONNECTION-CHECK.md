# SAAD Engineering — API / D1 Connection Fix

The Admin Login is independent and should work even when D1 is not connected.

## 1. Cloudflare Pages binding
Open the SAAD Engineering Pages project:

**Settings → Functions → D1 database bindings**

Add:
- Variable name: `DB`
- D1 database: `saadengineeringD1`

Save the binding and create a **new production deployment**.

## 2. Test the API
Open:

`https://saadengineering.pages.dev/api/health`

Expected response:

`{"ok":true,"d1":true,"message":"SAAD Engineering API + D1 connected"}`

If you get `D1 binding DB is missing`, the Pages project does not have the `DB` binding yet.

If you get `API route not found`, make sure `functions/api/[[path]].js` is included in the deployed project.

## 3. D1 tables
The API automatically creates these tables on its first request:
- `saad_products`
- `saad_product_images`
- `saad_inquiries`

No manual schema import is required for this build.

## 4. Browser cache
After the new deployment:
- press `Ctrl + F5`
- open `/admin/`
- login with the existing admin credentials
- add a test product
- refresh the public homepage

## 5. Important
This ZIP contains the Pages Function bridge:
`functions/api/[[path]].js`

That file is what connects `/api/*` to `worker.js` and the D1 binding.
