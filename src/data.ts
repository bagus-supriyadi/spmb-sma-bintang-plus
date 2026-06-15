import { Applicant, AdmissionStatus, Major, SPMBSettings } from "./types";

export const INITIAL_SETTINGS: SPMBSettings = {
  schoolName: "SMA Bintang Plus Bandar Lampung",
  statusPendaftaran: "Buka",
  tahunPendaftaran: "2026",
  kuotaMIPA: 120,
  kuotaIPS: 90,
  tglPendaftaran: "10 Juni s.d 30 Juni 2026",
  tglVerifikasi: "11 Juni s.d 02 Juli 2026",
  tglPengumuman: "05 Juli 2026",
  tglDaftarUlang: "06 Juli s.d 12 Juli 2026",
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

export const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: "SPMB-2026-001",
    timestamp: "2026-06-10T08:30:00Z",
    fullName: "Muhammad Adi Saputra",
    nik: "1871021204090001",
    nisn: "0091234567",
    birthPlace: "Bandar Lampung",
    birthDate: "2009-04-12",
    gender: "Laki-laki",
    phone: "081234567890",
    parentPhone: "081298765432",
    email: "adi.saputra@gmail.com",
    address: "Jl. Way Halim No. 42, Bandar Lampung",
    previousSchool: "SMP Negeri 1 Bandar Lampung",
    preferredMajor: Major.MIPA,
    status: AdmissionStatus.DITERIMA,
  },
  {
    id: "SPMB-2026-002",
    timestamp: "2026-06-11T10:15:00Z",
    fullName: "Siti Rahmawati",
    nik: "1871034208090003",
    nisn: "0097654321",
    birthPlace: "Metro",
    birthDate: "2009-08-22",
    gender: "Perempuan",
    phone: "082345678901",
    parentPhone: "082398765432",
    email: "siti.rahma@yahoo.com",
    address: "Jl. Teuku Umar Gg. Danau No. 12, Kedaton, Bandar Lampung",
    previousSchool: "SMP Cardig",
    preferredMajor: Major.IPS,
    status: AdmissionStatus.DIVERIFIKASI,
  },
  {
    id: "SPMB-2026-003",
    timestamp: "2026-06-12T14:45:00Z",
    fullName: "Amanda Putri Lestari",
    nik: "1871015601100002",
    nisn: "0103216549",
    birthPlace: "Kalianda",
    birthDate: "2010-01-16",
    gender: "Perempuan",
    phone: "083456789012",
    parentPhone: "083498765432",
    email: "amanda.putri@hotmail.com",
    address: "Perum Permata Biru Blok C No. 5, Sukarame, Bandar Lampung",
    previousSchool: "SMP Negeri 2 Bandar Lampung",
    preferredMajor: Major.IPS,
    status: AdmissionStatus.PROSES,
  },
  {
    id: "SPMB-2026-004",
    timestamp: "2026-06-12T16:00:00Z",
    fullName: "David Christian Wijaya",
    nik: "1871040505090005",
    nisn: "0095554321",
    birthPlace: "Bandar Lampung",
    birthDate: "2009-05-05",
    gender: "Laki-laki",
    phone: "085678901234",
    parentPhone: "085698765432",
    email: "david.wijaya@gmail.com",
    address: "Jl. Kartini No. 88, Tanjung Karang, Bandar Lampung",
    previousSchool: "SMP Kristen Bandar Lampung",
    preferredMajor: Major.MIPA,
    status: AdmissionStatus.DITOLAK,
    rejectionReason: "Berkas tidak sesuai dengan ketentuan atau foto yang diunggah tidak jelas/rusak.",
  }
];
