import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defaultSiteContent } from "../data/content.defaults";
import type { SiteContent } from "../data/content.schema";
import { normalizeSectionHashForSecondaryUrl } from "./section-anchors";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase-server";

const CONTENT_FILE_PATH = fileURLToPath(new URL("../data/content.local.json", import.meta.url));
const CONTENT_ROW_ID = "main";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readContentFile(): SiteContent | null {
  try {
    const raw = readFileSync(CONTENT_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeContent(parsed);
  } catch {
    return null;
  }
}

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function slugifyGalleryId(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function sanitizeGalleryItems(raw: unknown[]): { caption?: string; image: string }[] {
  return raw
    .filter(isRecord)
    .map((item) => {
      const caption = typeof item.caption === "string" ? item.caption.trim() : "";
      const image = typeof item.image === "string" ? item.image.trim() : "";
      return {
        ...(caption ? { caption } : {}),
        image,
      };
    })
    .filter((item) => item.image)
    .map((item) => ({
      ...(item.caption ? { caption: item.caption } : {}),
      image: item.image,
    }));
}

function dedupeGallerySectionIds(
  sections: { id: string; label: string; items: { caption?: string; image: string }[] }[]
) {
  const used = new Set<string>();
  return sections.map((section) => {
    let baseId = slugifyGalleryId(section.id || section.label) || "section";
    let id = baseId;
    let n = 2;
    while (used.has(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }
    used.add(id);
    return { ...section, id };
  });
}

function sanitizeGalleryPage(value: Record<string, unknown>): typeof defaultSiteContent.galleryPage {
  const legacyGallery = Array.isArray(value.gallery) ? value.gallery : [];
  const galleryPageValue = isRecord(value.galleryPage) ? value.galleryPage : null;

  let title = defaultSiteContent.galleryPage.title;
  let sectionsRaw: unknown[] = [];

  if (galleryPageValue) {
    title = sanitizeString(galleryPageValue.title, defaultSiteContent.galleryPage.title);
    sectionsRaw = Array.isArray(galleryPageValue.sections) ? galleryPageValue.sections : [];
  } else if (legacyGallery.length > 0) {
    sectionsRaw = [{ id: "seminar", label: "Galeri Seminar", items: legacyGallery }];
  }

  const sections = dedupeGallerySectionIds(
    sectionsRaw
      .filter(isRecord)
      .map((sec) => {
        const label = typeof sec.label === "string" ? sec.label.trim() : "";
        const idRaw = typeof sec.id === "string" ? sec.id.trim() : "";
        const items = Array.isArray(sec.items) ? sanitizeGalleryItems(sec.items) : [];
        const id = slugifyGalleryId(idRaw || label) || "section";
        return { id, label, items };
      })
      .filter((sec) => sec.label.length > 0)
  );

  if (sections.length === 0) {
    return defaultSiteContent.galleryPage;
  }

  return { title, sections };
}

function sanitizeAnnouncementLinks(raw: unknown): { label: string; href: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      href: typeof item.href === "string" ? item.href.trim() : "",
    }))
    .filter((item) => item.label && item.href);
}

function sanitizeAnnouncementPage(value: Record<string, unknown>): typeof defaultSiteContent.announcementPage {
  const ap = isRecord(value.announcementPage) ? value.announcementPage : {};
  const sectionsRaw = Array.isArray(ap.sections) ? ap.sections : [];

  const sections = dedupeGallerySectionIds(
    sectionsRaw
      .filter(isRecord)
      .map((sec) => {
        const label = typeof sec.label === "string" ? sec.label.trim() : "";
        const idRaw = typeof sec.id === "string" ? sec.id.trim() : "";
        const body = typeof sec.body === "string" ? sec.body.trim() : "";
        const bullets = Array.isArray(sec.bullets)
          ? sec.bullets.map((b) => (typeof b === "string" ? b.trim() : "")).filter(Boolean)
          : [];
        const sheetEmbedUrl = typeof sec.sheetEmbedUrl === "string" ? sec.sheetEmbedUrl.trim() : "";
        const gallerySectionId =
          typeof sec.gallerySectionId === "string" ? sec.gallerySectionId.trim() : "";
        const links = sanitizeAnnouncementLinks(sec.links);
        const id = slugifyGalleryId(idRaw || label) || "section";
        return {
          id,
          label,
          body,
          bullets,
          links,
          ...(sheetEmbedUrl ? { sheetEmbedUrl } : {}),
          ...(gallerySectionId ? { gallerySectionId } : {}),
        };
      })
      .filter((sec) => sec.label.length > 0)
  );

  return {
    enabled: ap.enabled === true,
    showHomeBanner: ap.showHomeBanner === true,
    homeBannerText: sanitizeString(
      ap.homeBannerText,
      defaultSiteContent.announcementPage.homeBannerText
    ),
    homeBannerButtonLabel: sanitizeString(
      ap.homeBannerButtonLabel,
      defaultSiteContent.announcementPage.homeBannerButtonLabel
    ),
    navLabel: sanitizeString(ap.navLabel, defaultSiteContent.announcementPage.navLabel),
    title: sanitizeString(ap.title, defaultSiteContent.announcementPage.title),
    intro: sanitizeString(ap.intro, defaultSiteContent.announcementPage.intro),
    sections:
      sections.length > 0 ? sections : defaultSiteContent.announcementPage.sections,
  };
}

