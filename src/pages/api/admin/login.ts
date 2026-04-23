import type { APIRoute } from "astro";
import { login } from "../../../lib/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { username?: string; password?: string };
  try {
    const text = await request.text();
    if (!text.trim()) {
      return new Response(JSON.stringify({ message: "Body kosong. Kirim JSON username & password." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    body = JSON.parse(text) as { username?: string; password?: string };
  } catch {
    return new Response(JSON.stringify({ message: "Payload login bukan JSON yang valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const ok = login(cookies, body.username ?? "", body.password ?? "");
    if (!ok) {
      return new Response(JSON.stringify({ message: "Username atau password salah." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[api/admin/login]", err);
    return new Response(
      JSON.stringify({
        message:
          "Kesalahan server saat login. Di Netlify, set env ADMIN_USERNAME, ADMIN_PASSWORD, dan ADMIN_SESSION_SECRET (lihat .env.example).",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
