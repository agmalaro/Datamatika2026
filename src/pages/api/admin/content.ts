import type { APIRoute } from "astro";
import { isAuthenticated } from "../../../lib/admin-auth";
import { getSiteContent, saveSiteContent } from "../../../lib/content-store";
import type { SiteContent } from "../../../data/content.schema";

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ message: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();
  const content = await getSiteContent();
  return new Response(JSON.stringify(content), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();

  let payload: SiteContent;
  try {
    payload = (await request.json()) as SiteContent;
  } catch {
    return new Response(JSON.stringify({ message: "Payload konten bukan JSON yang valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const saved = await saveSiteContent(payload);
    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/admin/content]", err);
    return new Response(
      JSON.stringify({
        message: "Gagal menyimpan konten. Periksa konfigurasi Supabase (URL/key/tabel) atau storage lokal.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
