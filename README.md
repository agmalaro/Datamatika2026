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

## Deploy dengan Docker

### Persiapan

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose terinstall

### Jalankan

```bash
docker compose up --build
```

Akses di: `http://localhost:4321`

### Environment Variables

| Variable | Nilai di Docker | Keterangan |
|----------|----------------|------------|
| `DEPLOY_ADAPTER` | `node` | Adapter Node standalone (di-override otomatis) |
| `HOST` | `0.0.0.0` | Bind ke semua interface |
| `PORT` | `4321` | Port server |

### Perintah

```bash
# Jalankan di background
docker compose up --build -d

# Stop & hapus container
docker compose down

# Rebuild setelah perubahan kode
docker compose up --build
```