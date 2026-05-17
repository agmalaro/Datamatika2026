import "./scripts/load-env-files.mjs";
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";

function getSiteUrl() {
  return (process.env.SITE_URL ?? "").trim().replace(/\/$/, "");
}

/** Trust public host behind nginx so Origin matches request URL (fixes upload 403). */
function getSecurityAllowedDomains() {
  const domains = [
    { hostname: "localhost", protocol: "http" },
    { hostname: "127.0.0.1", protocol: "http" },
  ];
  const site = getSiteUrl();
  if (site) {
    try {
      const parsed = new URL(site);
      domains.push({
        hostname: parsed.hostname,
        protocol: parsed.protocol.replace(":", ""),
      });
    } catch {
      /* ignore invalid SITE_URL */
    }
  }
  return domains;
}

const siteUrl = getSiteUrl();
const checkOriginDisabled = process.env.ASTRO_SECURITY_CHECK_ORIGIN === "false";

const adapterTarget = (process.env.DEPLOY_ADAPTER ?? "").trim().toLowerCase();
const isVercel = adapterTarget === "vercel" || process.env.VERCEL === "1";
const isNetlify = adapterTarget === "netlify" || Boolean(process.env.NETLIFY);
const isNode = adapterTarget === "node";

function pickAdapter() {
  if (isVercel) {
    return vercel();
  }

  if (isNetlify || !adapterTarget) {
    return netlify({
      includeFiles: ["./src/data/content.local.json"],
    });
  }

  if (isNode) {
    return node({
      mode: "standalone",
    });
  }

  throw new Error(
    `Unknown DEPLOY_ADAPTER "${adapterTarget}". Use "netlify", "vercel", or "node".`,
  );
}

export default defineConfig({
  site: siteUrl || undefined,
  output: "server",
  adapter: pickAdapter(),
  security: {
    checkOrigin: !checkOriginDisabled,
    allowedDomains: getSecurityAllowedDomains(),
  },
});
