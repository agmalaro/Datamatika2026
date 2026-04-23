# Supabase Setup (Vercel/Netlify CMS)

Use this setup so admin CMS can save content and upload files on serverless hosting.

## 1) Create table for content JSON

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.site_content (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

## 2) Create storage bucket

- Go to **Storage** in Supabase.
- Create bucket: `cms-assets`
- Set bucket to **Public** (so uploaded images/files can be shown directly in site).

## 3) Add environment variables

Add these variables in Vercel/Netlify project settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET` (optional, default: `cms-assets`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `DEPLOY_ADAPTER=vercel` (or `netlify`)

## 4) Seed initial content (optional)

If you want initial CMS data in Supabase:

1. Open local file `src/data/content.local.json`
2. Insert into table:

```sql
insert into public.site_content (id, payload)
values ('main', '<PASTE_JSON_HERE>'::jsonb)
on conflict (id)
do update set payload = excluded.payload, updated_at = now();
```

Replace `<PASTE_JSON_HERE>` with the JSON body from `content.local.json`.

