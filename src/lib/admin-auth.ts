import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { AstroCookies } from "astro";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;
const ADMIN_FILE_PATH = fileURLToPath(new URL("../data/admin.local.json", import.meta.url));

function credential(key: string, fallback: string): string {
  const value = import.meta.env[key];
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function getAdminConfig() {
  return {
    username: credential("ADMIN_USERNAME", "admin"),
    password: credential("ADMIN_PASSWORD", ""),
    secret: credential("ADMIN_SESSION_SECRET", "dev-only-change-me"),
  };
}

function hashPassword(password: string, salt?: string): string {
  const activeSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, activeSalt, 64).toString("hex");
  return `${activeSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function readLocalAuth(): { username: string; passwordHash: string } | null {
  try {
    const raw = readFileSync(ADMIN_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as { username?: string; passwordHash?: string };
    if (!parsed?.username || !parsed?.passwordHash) return null;
    return { username: parsed.username, passwordHash: parsed.passwordHash };
  } catch {
    return null;
  }
}

function saveLocalAuth(username: string, passwordHash: string): void {
  const payload = JSON.stringify({ username, passwordHash }, null, 2);
  writeFileSync(ADMIN_FILE_PATH, `${payload}\n`, "utf-8");
}

function ensureLocalAuth(username: string): { username: string; passwordHash: string } {
  const existing = readLocalAuth();
  if (existing) return existing;
  const created = { username, passwordHash: hashPassword("admindatamatika1p8") };
  try {
    saveLocalAuth(created.username, created.passwordHash);
  } catch {
    // Netlify/serverless: repo FS is read-only — login still works per cold start; set ADMIN_PASSWORD in env for production.
  }
  return created;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function createToken(username: string, secret: string): string {
  const payload = `${username}.${Date.now()}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function isValidToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length < 3) return false;
  const signature = parts.pop() as string;
  const payload = parts.join(".");
  return sign(payload, secret) === signature;
}

export function isAuthenticated(cookies: AstroCookies): boolean {
  const { secret } = getAdminConfig();
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return isValidToken(token, secret);
}

export function login(cookies: AstroCookies, username: string, password: string): boolean {
  const config = getAdminConfig();
  let valid = false;

  if (config.password) {
    valid = username === config.username && password === config.password;
  } else {
    const local = ensureLocalAuth(config.username);
    valid = username === local.username && verifyPassword(password, local.passwordHash);
  }

  if (!valid) return false;

  cookies.set(COOKIE_NAME, createToken(username, config.secret), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export function logout(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: "/" });
}

export function changePassword(currentPassword: string, nextPassword: string): { ok: boolean; message: string } {
  const config = getAdminConfig();

  if (config.password) {
    return {
      ok: false,
      message: "Password dikelola lewat env ADMIN_PASSWORD. Ubah dari file .env.",
    };
  }

  const local = ensureLocalAuth(config.username);
  if (!verifyPassword(currentPassword, local.passwordHash)) {
    return { ok: false, message: "Password saat ini tidak sesuai." };
  }

  if (nextPassword.length < 8) {
    return { ok: false, message: "Password baru minimal 8 karakter." };
  }

  try {
    saveLocalAuth(local.username, hashPassword(nextPassword));
  } catch {
    return {
      ok: false,
      message: "Tidak bisa menyimpan password (filesystem read-only). Atur ADMIN_PASSWORD di Netlify / hosting.",
    };
  }
  return { ok: true, message: "Password admin berhasil diperbarui." };
}
