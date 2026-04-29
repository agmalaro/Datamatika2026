import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";

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
  output: "server",
  adapter: pickAdapter(),
});
