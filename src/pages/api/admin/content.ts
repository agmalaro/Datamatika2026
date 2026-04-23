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
  return new Response(JSON.stringify(getSiteContent()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorized();

  try {
    const payload = (await request.json()) as SiteContent;
    const saved = saveSiteContent(payload);
    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Payload konten tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
