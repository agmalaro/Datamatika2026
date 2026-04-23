import type { APIRoute } from "astro";
import { isAuthenticated } from "../../../lib/admin-auth";
import { getSiteContent, saveSiteContent } from "../../../lib/content-store";
import type { SiteContent } from "../../../data/content.schema";

export const prerender = false;
const isReadonlyHosting = Boolean(import.meta.env.NETLIFY) || import.meta.env.VERCEL === "1";

function unauthorized() {
  return new Response(JSON.stringify({ message: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();
  return new Response(JSON.stringify(getSiteContent()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();

  if (isReadonlyHosting) {
    return new Response(
      JSON.stringify({
        message:
          "Mode hosting ini read-only. Simpan CMS nonaktif di production Netlify/Vercel tanpa storage eksternal.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

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
    const saved = saveSiteContent(payload);
    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/admin/content]", err);
    return new Response(
      JSON.stringify({
        message: "Gagal menyimpan konten ke filesystem server. Gunakan storage eksternal untuk production.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