function sanitizeContent(value: unknown): SiteContent {
  if (!isRecord(value)) return defaultSiteContent;

  const siteMetaValue = isRecord(value.siteMeta) ? value.siteMeta : {};
  const aboutValue = isRecord(value.about) ? value.about : {};
  const timelineValue = Array.isArray(value.timeline) ? value.timeline : [];
  const uploadNoteValue = isRecord(value.uploadNote) ? value.uploadNote : {};
  const contactValue = isRecord(value.contact) ? value.contact : {};
  const contactPhonesValue = Array.isArray(contactValue.phones) ? contactValue.phones : [];
  const footerValue = isRecord(value.footer) ? value.footer : {};
  const footerProgramLinksRaw = Array.isArray(footerValue.programLinks) ? footerValue.programLinks : [];
  const footerProgramLinksSanitized = footerProgramLinksRaw
    .filter(isRecord)
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      href: typeof item.href === "string" ? item.href.trim() : "",
    }))
    .filter((item) => item.label && item.href);

  const guideValue = isRecord(value.guide) ? value.guide : {};
  const guideFeeValue = isRecord(guideValue.fee) ? guideValue.fee : {};
  const guideEditorialRaw = Array.isArray(guideValue.editorialSections) ? guideValue.editorialSections : [];
  const guideEditorialSanitized = guideEditorialRaw
    .filter(isRecord)
    .map((sec) => {
      const heading = typeof sec.heading === "string" ? sec.heading.trim() : "";
      const body = typeof sec.body === "string" ? sec.body.trim() : "";
      const bullets = Array.isArray(sec.bullets)
        ? sec.bullets.map((b) => (typeof b === "string" ? b.trim() : "")).filter(Boolean)
        : [];
      const image = typeof sec.image === "string" ? sec.image.trim() : "";
      const imageAlt = typeof sec.imageAlt === "string" ? sec.imageAlt.trim() : "";
      const sheetEmbedUrl = typeof sec.sheetEmbedUrl === "string" ? sec.sheetEmbedUrl.trim() : "";
      const formEmbedUrl = typeof sec.formEmbedUrl === "string" ? sec.formEmbedUrl.trim() : "";
      return {
        heading,
        body,
        bullets,
        ...(image ? { image } : {}),
        ...(imageAlt ? { imageAlt } : {}),
        ...(sheetEmbedUrl ? { sheetEmbedUrl } : {}),
        ...(formEmbedUrl ? { formEmbedUrl } : {}),
      };
    })
    .filter((sec) => sec.heading && (sec.body.length > 0 || sec.bullets.length > 0));
  const agendaValue = isRecord(value.agenda) ? value.agenda : {};
  const agendaItemsValue = Array.isArray(agendaValue.items) ? agendaValue.items : [];
  const timelineImageValue = typeof value.timelineImage === "string" ? value.timelineImage : "";
  const speakersValue = Array.isArray(value.speakers) ? value.speakers : [];
  const partnersValue = Array.isArray(value.partners) ? value.partners : [];
  const galleryPage = sanitizeGalleryPage(value);
  const announcementPage = sanitizeAnnouncementPage(value);

  return {
    siteMeta: {
      title: sanitizeString(siteMetaValue.title, defaultSiteContent.siteMeta.title),
      description: sanitizeString(siteMetaValue.description, defaultSiteContent.siteMeta.description),
      publishedUrl: sanitizeString(siteMetaValue.publishedUrl, defaultSiteContent.siteMeta.publishedUrl),
      registrationUrl: sanitizeString(siteMetaValue.registrationUrl, defaultSiteContent.siteMeta.registrationUrl),
      orgLine: sanitizeString(siteMetaValue.orgLine, defaultSiteContent.siteMeta.orgLine),
      heroEyebrow: sanitizeString(siteMetaValue.heroEyebrow, defaultSiteContent.siteMeta.heroEyebrow),
      heroBg: typeof siteMetaValue.heroBg === "string" ? siteMetaValue.heroBg.trim() : "",
      heroLogo: typeof siteMetaValue.heroLogo === "string" ? siteMetaValue.heroLogo.trim() : "",
      mapsAddress: sanitizeString(siteMetaValue.mapsAddress, defaultSiteContent.siteMeta.mapsAddress ?? ""),
      mapsEmbedUrl: typeof siteMetaValue.mapsEmbedUrl === "string" ? siteMetaValue.mapsEmbedUrl.trim() : "",
      eventStartsAt: sanitizeString(siteMetaValue.eventStartsAt, defaultSiteContent.siteMeta.eventStartsAt),
      eventDateLabel: sanitizeString(siteMetaValue.eventDateLabel, defaultSiteContent.siteMeta.eventDateLabel),
    },
    about: {
      heading: sanitizeString(aboutValue.heading, defaultSiteContent.about.heading),
      body: sanitizeString(aboutValue.body, defaultSiteContent.about.body),
      image: typeof aboutValue.image === "string" ? aboutValue.image.trim() : "",
    },
    timeline: timelineValue
      .filter(isRecord)
      .map((item) => ({
        date: sanitizeString(item.date, ""),
        label: sanitizeString(item.label, ""),
      }))
      .filter((item) => item.date && item.label),
    uploadNote: {
      title: sanitizeString(uploadNoteValue.title, defaultSiteContent.uploadNote.title),
      body: sanitizeString(uploadNoteValue.body, defaultSiteContent.uploadNote.body),
      primaryLabel: sanitizeString(uploadNoteValue.primaryLabel, defaultSiteContent.uploadNote.primaryLabel),
      primaryUrl: sanitizeString(uploadNoteValue.primaryUrl, defaultSiteContent.uploadNote.primaryUrl),
      secondaryLabel: sanitizeString(uploadNoteValue.secondaryLabel, defaultSiteContent.uploadNote.secondaryLabel),
      secondaryUrl: normalizeSectionHashForSecondaryUrl(
        sanitizeString(uploadNoteValue.secondaryUrl, defaultSiteContent.uploadNote.secondaryUrl),
        defaultSiteContent.uploadNote.secondaryUrl
      ),
    },
    contact: {
      heading: sanitizeString(contactValue.heading, defaultSiteContent.contact.heading),
      address: sanitizeString(contactValue.address, defaultSiteContent.contact.address),
      phones:
        contactPhonesValue
          .filter(isRecord)
          .map((item) => ({
            name: sanitizeString(item.name, ""),
            tel: sanitizeString(item.tel, ""),
            display: sanitizeString(item.display, ""),
          }))
          .filter((item) => item.name && item.tel && item.display)
          .map((item) => ({
            name: item.name,
            tel: item.tel,
            display: item.display,
          })).length > 0
          ? contactPhonesValue
              .filter(isRecord)
              .map((item) => ({
                name: sanitizeString(item.name, ""),
                tel: sanitizeString(item.tel, ""),
                display: sanitizeString(item.display, ""),
              }))
              .filter((item) => item.name && item.tel && item.display)
              .map((item) => ({
                name: item.name,
                tel: item.tel,
                display: item.display,
              }))
          : defaultSiteContent.contact.phones,
      email: sanitizeString(contactValue.email, defaultSiteContent.contact.email),
    },
    footer: {
      kicker: sanitizeString(footerValue.kicker, defaultSiteContent.footer.kicker),
      programLinks:
        footerProgramLinksSanitized.length > 0 ? footerProgramLinksSanitized : defaultSiteContent.footer.programLinks,
      bannerImage: typeof footerValue.bannerImage === "string" ? footerValue.bannerImage.trim() : "",
      bannerAlt: sanitizeString(footerValue.bannerAlt, defaultSiteContent.footer.bannerAlt),
      copyright: sanitizeString(footerValue.copyright, defaultSiteContent.footer.copyright),
    },
    timelineImage: timelineImageValue.trim(),
    speakers: speakersValue
      .filter(isRecord)
      .map((item) => ({
        title: sanitizeString(item.title, ""),
        href: typeof item.href === "string" ? item.href.trim() : "",
        image: typeof item.image === "string" ? item.image.trim() : "",
      }))
      .filter((item) => item.title)
      .map((item) => ({
        title: item.title,
        ...(item.href ? { href: item.href } : {}),
        ...(item.image ? { image: item.image } : {}),
      })),
    partners: partnersValue
      .filter(isRecord)
      .map((item) => ({
        name: sanitizeString(item.name, ""),
        image: typeof item.image === "string" ? item.image.trim() : "",
      }))
      .filter((item) => item.name && item.image)
      .map((item) => ({
        name: item.name,
        image: item.image,
      })),
    galleryPage,
    announcementPage,
    guide: {
      pageTitle: sanitizeString(guideValue.pageTitle, defaultSiteContent.guide.pageTitle),
      pageIntro:
        typeof guideValue.pageIntro === "string" && guideValue.pageIntro.trim().length > 0
          ? guideValue.pageIntro.trim()
          : defaultSiteContent.guide.pageIntro,
      editorialSections:
        guideEditorialSanitized.length > 0 ? guideEditorialSanitized : defaultSiteContent.guide.editorialSections,
      flowTitle: sanitizeString(guideValue.flowTitle, defaultSiteContent.guide.flowTitle),
      flowSteps:
        (Array.isArray(guideValue.flowSteps) ? guideValue.flowSteps : [])
          .map((step) => (typeof step === "string" ? step.trim() : ""))
          .filter(Boolean).length > 0
          ? (Array.isArray(guideValue.flowSteps) ? guideValue.flowSteps : [])
              .map((step) => (typeof step === "string" ? step.trim() : ""))
              .filter(Boolean)
          : defaultSiteContent.guide.flowSteps,
      flowImage: typeof guideValue.flowImage === "string" ? guideValue.flowImage.trim() : "",
      templateLabel: sanitizeString(guideValue.templateLabel, defaultSiteContent.guide.templateLabel),
      templateUrl: sanitizeString(guideValue.templateUrl, defaultSiteContent.guide.templateUrl),
      fee: {
        type: guideFeeValue.type === "paid" ? "paid" : "free",
        freeText: sanitizeString(guideFeeValue.freeText, defaultSiteContent.guide.fee.freeText),
        paidAmount: sanitizeString(guideFeeValue.paidAmount, defaultSiteContent.guide.fee.paidAmount),
        paidAccountNumber: sanitizeString(
          guideFeeValue.paidAccountNumber,
          defaultSiteContent.guide.fee.paidAccountNumber
        ),
        paidAccountName: sanitizeString(guideFeeValue.paidAccountName, defaultSiteContent.guide.fee.paidAccountName),
      },
    },
    agenda: {
      title: sanitizeString(agendaValue.title, defaultSiteContent.agenda.title),
      intro: sanitizeString(agendaValue.intro, defaultSiteContent.agenda.intro),
      items:
        agendaItemsValue
          .filter(isRecord)
          .map((item) => ({
            day: sanitizeString(item.day, ""),
            time: sanitizeString(item.time, ""),
            agenda: sanitizeString(item.agenda, ""),
            detail: typeof item.detail === "string" ? item.detail.trim() : "",
          }))
          .filter((item) => item.day && item.time && item.agenda)
          .map((item) => ({
            day: item.day,
            time: item.time,
            agenda: item.agenda,
            ...(item.detail ? { detail: item.detail } : {}),
          })).length > 0
          ? agendaItemsValue
              .filter(isRecord)
              .map((item) => ({
                day: sanitizeString(item.day, ""),
                time: sanitizeString(item.time, ""),
                agenda: sanitizeString(item.agenda, ""),
                detail: typeof item.detail === "string" ? item.detail.trim() : "",
              }))
              .filter((item) => item.day && item.time && item.agenda)
              .map((item) => ({
                day: item.day,
                time: item.time,
                agenda: item.agenda,
                ...(item.detail ? { detail: item.detail } : {}),
              }))
          : defaultSiteContent.agenda.items,
    },
  };
}

