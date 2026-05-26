export type GoogleEmbedKind = "form" | "sheet";

function extractIframeSrc(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.includes("<iframe")) return trimmed;
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  return srcMatch?.[1]?.trim() ?? "";
}

function isAllowedHost(hostname: string, kind: GoogleEmbedKind): boolean {
  if (hostname !== "docs.google.com") return false;
  return true;
}

function isAllowedPath(pathname: string, kind: GoogleEmbedKind): boolean {
  if (kind === "form") return pathname.includes("/forms/");
  return pathname.includes("/spreadsheets/");
}

function withEmbeddedFormParam(url: URL): string {
  if (!url.pathname.includes("/forms/")) return url.toString();
  if (!url.searchParams.has("embedded")) {
    url.searchParams.set("embedded", "true");
  }
  return url.toString();
}

export function resolveGoogleEmbedUrl(raw: string, kind: GoogleEmbedKind): string {
  const candidate = extractIframeSrc(raw);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (!isAllowedHost(url.hostname, kind)) return "";
    if (!isAllowedPath(url.pathname, kind)) return "";

    if (kind === "form") return withEmbeddedFormParam(url);
    return url.toString();
  } catch {
    return "";
  }
}
