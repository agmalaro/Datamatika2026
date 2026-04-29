import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { isAuthenticated } from "../../../lib/admin-auth";
import { getSupabaseConfig, getSupabaseServerClient, isSupabaseConfigured } from "../../../lib/supabase-server";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const UPLOAD_TYPE_TO_DIR: Record<string, string> = {
  heroBg: "hero",
  heroLogo: "hero",
  aboutImage: "about",
  timelineImage: "timeline",
  guideFlowImage: "guide",
  speaker: "speakers",
  partner: "partners",
  gallery: "gallery",
  guideTemplate: "files",
};

function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function randomSuffix(): string {
  return crypto.randomBytes(3).toString("hex");
}

function extensionFromName(filename: string): string {
  const ext = path.extname(filename || "").toLowerCase();
  if (!ext) return "";
  return ext.startsWith(".") ? ext : `.${ext}`;
}

function badRequest(message: string) {
  return new Response(JSON.stringify({ message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return new Response(JSON.stringify({ message: "Unauthorized." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();

  const form = await request.formData();
  const uploadType = String(form.get("uploadType") ?? "").trim();
  const dir = UPLOAD_TYPE_TO_DIR[uploadType];
  if (!dir) return badRequest("uploadType tidak dikenal.");

  const fileFieldName = uploadType === "guideTemplate" ? "file" : "image";
  const file = form.get(fileFieldName);
  if (!(file instanceof File)) return badRequest("File upload tidak ditemukan.");
  if (file.size <= 0) return badRequest("File kosong.");
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return badRequest("Ukuran file maksimal 5MB.");

  const allowedTypes = uploadType === "guideTemplate" ? DOC_TYPES : IMAGE_TYPES;
  if (file.type && !allowedTypes.has(file.type)) {
    return badRequest("Tipe file tidak didukung.");
  }

  const cleanOriginalName = sanitizeFilename(file.name || "upload");
  const ext = extensionFromName(cleanOriginalName) || (uploadType === "guideTemplate" ? ".pdf" : ".bin");
  const baseName = sanitizeFilename(uploadType);
  const fileName = `${baseName}-${Date.now()}-${randomSuffix()}${ext}`;
  const filePath = `${dir}/${fileName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    const client = getSupabaseServerClient();
    if (!client) return badRequest("Supabase belum terkonfigurasi dengan benar.");
    const { bucket } = getSupabaseConfig();

    const { error } = await client.storage.from(bucket).upload(filePath, bytes, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) {
      return new Response(JSON.stringify({ message: `Upload Supabase gagal: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data } = client.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || "";
    return new Response(JSON.stringify({ url: publicUrl, path: filePath }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const relativeUrl = uploadType === "guideTemplate" ? `/files/${fileName}` : `/uploads/${dir}/${fileName}`;
  const absoluteDir = uploadType === "guideTemplate"
    ? path.join(process.cwd(), "public", "files")
    : path.join(process.cwd(), "public", "uploads", dir);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, fileName), bytes);

  return new Response(JSON.stringify({ url: relativeUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
