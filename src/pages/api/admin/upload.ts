import type { APIRoute } from "astro";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { isAuthenticated } from "../../../lib/admin-auth";

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

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return badRequest("Unauthorized", 401);

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

    const filesDir = fileURLToPath(new URL("../../../../public/files", import.meta.url));
    mkdirSync(filesDir, { recursive: true });

    const fileName = `template-artikel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const destination = path.join(filesDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(destination, buffer);

    return new Response(
      JSON.stringify({
        url: `/files/${fileName}`,
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
  const uploadsDir = fileURLToPath(new URL(`../../../../public/uploads/${uploadsSubdir}`, import.meta.url));
  mkdirSync(uploadsDir, { recursive: true });

  const fileBase = `${uploadType || "image"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = uploadType === "heroBg" ? `${fileBase}.webp` : `${fileBase}.${ext}`;
  const destination = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (uploadType === "heroBg") {
    // Hero background is resized and compressed for faster first paint on landing page.
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 82 })
      .toBuffer();
    writeFileSync(destination, optimized);
  } else {
    writeFileSync(destination, buffer);
  }

  return new Response(
    JSON.stringify({
      url: `/uploads/${uploadsSubdir}/${fileName}`,
      message: "Gambar berhasil diunggah.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
