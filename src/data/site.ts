/** Konten & aset landing — Seminar Nasional SSMI */
import ipbKoinBg from "../assets/backgrounds/ipb-koin.jpeg";
import ipbBg02 from "../assets/backgrounds/ipb-bg-02.png";
import ipbHeroNew from "../assets/backgrounds/ipb-bg-hero-new.png";
import datamatikaNavLogo from "../assets/logos/datamatika-nav-logo.png";
import speakerPlaceholder from "../assets/speakers/datamatika-speaker-placeholder.png";
import footerIpbSsmiBanner from "../assets/footer/ipb-ssmi-horizontal-banner.png";
import { getSiteContent } from "../lib/content-store";
import { isAnnouncementNavVisible } from "../lib/announcement";

const subtlePatternBg = "/patterns/empty.svg";

export const images = {
  logo: datamatikaNavLogo.src,
  heroBg: ipbHeroNew.src,
  aboutBg: subtlePatternBg,
  aboutPhoto: ipbKoinBg.src,
  timelineBg: subtlePatternBg,
  timelinePhoto: ipbBg02.src,
  speakersTitleBg: subtlePatternBg,
  speakersGridBg: subtlePatternBg,
  speaker1: speakerPlaceholder.src,
  speaker2: speakerPlaceholder.src,
  speaker3: speakerPlaceholder.src,
  ctaBg: subtlePatternBg,
  uploadBg: subtlePatternBg,
  footerSsmiBanner: footerIpbSsmiBanner.src,
} as const;

export type TimelineItem = { date: string; label: string };
export type Speaker = { src: string; title: string; href?: string };
export type GalleryItem = { src: string; caption?: string };
export type GallerySection = { id: string; label: string; items: GalleryItem[] };
export type AgendaItem = { day: string; time: string; agenda: string; detail?: string };

export async function getSiteData() {
  const content = await getSiteContent();
  const footerPartners =
    content.partners.length > 0
      ? content.partners.map((partner) => ({
          src: partner.image ?? "",
          alt: `Logo ${partner.name}`,
          name: partner.name,
        }))
      : [];
  const speakers: Speaker[] = content.speakers.map((speaker, index) => ({
    src: speaker.image || [images.speaker1, images.speaker2, images.speaker3][index] || images.speaker1,
    title: speaker.title,
    href: speaker.href,
  }));
  const galleryPage = {
    title: content.galleryPage.title?.trim() || "Galeri",
    sections: content.galleryPage.sections.map((section) => ({
      id: section.id,
      label: section.label,
      items: section.items.map((item) => ({
        src: item.image || "",
        ...(item.caption ? { caption: item.caption } : {}),
      })),
    })),
  };
  const agenda: AgendaItem[] = (content.agenda?.items || []).map((item) => ({
    day: item.day,
    time: item.time,
    agenda: item.agenda,
    detail: item.detail,
  }));
  const media = {
    aboutPhoto: content.about.image?.trim() || images.aboutPhoto,
    timelinePhoto: content.timelineImage?.trim() || images.timelinePhoto,
  };

  const announcementPage = {
    ...content.announcementPage,
    showInNav: isAnnouncementNavVisible(content.announcementPage),
  };

  return {
    siteMeta: content.siteMeta,
    about: content.about,
    timeline: content.timeline as TimelineItem[],
    uploadNote: content.uploadNote,
    contact: content.contact,
    footer: content.footer,
    guide: content.guide,
    agenda: {
      title: content.agenda?.title || "Agenda Seminar DATAMATIKA 2026",
      intro: content.agenda?.intro || "",
      items: agenda,
    },
    media,
    speakers,
    footerPartners,
    galleryPage,
    announcementPage,
  };
}