async function readSupabaseContent(): Promise<SiteContent | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.from("site_content").select("payload").eq("id", CONTENT_ROW_ID).maybeSingle();
  if (error) {
    console.error("[content-store] readSupabaseContent", error);
    return null;
  }
  return sanitizeContent(data?.payload ?? null);
}

async function saveSupabaseContent(content: SiteContent): Promise<SiteContent | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;
  const sanitized = sanitizeContent(content);
  const { error } = await client.from("site_content").upsert(
    {
      id: CONTENT_ROW_ID,
      payload: sanitized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[content-store] saveSupabaseContent", error);
    throw new Error("Gagal menyimpan konten ke Supabase.");
  }
  return sanitized;
}

export async function getSiteContent(): Promise<SiteContent> {
  if (isSupabaseConfigured()) {
    const fromSupabase = await readSupabaseContent();
    if (fromSupabase) return fromSupabase;
  }
  const local = readContentFile();
  return local ?? defaultSiteContent;
}

export async function saveSiteContent(content: SiteContent): Promise<SiteContent> {
  if (isSupabaseConfigured()) {
    const saved = await saveSupabaseContent(content);
    if (saved) return saved;
  }
  const isHosted = Boolean(import.meta.env.NETLIFY) || import.meta.env.VERCEL === "1";
  if (isHosted) {
    throw new Error("Storage eksternal belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.");
  }
  const sanitized = sanitizeContent(content);
  const json = JSON.stringify(sanitized, null, 2);
  writeFileSync(CONTENT_FILE_PATH, `${json}\n`, "utf-8");
  return sanitized;
}
