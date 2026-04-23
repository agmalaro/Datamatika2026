import type { APIRoute } from "astro";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { isAuthenticated } from "../../../lib/admin-auth";
import { getSupabaseConfig, getSupabaseServerClient, isSupabaseConfigured } from "../../../lib/supabase-server";

export const prerender = false;

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_TEMPLATE_MIME_TO_EXT: Record<string, string> = {
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/pdf": "pdf",
};

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function templateExtFromName(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".pdf")) return "pdf";
  return "";
}

async function uploadToSupabaseStorage(objectPath: string, body: Buffer, contentType: string): Promise<string> {
  const client = getSupabaseServerClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi.");
  const { bucket } = getSupabaseConfig();
  const { error } = await client.storage.from(bucket).upload(objectPath, body, {
    upsert: true,
    contentType,
  });
  if (error) throw error;
  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return badRequest("Unauthorized", 401);
  try {
    const formData = await request.formData();
    const uploadType = typeof formData.get("uploadType") === "string" ? String(formData.get("uploadType")) : "";
    const imageFile = formData.get("image");
    const genericFile = formData.get("file");
    const file = imageFile instanceof File ? imageFile : genericFile instanceof File ? genericFile : null;

    if (!(file instanceof File)) {
      return badRequest("File tidak ditemukan.");
    }

    if (uploadType === "guideTemplate") {
      const ext = ALLOWED_TEMPLATE_MIME_TO_EXT[file.type] || templateExtFromName(file.name);
      if (!ext) {
        return badRequest("Format file template tidak didukung. Gunakan DOC, DOCX, atau PDF.");
      }

      if (file.size > 10 * 1024 * 1024) {
        return badRequest("Ukuran file template maksimal 10MB.");
      }

      const fileName = `template-artikel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const objectPath = `files/${fileName}`;
      let publicUrl = "";
      if (isSupabaseConfigured()) {
        publicUrl = await uploadToSupabaseStorage(objectPath, buffer, file.type || "application/octet-stream");
      } else {
        const isHosted = Boolean(import.meta.env.NETLIFY) || import.meta.env.VERCEL === "1";
        if (isHosted) {
          return badRequest("Upload butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di hosting.", 503);
        }
        const filesDir = fileURLToPath(new URL("../../../../public/files", import.meta.url));
        mkdirSync(filesDir, { recursive: true });
        const destination = path.join(filesDir, fileName);
        writeFileSync(destination, buffer);
        publicUrl = `/files/${fileName}`;
      }

      return new Response(
        JSON.stringify({
          url: publicUrl,
          message: "Template berhasil diunggah.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const ext = ALLOWED_MIME_TO_EXT[file.type];
    if (!ext) {
      return badRequest("Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.");
    }

    const maxSizeBytes = uploadType === "heroBg" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    const maxSizeLabel = uploadType === "heroBg" ? "5MB" : "2MB";
    if (file.size > maxSizeBytes) {
      return badRequest(`Ukuran gambar maksimal ${maxSizeLabel}.`);
    }

    const uploadsSubdir =
      uploadType === "heroBg" ? "hero" : uploadType === "gallery" ? "gallery" : uploadType === "guideFlowImage" ? "panduan" : "speakers";

    const fileBase = `${uploadType || "image"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileName = uploadType === "heroBg" ? `${fileBase}.webp` : `${fileBase}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    let outputBuffer = buffer;
    let outputMime = file.type || "application/octet-stream";
    if (uploadType === "heroBg") {
      // Hero background is resized and compressed for faster first paint on landing page.
      outputBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 82 })
        .toBuffer();
      outputMime = "image/webp";
    }
    const objectPath = `uploads/${uploadsSubdir}/${fileName}`;
    let publicUrl = "";
    if (isSupabaseConfigured()) {
      publicUrl = await uploadToSupabaseStorage(objectPath, outputBuffer, outputMime);
    } else {
      const isHosted = Boolean(import.meta.env.NETLIFY) || import.meta.env.VERCEL === "1";
      if (isHosted) {
        return badRequest("Upload butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di hosting.", 503);
      }
      const uploadsDir = fileURLToPath(new URL(`../../../../public/uploads/${uploadsSubdir}`, import.meta.url));
      mkdirSync(uploadsDir, { recursive: true });
      const destination = path.join(uploadsDir, fileName);
      writeFileSync(destination, outputBuffer);
      publicUrl = `/uploads/${uploadsSubdir}/${fileName}`;
    }

    return new Response(
      JSON.stringify({
        url: publicUrl,
        message: "Gambar berhasil diunggah.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[api/admin/upload]", error);
    return badRequest("Upload gagal. Periksa konfigurasi Supabase dan izin bucket.", 500);
  }
};
