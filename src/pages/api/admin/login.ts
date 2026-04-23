import type { APIRoute } from "astro";
import { login } from "../../../lib/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
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
  } catch {
    return new Response(JSON.stringify({ message: "Payload login tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
