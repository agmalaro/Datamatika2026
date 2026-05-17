# DATAMATIKA 2026 (Astro SSR + Admin CMS)

Landing page dan admin CMS untuk DATAMATIKA 2026 dengan runtime Astro SSR (Node adapter) dan storage eksternal Supabase.

## Fitur utama

- Admin login: `/admin/login`
- Dashboard konten: `/admin`
- API admin:
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET/POST /api/admin/content`
  - `POST /api/admin/upload`
  - `POST /api/admin/password`
- Health endpoint untuk operasional: `GET /api/health`

## Menjalankan lokal (tanpa Docker)

1. Siapkan environment (pilih salah satu):
   - **Satu file dengan production:** isi `.env.production` (sama seperti Docker), lalu `npm run dev` — dev otomatis memuat `.env.production` jika `.env` belum ada.
   - **File dev terpisah:** `npm run env:init` lalu edit `.env` — isi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` **sama** dengan server production.
2. Pastikan tabel `site_content` dan bucket Supabase sudah ada (lihat `SUPABASE_SETUP.md`).
3. Jalankan:

```bash
npm install
npm run dev
```

Cek koneksi: `GET http://localhost:4321/api/health` → `"storage": "supabase"`.

Tanpa Supabase, CMS menyimpan ke `src/data/content.local.json` (fallback). Dengan Supabase, konten & upload sama dengan production.

Jika belum ada data auth lokal, default login pertama tetap `admin / admin123` (kecuali `ADMIN_PASSWORD` di env).

## Menjalankan lokal via Docker Compose

1. Salin `.env.production.example` menjadi `.env.production`.
2. Isi semua environment variable.
3. Jalankan:

```bash
docker compose up -d --build
```

4. Lihat log:

```bash
docker compose logs -f app
```

5. Stop:

```bash
docker compose down
```

Aplikasi di container memakai port **3000** (`http://localhost:3000`).

## Environment variable production

Gunakan template `.env.production.example`:

- `NODE_ENV`, `HOST`, `PORT`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`
- `SITE_URL` — URL publik (mis. `https://datamatika.ipb.ac.id`) agar upload/admin POST tidak kena 403 CSRF di belakang nginx

Catatan:

- Jangan commit `.env.production`.
- Untuk production, gunakan Supabase agar data/upload tidak tergantung filesystem container.

### Nginx (reverse proxy) — wajib untuk upload CMS

Astro membandingkan header `Origin` dengan URL request. Tanpa header ini, Node melihat `http://127.0.0.1:3000` sementara browser mengirim `https://datamatika.ipb.ac.id` → **403 Cross-site POST form submissions are forbidden**.

Di blok `location` proxy ke container (port 3000), tambahkan:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
```

Lalu rebuild/restart container setelah `SITE_URL` di `.env.production` sesuai domain publik.

## Deploy/update di server (Docker Compose)

### Opsi A: build di server dari source (tanpa registry image)

```bash
git pull
docker compose up -d --build
docker compose logs -f app
```

### Opsi B: jika sudah pakai registry image

Siapkan tag image (opsional) dari template:

```bash
cp .env.registry.example .env.registry
```

Jalankan compose dengan override registry:

```bash
docker compose --env-file .env.registry -f docker-compose.yml -f docker-compose.registry.yml pull
docker compose --env-file .env.registry -f docker-compose.yml -f docker-compose.registry.yml up -d
docker compose logs -f app
```

Catatan:

- `IMAGE_TAG=latest` atau tag SHA pendek dari GHCR.
- File `docker-compose.registry.yml` akan menonaktifkan `build` dan memakai image jadi dari GHCR.

### Restart service

```bash
docker compose restart app
```

## Rollback sederhana

Jika deploy gagal dan server menggunakan source checkout:

```bash
git checkout <commit-sebelumnya>
docker compose up -d --build
```

Jika menggunakan image registry bertag:

1. Ubah tag image ke versi sebelumnya di compose file.
2. Jalankan `docker compose up -d`.

## Checklist verifikasi pasca deploy

1. Healthcheck:
   - `GET /api/health` -> status `200` dan JSON `{ status: "ok", timestamp: ... }`
2. Admin:
   - `/admin/login` bisa diakses
   - login berhasil
3. Konten:
   - simpan perubahan via dashboard berhasil (`POST /api/admin/content`)
4. Upload:
   - upload dari dashboard berhasil (`POST /api/admin/upload`)
   - file/object masuk ke bucket Supabase
5. Restart:
   - `docker compose restart app`
   - ulangi tes health + login + save

## CI

Workflow CI ada di `.github/workflows/ci-docker.yml`:

- Trigger: push dan pull request ke `main`
- `npm ci`
- `npm run build`
- `docker build`
- `docker compose config`

Pipeline akan gagal jika salah satu langkah gagal.

Publish image GHCR ada di `.github/workflows/publish-ghcr.yml`:

- Trigger saat push ke branch `deploy/prod` (dan manual `workflow_dispatch`)
- Build + push image ke `ghcr.io/agmalaro/datamatika2026`
- Tag yang dipublish:
  - `latest`
  - `sha-<short-commit>`

## Catatan keamanan

- Rotate secret jika pernah terekspos:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
- Simpan secret hanya di environment server/secret manager.
