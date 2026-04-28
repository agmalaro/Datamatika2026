import { createClient } from "@supabase/supabase-js";

type SupabaseServerClient = ReturnType<typeof createClient>;

function cleanEnv(name: string): string {
  const runtimeValue = typeof process !== "undefined" ? process.env[name] : undefined;
  const value = runtimeValue ?? import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function getSupabaseConfig() {
  return {
    url: cleanEnv("SUPABASE_URL"),
    serviceRoleKey: cleanEnv("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: cleanEnv("SUPABASE_BUCKET") || "cms-assets",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}

let cachedClient: SupabaseServerClient | null = null;

export function getSupabaseServerClient(): SupabaseServerClient | null {
  if (cachedClient) return cachedClient;
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) return null;
  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}
