export enum Major {
  MIPA = "MIPA (Matematika & IPA)",
  IPS = "IPS (Ilmu Pengetahuan Sosial)",
  BAHASA = "Bahasa & Budaya",
}

export enum AdmissionStatus {
  PROSES = "Proses Seleksi berkas",
  DIVERIFIKASI = "Selesai Verifikasi berkas",
  KURANG = "Kelengkapan Kurang / Salah",
  PERBAIKAN = "Update Perbaikan Berkas",
  DITERIMA = "Dinyatakan DITERIMA",
  DITOLAK = "Dinyatakan TIDAK DITERIMA",
}

export interface Applicant {
  id: string; // e.g., SPMB-2026-001
  timestamp: string;
  fullName: string;
  nik: string;
  nisn: string;
  birthPlace: string;
  birthDate: string;
  gender: "Laki-laki" | "Perempuan";
  phone: string;
  parentName?: string;
  parentPhone: string;
  email: string;
  address: string;
  previousSchool: string;
  preferredMajor: Major;
  status: AdmissionStatus;
  rejectionReason?: string;
  distance?: string;
  foto3x4?: string;
  kk?: string;
  akta?: string;
  ijazahSkl?: string;
  raporSemester?: string;
  suratPernyataan?: string;
  kartuKip?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface SPMBSettings {
  schoolName: string;
  statusPendaftaran: "Buka" | "Tutup";
  tahunPendaftaran: string;
  kuotaMIPA: number;
  kuotaIPS: number;
  kuotaBahasa: number;
  tglPendaftaran?: string;
  tglVerifikasi?: string;
  tglPengumuman?: string;
  tglDaftarUlang?: string;
  tglMulaiBelajar?: string;
  
  // Landing Page customizable fields
  welcomeTitle?: string;
  welcomeText?: string;
  namaKepala?: string;
  fotoKepala?: string;
  fotoKepalaWelcome?: string;
  
  // Struktur Pengurus
  namaWakaSDM?: string;
  fotoWakaSDM?: string;
  namaSapras?: string;
  fotoSapras?: string;
  namaHumas?: string;
  fotoHumas?: string;
  namaKurikulum?: string;
  fotoKurikulum?: string;
  namaAsistenSDM?: string;
  fotoAsistenSDM?: string;
  namaAsistenHumas?: string;
  fotoAsistenHumas?: string;
  
  // Panitia SPMB
  namaPanitiaPJ?: string;
  namaPanitiaKetua?: string;
  namaPanitiaSekretaris?: string;
  namaPanitiaBendahara?: string;

  // New customizable lists for geography and content
  schoolAddress?: string;
  schoolPhones?: string[];
  schoolEmails?: string[];
  schoolWebsites?: string[];
  schoolLayananPenerimaan?: string;

  // Editable requirements list and flow steps
  reqDocuments?: string[];
  flowSteps?: { id: string; title: string; desc: string; }[];
}
