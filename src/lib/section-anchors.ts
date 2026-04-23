/** Section ids on the landing page — keep in sync with `SiteHeader` and section components. */
export const LANDING_SECTION_HASHES: { value: string; label: string }[] = [
  { value: "#beranda", label: "Beranda" },
  { value: "#about", label: "Tentang" },
  { value: "#timeline", label: "Timeline" },
  { value: "#speakers", label: "Pembicara" },
  { value: "#upload", label: "Unggah file" },
  { value: "#contact", label: "Kontak" },
];

export const SECONDARY_URL_OPTIONS: { value: string; label: string }[] = [
  ...LANDING_SECTION_HASHES,
  { value: "/agenda", label: "Agenda" },
  { value: "/maps", label: "Maps" },
  { value: "/galeri", label: "Galeri" },
  { value: "/panduan", label: "Panduan" },
];

const CANON = new Map(SECONDARY_URL_OPTIONS.map((item) => [item.value.toLowerCase(), item.value]));

/**
 * Normalizes known internal links (e.g. #Timeline -> #timeline, /PANDUAN -> /panduan).
 * Full http(s) URLs are returned unchanged.
 */
export function normalizeSectionHashForSecondaryUrl(value: string, fallback: string): string {
  const t = (value || "").trim();
  if (!t) return fallback;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const c = CANON.get(t.toLowerCase());
  if (c) return c;
  return t;
}
