/** Konten & aset landing — Seminar Nasional SSMI */
import ipbKoinBg from "../assets/backgrounds/ipb-koin.jpeg";
import ipbBg02 from "../assets/backgrounds/ipb-bg-02.png";
import ipbHeroNew from "../assets/backgrounds/ipb-bg-hero-new.png";
import datamatikaNavLogo from "../assets/logos/datamatika-nav-logo.png";
import speakerPlaceholder from "../assets/speakers/datamatika-speaker-placeholder.png";
import footerIpbSsmiBanner from "../assets/footer/ipb-ssmi-horizontal-banner.png";
import { getSiteContent } from "../lib/content-store";

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
export type AgendaItem = { day: string; time: string; agenda: string; detail?: string };

export function getSiteData() {
  const content = getSiteContent();
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
  const gallery: GalleryItem[] = content.gallery.map((item) => ({
    src: item.image || "",
    caption: item.caption,
  }));
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

  return {
    siteMeta: content.siteMeta,
    about: content.about,
    timeline: content.timeline as TimelineItem[],
    uploadNote: content.uploadNote,
    guide: content.guide,
    agenda: {
      title: content.agenda?.title || "Agenda Seminar DATAMATIKA 2026",
      intro: content.agenda?.intro || "",
      items: agenda,
    },
    media,
    speakers,
    footerPartners,
    gallery,
  };
}
