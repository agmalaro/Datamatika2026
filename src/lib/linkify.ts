import { escapeHtml } from "./escape-html";

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function linkifyPlainText(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(URL_REGEX, (match) => {
    let url = match;
    let suffix = "";
    while (/[.,;:!?)}\]]$/.test(url)) {
      suffix = url.slice(-1) + suffix;
      url = url.slice(0, -1);
    }
    if (!isSafeHttpUrl(url)) return match;
    const href = escapeHtml(url);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>${suffix}`;
  });
}
