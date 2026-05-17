import type { APIRoute } from "astro";
import { getSupabaseConfig, isSupabaseConfigured } from "../../lib/supabase-server";

export const GET: APIRoute = async () => {
  const supabase = isSupabaseConfigured();
  const { bucket } = getSupabaseConfig();
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      storage: supabase ? "supabase" : "local",
      ...(supabase ? { supabaseBucket: bucket } : {}),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
};
