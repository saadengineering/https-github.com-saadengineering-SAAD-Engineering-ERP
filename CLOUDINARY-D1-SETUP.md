# SAAD Engineering — Cloudinary + D1 (NO R2)

This build uses Cloudinary for product pictures and the existing Cloudflare D1 database `saadengineeringD1`.

## Cloudinary
Cloud Name: `saadengineering`

Create:
Cloudinary Dashboard → Settings → Upload → Upload presets → Add upload preset

Set **Signing Mode = Unsigned**.
Then replace `PASTE_UNSIGNED_UPLOAD_PRESET_HERE` in `admin/admin.js` with your preset name.

## D1
Existing database:
`saadengineeringD1`

Database ID:
`cb3a796f-3b40-46f0-a975-9d65ac43e0ac`

The included `wrangler.toml` already contains this ID.

## Deploy
Deploy the Worker/API with the included `worker.js` and bind:
D1 binding name = `DB`
Database = `saadengineeringD1`

If using Cloudflare Pages, the API must be deployed as a Pages Function/Worker with the same `/api/*` routes and the D1 binding `DB`.

## Admin
`/admin/`
ID: `admin`
Password: `saad123`

## Customer
`/`

## Social / AI
Customer landing has the social links and image slider.
Admin has AI Social Generator for Facebook, YouTube, TikTok, LinkedIn, WhatsApp, Instagram and Telegram.

No R2 is required in this build.
