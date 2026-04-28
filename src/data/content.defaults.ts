import type { SiteContent } from "./content.schema";

export const defaultSiteContent: SiteContent = {
  siteMeta: {
    title: "DATAMATIKA 2026 · Seminar Nasional SSMI",
    description:
      "DATAMATIKA 2026 hadir sebagai Seminar Nasional Sains Data, Matematika, dan Informatika oleh SSMI IPB.",
    publishedUrl: "https://apps.ipb.ac.id/seminar-nasional-ssmi-2025/home",
    registrationUrl: "https://conference.ipb.ac.id/datamatika/about/submissions",
    orgLine: "Seminar Nasional SSMI · IPB University",
    heroBg: "",
    heroLogo: "",
    mapsAddress: "IPB University, Dramaga, Bogor, Jawa Barat",
    mapsEmbedUrl: "",
    eventStartsAt: "2026-06-06T08:00:00+07:00",
    eventDateLabel: "6 Juni 2026",
  },
  about: {
    heading: "Informasi Datamatika 2026",
    body: "Datamatika hadir kembali sebagai Seminar Nasional Sains Data, Matematika, dan Informatika yang diselenggarakan oleh SSMI. Menjadi wadah bagi akademisi, peneliti, dan praktisi untuk berbagi ilmu, gagasan, serta inovasi di bidang sains data dan sekitarnya. Tahun ini, Datamatika juga membuka kesempatan Call for Papers (Full Paper) dengan jadwal submission yang telah ditentukan. Ini saatnya kamu berkontribusi dan menunjukkan hasil penelitianmu. Jangan lewatkan kesempatan untuk menjadi bagian dari ruang kolaborasi dan inspirasi ini. Catat tanggalnya, siapkan paper terbaikmu, dan jadilah bagian dari Datamatika 2026. #SSMIInfo #Datamatika2026 #CallForPapers #SeminarNasional #SainsData #Matematika #Informatika",
    image: "",
  },
  timeline: [
    { date: "1–18 Mei 2026", label: "Pendaftaran dan Submit Full Paper" },
    { date: "19–22 Mei 2026", label: "Review Paper" },
    { date: "23 Mei 2026", label: "Pengumuman Penerimaan (Acceptance)" },
    { date: "31 Mei 2026", label: "Deadline Revisi (Camera-Ready)" },
    { date: "6 Juni 2026", label: "Seminar Nasional SSMI 2026" },
  ],
  uploadNote: {
    title: "Call for Papers (Full Paper)",
    body: "Datamatika 2026 membuka submission full paper. Silakan kirim paper terbaikmu sesuai jadwal pendaftaran dan submit yang sudah diumumkan.",
    primaryLabel: "Submit full paper",
    primaryUrl: "https://conference.ipb.ac.id/datamatika/about/submissions",
    secondaryLabel: "Kembali ke atas",
    secondaryUrl: "#beranda",
  },
  contact: {
    heading: "Hubungi kami",
    address: "CPVJ+7C2 Kampus IPB, Jl. Meranti, Babakan, Dramaga, Bogor Regency, West Java 16680",
    phones: [
      { name: "Enon", tel: "+6281311679203", display: "0813-1167-9203" },
      { name: "Ridwan", tel: "+6281288337997", display: "0812-8833-7997" },
      { name: "Jimly", tel: "+628974472085", display: "0897-4472-085" },
    ],
    email: "ssmi@apps.ipb.ac.id",
  },
  guide: {
    flowTitle: "Alur Pendaftaran & Submit",
    flowSteps: [
      "Siapkan naskah sesuai template resmi DATAMATIKA 2026.",
      "Pastikan seluruh checklist submit terpenuhi.",
      "Daftar/masuk ke laman submit prosiding.",
      "Unggah naskah, lengkapi metadata penulis, lalu kirim.",
      "Tunggu proses review dan notifikasi hasil dari panitia/editor.",
    ],
    flowImage: "",
    templateLabel: "Unduh Template Artikel (.docx)",
    templateUrl: "/files/Template-Seminar-Nasional-2026.docx",
    fee: {
      type: "free",
      freeText: "GRATIS dan tidak dipungut biaya.",
      paidAmount: "",
      paidAccountNumber: "",
      paidAccountName: "",
    },
  },
  agenda: {
    title: "Agenda Seminar DATAMATIKA 2026",
    intro: "Jadwal acara seminar dapat berubah mengikuti pembaruan panitia.",
    items: [
      { day: "Friday, 6 Nov 2026", time: "08.00-09.30", agenda: "Opening & Speeches" },
      {
        day: "Friday, 6 Nov 2026",
        time: "09.30-10.20",
        agenda: "Keynote Speaker 1",
        detail: "Prof. Dr. Ir. Ika Satria, SP, MSi. (Head of National Research and Innovation Agency)",
      },
      { day: "Friday, 6 Nov 2026", time: "10.20-10.30", agenda: "Coffee Break" },
      { day: "Saturday, 7 Nov 2026", time: "08.00-08.10", agenda: "Opening" },
      {
        day: "Saturday, 7 Nov 2026",
        time: "08.10-09.00",
        agenda: "Keynote Speaker 3",
        detail: "Prof. Jun-Ichi Takada (Executive Vice President for Global Affairs, Institute of Science Tokyo, Japan)",
      },
    ],
  },
  timelineImage: "",
  speakers: [
    { title: "Bpk. Delil Khairat, S.Si., MBA.", href: "https://www.linkedin.com/in/delilkhairat/", image: "" },
    {
      title: "Dr. Janry H.U.P. Simanungkalit, S.Si., M.Si.",
      href: "https://www.bkn.go.id/profil/profil-pejabat-pimpinan-tinggi-bkn/pejabat-pimpinan-tinggi-pratama-kantor-regional-bkn/",
      image: "",
    },
    { title: "Prof. Dr. Ir. Khairil Anwar Notodiputro, M.S.", image: "" },
  ],
  partners: [],
  gallery: [],
};
