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

function sanitizeContent(value: unknown): SiteContent {
  if (!isRecord(value)) return defaultSiteContent;

  const siteMetaValue = isRecord(value.siteMeta) ? value.siteMeta : {};
  const aboutValue = isRecord(value.about) ? value.about : {};
  const timelineValue = Array.isArray(value.timeline) ? value.timeline : [];
  const uploadNoteValue = isRecord(value.uploadNote) ? value.uploadNote : {};
  const guideValue = isRecord(value.guide) ? value.guide : {};
  const guideFeeValue = isRecord(guideValue.fee) ? guideValue.fee : {};
  const agendaValue = isRecord(value.agenda) ? value.agenda : {};
  const agendaItemsValue = Array.isArray(agendaValue.items) ? agendaValue.items : [];
  const timelineImageValue = typeof value.timelineImage === "string" ? value.timelineImage : "";
  const speakersValue = Array.isArray(value.speakers) ? value.speakers : [];
  const partnersValue = Array.isArray(value.partners) ? value.partners : [];
  const galleryValue = Array.isArray(value.gallery) ? value.gallery : [];

  return {
    siteMeta: {
      title: sanitizeString(siteMetaValue.title, defaultSiteContent.siteMeta.title),
      description: sanitizeString(siteMetaValue.description, defaultSiteContent.siteMeta.description),
      publishedUrl: sanitizeString(siteMetaValue.publishedUrl, defaultSiteContent.siteMeta.publishedUrl),
      registrationUrl: sanitizeString(siteMetaValue.registrationUrl, defaultSiteContent.siteMeta.registrationUrl),
      orgLine: sanitizeString(siteMetaValue.orgLine, defaultSiteContent.siteMeta.orgLine),
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
    gallery: galleryValue
      .filter(isRecord)
      .map((item) => ({
        caption: typeof item.caption === "string" ? item.caption.trim() : "",
        image: typeof item.image === "string" ? item.image.trim() : "",
      }))
      .filter((item) => item.image)
      .map((item) => ({
        ...(item.caption ? { caption: item.caption } : {}),
        image: item.image,
      })),
    guide: {
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
