# seminar-datamatika-2026
Landing Page Seminar Datamatika Tahun 2026.

## Admin CMS Lokal (Pure Astro)

Project ini sudah punya admin panel lokal berbasis Astro (tanpa CMS eksternal):

- Login admin: `/admin/login`
- Dashboard konten: `/admin`
- API admin:
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET/POST /api/admin/content`
  - `POST /api/admin/upload` (upload foto speaker)
  - `POST /api/admin/password` (ubah password)

Konten tersimpan ke file lokal `src/data/content.local.json`.
Password lokal (jika `ADMIN_PASSWORD` kosong) disimpan aman (hash) di `src/data/admin.local.json`.

## Menjalankan Project

```bash
npm install
npm run dev
```

## Konfigurasi Credential Admin

Buat file `.env` di root project:

```env
ADMIN_USERNAME=admin
# Optional: jika diisi, password dikunci dari env (tidak bisa diubah dari dashboard)
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=ganti-dengan-secret-yang-kuat
```

Mode password:

- **Mode env (locked):** isi `ADMIN_PASSWORD` -> ubah password lewat `.env`.
- **Mode dashboard (flexible):** kosongkan `ADMIN_PASSWORD` -> bisa ubah password dari halaman admin.

Jika belum ada data auth lokal, default login pertama tetap `admin / admin123`.

## Static Deployment

Project ini bisa dibuild sebagai output static untuk kebutuhan deploy ke shared hosting atau VPS static root.

### Build Lokal

```bash
npm install
npm run build
```

Hasil build ada di folder `dist/`, termasuk:

- `dist/index.html`
- `dist/_astro/*` (asset JS/CSS hasil bundling)
- file static lain dari `public/`

### Deploy ke Shared Hosting / VPS Static Root

1. Jalankan build (`npm run build`).
2. Upload seluruh isi folder `dist/` ke document root hosting (contoh: `public_html` atau root Nginx static).
3. Pastikan server mengarah ke `index.html` sebagai entry point.

### GitHub Actions Artifact

Workflow ada di `.github/workflows/static-build.yml` dan berjalan saat:

- push ke branch `main`
- trigger manual via `workflow_dispatch`

Output workflow adalah artifact `dist-static` yang berisi hasil folder `dist` siap deploy.

### Opsi Branch `build-output` (Manual)

Gunakan branch khusus untuk menyimpan file hasil build static:

```bash
# dari branch kerja setelah npm run build
git checkout --orphan build-output
git rm -rf .
# copy seluruh isi dist/ ke root branch ini
git add .
git commit -m "chore(build): publish static dist output"
git checkout chore/static-build-output
```

Catatan: mode static ditujukan untuk output halaman frontend. Endpoint server seperti `/api/admin/*` memerlukan runtime server/serverless dan tidak berjalan di hosting static murni.
