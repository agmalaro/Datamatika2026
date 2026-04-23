import type { APIRoute } from "astro";
import { changePassword, isAuthenticated } from "../../../lib/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      nextPassword?: string;
      confirmPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const nextPassword = body.nextPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!currentPassword || !nextPassword || !confirmPassword) {
      return new Response(JSON.stringify({ message: "Semua field password wajib diisi." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (nextPassword !== confirmPassword) {
      return new Response(JSON.stringify({ message: "Konfirmasi password baru tidak cocok." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = changePassword(currentPassword, nextPassword);
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Payload password tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
