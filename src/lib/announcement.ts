import type { AnnouncementPageContent, AnnouncementSectionContent } from "../data/content.schema";

export function isAnnouncementSectionFilled(section: AnnouncementSectionContent): boolean {
  const body = section.body?.trim() ?? "";
  const bullets = section.bullets?.filter((b) => b.trim()) ?? [];
  const sheet = section.sheetEmbedUrl?.trim() ?? "";
  const links = section.links?.filter((l) => l.label?.trim() && l.href?.trim()) ?? [];
  const galleryId = section.gallerySectionId?.trim() ?? "";
  return Boolean(body || bullets.length > 0 || sheet || links.length > 0 || galleryId);
}

export function isAnnouncementNavVisible(page: AnnouncementPageContent): boolean {
  return page.enabled === true && page.sections.some(isAnnouncementSectionFilled);
}

export function getFilledAnnouncementSections(page: AnnouncementPageContent): AnnouncementSectionContent[] {
  return page.sections.filter(isAnnouncementSectionFilled);
}
