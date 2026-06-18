import { Applicant, AdmissionStatus, Major, SPMBSettings } from "./types";

export const INITIAL_SETTINGS: SPMBSettings = {
  schoolName: "SMA Bintang Plus Bandar Lampung",
  statusPendaftaran: "Buka",
  tahunPendaftaran: "2026",
  kuotaMIPA: 75,
  kuotaIPS: 75,
  tglPendaftaran: "10 Juni s.d 05 Juli 2026",
  tglVerifikasi: "11 Juni s.d 07 Juli 2026",
  tglPengumuman: "08 Juli 2026",
  tglDaftarUlang: "09 Juli s.d 12 Juli 2026",
  tglMulaiBelajar: "15 Juli 2026",
  
  // Landing Page customizable fields
  welcomeTitle: "Sambutan Kepala Sekolah",
  welcomeText: "Selamat datang di SMA Bintang Plus.\n\nDi sini, kami tidak sekadar mendidik siswa untuk lulus sekolah — kami mempersiapkan mereka untuk menang dalam kehidupan. Setiap anak dibimbing secara terarah, dikenali potensinya, dan diarahkan menuju tujuan besar.\n\nKami memahami bahwa setiap orang tua memiliki harapan besar, dan setiap siswa memiliki mimpi yang ingin diwujudkan. Karena itu, SMA Bintang Plus hadir sebagai tempat yang bukan hanya mengajar, tetapi membentuk karakter dan mental juara.\n\nLingkungan belajar kami dirancang untuk mendorong siswa berkembang maksimal — baik akademik, kepemimpinan, maupun kesiapan menghadapi dunia nyata.\n\nKami percaya, masa depan tidak ditentukan oleh keberuntungan, tetapi oleh pilihan yang tepat hari ini.\n\nMari bergabung bersama SMA Bintang Plus. Mulai langkah pasti menuju masa depan gemilang.",
  namaKepala: "Famella Buana Dewi",
  fotoKepala: "https://bagus-supriyadi.biz.id/uploads/Famela Kepala Sekolah.jpeg",
  fotoKepalaWelcome: "https://bagus-supriyadi.biz.id/gambarbebas/20260412-115605_Famella%20in%20front%20of%20SMA%20Bintang%20Plus.png",
  
  // Struktur Pengurus
  namaWakaSDM: "Anita Pauriska, S.Pd",
  fotoWakaSDM: "https://bagus-supriyadi.biz.id/uploads/Anita Waka Kesiswaan.jpeg",
  namaSapras: "Anggito Ratno, S.H",
  fotoSapras: "https://bagus-supriyadi.biz.id/uploads/Anggito Waka Sapras.jpeg",
  namaHumas: "Sri Ayu W, S.Pd",
  fotoHumas: "https://bagus-supriyadi.biz.id/uploads/Sri Waka Humas.jpeg",
  namaKurikulum: "Herlan, S.P",
  fotoKurikulum: "https://bagus-supriyadi.biz.id/uploads/Herlan Waka Kurikulum.jpeg",
  namaAsistenSDM: "Muash Shomah",
  fotoAsistenSDM: "https://bagus-supriyadi.biz.id/uploads/Muas Asisten-1.jpeg",
  namaAsistenHumas: "Afrilia Siska Y, S.Si",
  fotoAsistenHumas: "https://bagus-supriyadi.biz.id/uploads/Aprilia Waka Humas.jpeg",
  
  // Panitia SPMB
  namaPanitiaPJ: "Famella Buana Dewi",
  namaPanitiaKetua: "Anita Pauriska, S.Pd",
  namaPanitiaSekretaris: "Sri Ayu Wahyuni, S.pd",
  namaPanitiaBendahara: "Afrilia Siska Yanti, S.Si",

  // Geography & contact fields
  schoolAddress: "SMA Bintang Plus, Jalan Pendidikan No.32-B, Kelurahan Sumber Rejo, Kecamatan Kemiling, Kota Bandar Lampung, 35152",
  schoolPhones: ["0895-0331-2895"],
  schoolEmails: ["smabintangplus@gmail.com"],
  schoolWebsites: ["https://katakita-group.biz.id/"],
  schoolLayananPenerimaan: "Senin - Jumat (07.30 - 15.30 WIB)",

  // Requirements & steps
  reqDocuments: [
    "Pas Foto Terbaru ukuran 3x4 (latar belakang merah/biru, format .jpg/.png maks 2MB).",
    "Kartu Keluarga (KK) asli atau fotokopi yang dilegalisir (format .pdf/.jpg).",
    "Akta Kelahiran asli (format .pdf/.jpg).",
    "Surat Keterangan Lulus (SKL) sementara (bagi lulusan tahun berjalan) ATAU Ijazah SMP/Sederajat asli (bagi lulusan tahun sebelumnya).",
    "Fotokopi Rapor Semester 1 s.d. 5 yang telah dilegalisir oleh Kepala Sekolah asal (format .pdf).",
    "Surat Pernyataan Kebenaran Dokumen & Kepatuhan tata tertib sekolah (bermaterai Rp 10.000, template diunduh di pendaftar).",
    "Kartu KIP/PKH/KKS asli (khusus bagi pendaftar Jalur Afirmasi/Beasiswa Kurang Mampu)."
  ],
  flowSteps: [
    { id: "1", title: "PEMBUATAN AKUN & PENGISIAN FORMULIR", desc: "Calon siswa membuat akun di portal ini, mengisi biodata lengkap, riwayat pendidikan, kontak wali, dan memilih peminatan jurusan." },
    { id: "2", title: "UNGGAH BERKAS DOKUMEN", desc: "Peserta login menggunakan NIK/NISN lalu mengunggah seluruh dokumen persyaratan asli hasil scan pada saat mendaftar online." },
    { id: "3", title: "VERIFIKASI ADMINISTRASI (ONLINE)", desc: "Panitia memeriksa kelengkapan berkas fisik/digital secara online dalam 2 x 24 jam." },
    { id: "4", title: "PENGUMUMAN & KELULUSAN", desc: "Hasil seleksi berkas administrasi dan perangkingan diumumkan secara transparan melalui sistem cek status kelulusan di portal ini." },
    { id: "5", title: "DAFTAR ULANG & LAPOR DIRI", desc: "Peserta yang dinyatakan lulus melakukan lapor diri secara offline, penyerahan berkas fisik asli ke sekolah (termasuk Bukti Pendaftaran tercetak dengan tanda tangan orang tua/wali & panitia), pengukuran seragam, dan pengisian pakta integritas." }
  ]
};

export const INITIAL_APPLICANTS: Applicant[] = [];
