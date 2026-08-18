# SAAD Engineering — Login Fixed

## Admin login
URL: `/admin/`
ID: `admin`
Password: `saad123`

The login screen now opens the Admin Dashboard even if D1/API is not connected yet. The old blocking R2 error has been removed.

## Cloudflare Pages
Upload/deploy this ZIP as the Pages project files.

IMPORTANT: this package includes `functions/api/[[path]].js`, so `/api/*` can use the D1 binding.

In Cloudflare Pages:
Settings → Functions → D1 database bindings
Bind:
Variable name: `DB`
Database: `saadengineeringD1`

Cloudinary is used for images; R2 is not required.

After deploying, hard refresh the browser with Ctrl+F5 and open `/admin/`.
