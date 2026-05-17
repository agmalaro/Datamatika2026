/**
 * Load env files into process.env before Astro/Vite starts.
 * Order: .env.production (shared with Docker) then .env (local overrides).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * @param {string} filePath
 * @param {{ override?: boolean }} [options] — override true: always set keys from file
 */
function parseEnvFile(filePath, options = {}) {
  const { override = false } = options;
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf-8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && (override || process.env[key] === undefined)) {
      process.env[key] = value;
    }
  }
}

/** @param {{ allowProductionFallback?: boolean }} [options] */
export function loadEnvFiles(options = {}) {
  const { allowProductionFallback = true } = options;
  if (allowProductionFallback) {
    parseEnvFile(resolve(root, ".env.production"), { override: false });
  }
  parseEnvFile(resolve(root, ".env"), { override: true });
}

loadEnvFiles();
