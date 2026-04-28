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

1. Salin `.env.example` menjadi `.env` lalu isi nilainya.
2. Jalankan:

```bash
npm install
npm run dev
```

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

## Environment variable production

Gunakan template `.env.production.example`:

- `NODE_ENV`, `HOST`, `PORT`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`

Catatan:

- Jangan commit `.env.production`.
- Untuk production, gunakan Supabase agar data/upload tidak tergantung filesystem container.

## Deploy/update di server (Docker Compose)

### Opsi A: build di server dari source (tanpa registry image)

```bash
git pull
docker compose up -d --build
docker compose logs -f app
```

### Opsi B: jika sudah pakai registry image

```bash
docker compose pull
docker compose up -d
docker compose logs -f app
```

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

## Catatan keamanan

- Rotate secret jika pernah terekspos:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
- Simpan secret hanya di environment server/secret manager.
