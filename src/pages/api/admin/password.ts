import type { APIRoute } from "astro";
import { changePassword, isAuthenticated } from "../../../lib/admin-auth";

type PasswordBody = {
  currentPassword?: string;
  nextPassword?: string;
  confirmPassword?: string;
};

function unauthorizedResponse() {
  return new Response(JSON.stringify({ message: "Unauthorized." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) return unauthorizedResponse();

  let body: PasswordBody;
  try {
    body = (await request.json()) as PasswordBody;
  } catch {
    return new Response(JSON.stringify({ message: "Payload password tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const nextPassword = typeof body.nextPassword === "string" ? body.nextPassword : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return new Response(JSON.stringify({ message: "Semua field password wajib diisi." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (nextPassword !== confirmPassword) {
    return new Response(JSON.stringify({ message: "Konfirmasi password baru tidak sama." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = changePassword(currentPassword, nextPassword);
  return new Response(JSON.stringify({ message: result.message }), {
    status: result.ok ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
};
