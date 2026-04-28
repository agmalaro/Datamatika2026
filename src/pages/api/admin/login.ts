import type { APIRoute } from "astro";
import { login } from "../../../lib/admin-auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return new Response(JSON.stringify({ message: "Payload login tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return new Response(JSON.stringify({ message: "Username dan password wajib diisi." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ok = login(cookies, username, password);
  if (!ok) {
    return new Response(JSON.stringify({ message: "Kredensial tidak valid." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
