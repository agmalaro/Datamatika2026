export type SiteMetaContent = {
  title: string;
  description: string;
  publishedUrl: string;
  registrationUrl: string;
  orgLine: string;
  heroBg?: string;
  heroLogo?: string;
  mapsAddress?: string;
  mapsEmbedUrl?: string;
  eventStartsAt: string;
  eventDateLabel: string;
};

export type AboutContent = {
  heading: string;
  body: string;
  image?: string;
};

export type TimelineItemContent = {
  date: string;
  label: string;
};

export type UploadNoteContent = {
  title: string;
  body: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
};

export type SpeakerContent = {
  title: string;
  href?: string;
  image?: string;
};

export type PartnerContent = {
  name: string;
  image?: string;
};

export type GalleryItemContent = {
  caption?: string;
  image?: string;
};

export type GuideFeeContent = {
  type: "free" | "paid";
  freeText: string;
  paidAmount: string;
  paidAccountNumber: string;
  paidAccountName: string;
};

export type GuideContent = {
  flowTitle: string;
  flowSteps: string[];
  flowImage?: string;
  templateLabel: string;
  templateUrl: string;
  fee: GuideFeeContent;
};

export type AgendaItemContent = {
  day: string;
  time: string;
  agenda: string;
  detail?: string;
};

export type AgendaContent = {
  title: string;
  intro: string;
  items: AgendaItemContent[];
};

export type ContactPhoneContent = {
  name: string;
  tel: string;
  display: string;
};

export type ContactContent = {
  heading: string;
  address: string;
  phones: ContactPhoneContent[];
  email: string;
};

export type SiteContent = {
  siteMeta: SiteMetaContent;
  about: AboutContent;
  timeline: TimelineItemContent[];
  uploadNote: UploadNoteContent;
  contact: ContactContent;
  guide: GuideContent;
  agenda: AgendaContent;
  timelineImage?: string;
  speakers: SpeakerContent[];
  partners: PartnerContent[];
  gallery: GalleryItemContent[];
};
