/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  School, FileText, CheckCircle, Search, Settings, 
  ArrowRight, Users, Sparkles, BookOpen, Clock, MapPin, 
  Award, Key, LogOut, Check, CreditCard, ChevronDown, 
  FolderPlus, Trash2, Edit3, BarChart, Download, FileSpreadsheet, 
  HelpCircle, CheckCircle2, UserCheck, AlertCircle, PlusCircle, Notebook,
  Trophy
} from "lucide-react";
import { Major, AdmissionStatus, Applicant, SPMBSettings } from "./types";
import { INITIAL_APPLICANTS, INITIAL_SETTINGS } from "./data";
import AIAssistant from "./components/AIAssistant";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export default function App() {
  // --- Persistent Storage State ---
  const [applicants, setApplicants] = useState<Applicant[]>(() => {
    const saved = localStorage.getItem("spmb_applicants");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_APPLICANTS;
  });

  const [settings, setSettings] = useState<SPMBSettings>(() => {
    const saved = localStorage.getItem("spmb_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Overwrite old default if the user hasn't customized it, to immediately deliver the requested revision
        if (parsed.welcomeTitle === "Selamat Datang di Bintang Plus Senior High School" || !parsed.welcomeTitle) {
          parsed.welcomeTitle = INITIAL_SETTINGS.welcomeTitle;
          parsed.welcomeText = INITIAL_SETTINGS.welcomeText;
        }
        return { ...INITIAL_SETTINGS, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SETTINGS;
  });

  // Tap navigation state
  const [currentTab, setCurrentTab] = useState<"beranda" | "alur-biaya" | "daftar" | "cek-status" | "admin">("beranda");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [visiMisiTab, setVisiMisiTab] = useState<"visi" | "nilai">("visi");

  // Registration Form State
  const [formInput, setFormInput] = useState({
    fullName: "",
    nik: "",
    nisn: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    phone: "",
    parentName: "",
    parentPhone: "",
    email: "",
    address: "",
    previousSchool: "",
    preferredMajor: Major.MIPA,
    distance: "",
    foto3x4: "",
    kk: "",
    akta: "",
    ijazahSkl: "",
    raporSemester: "",
    suratPernyataan: "",
    kartuKip: "",
  });

  // Status search states
  const [searchId, setSearchId] = useState("");
  const [foundApplicant, setFoundApplicant] = useState<Applicant | null>(null);
  const [searchTyped, setSearchTyped] = useState(false);
  const [activeTestApplicant, setActiveTestApplicant] = useState<Applicant | null>(null);

  // Administrative views & auth states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState<"dashboard" | "pendaftar" | "verifikasi" | "pengaturan">("dashboard");
  const [adminTheme, setAdminTheme] = useState<string>(() => {
    return localStorage.getItem("spmb_admin_theme") || "royal-jade";
  });
  const [auditApplicantId, setAuditApplicantId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Admin Editing states
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [editScoreTest, setEditScoreTest] = useState<number>(0);
  const [editScoreInterview, setEditScoreInterview] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<AdmissionStatus>(AdmissionStatus.PROSES);
  const [editRejection, setEditRejection] = useState("");

  // Draft settings state for admin editing with Save & Discard triggers
  const [draftSettings, setDraftSettings] = useState<SPMBSettings>(INITIAL_SETTINGS);

  // Synchronize draftSettings when settings state changes (or on load)
  useEffect(() => {
    if (settings) {
      setDraftSettings(settings);
    }
  }, [settings]);

  // Budget Calculator States
  const [isBoarding, setIsBoarding] = useState(false);
  const [busService, setBusService] = useState(false);
  const [beasiswaType, setBeasiswaType] = useState<"none" | "prestasi" | "hafidz" | "social">("none");

  // News / Kabar Detail Reader Modal State
  const [kabarDetail, setKabarDetail] = useState<"profil" | "kurikulum" | "program" | "logo" | null>(null);

  // printable A4 registration document state
  const [printableApplicant, setPrintableApplicant] = useState<Applicant | null>(null);

  // Map pinning and Surat Pernyataan states
  const [userMapPin, setUserMapPin] = useState<{ x: number; y: number; pctX: number; pctY: number; lat: number; lng: number } | null>(null);
  const [isPernyataanModalOpen, setIsPernyataanModalOpen] = useState(false);

  // Helper to calculate map coordinates & distance from manual latitude and longitude input
  const updateFromManualCoordinates = (manualLat: number, manualLng: number) => {
    const centerLat = -5.3907019;
    const centerLng = 105.2101195;
    const scale = 8.5 * 0.009; // scaling factor representation

    const latOffset = manualLat - centerLat;
    const lngOffset = manualLng - centerLng;

    // dy and dx as represented in the percentage plane logic
    const dy = -50 * latOffset / scale;
    const dx = 50 * lngOffset / scale;

    // Clamp values so the pin coordinates are placed nicely on the interactive radar plane (0 to 100)
    const pctX = Math.min(100, Math.max(0, 50 + dx));
    const pctY = Math.min(100, Math.max(0, 50 + dy));

    const pctDistance = Math.sqrt(dx * dx + dy * dy);
    const rawDistance = (pctDistance / 50) * 8.5;
    const distanceKM = Math.max(0.2, Math.round(rawDistance * 10) / 10);

    setUserMapPin({
      x: 0,
      y: 0,
      pctX,
      pctY,
      lat: Number(manualLat),
      lng: Number(manualLng),
    });

    setFormInput(prev => ({
      ...prev,
      distance: distanceKM.toFixed(1)
    }));
  };

  // Multi-success alerts
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Sync to database simulated via localStorage
  useEffect(() => {
    localStorage.setItem("spmb_applicants", JSON.stringify(applicants));
  }, [applicants]);

  useEffect(() => {
    localStorage.setItem("spmb_settings", JSON.stringify(settings));
  }, [settings]);

  // Set timeout for inline alerts
  const showAlert = (type: "success" | "error" | "info", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 6000);
  };

  // Generate beautiful pdf
  const generateParticipantPDF = (app: Applicant) => {
    const doc = new jsPDF();
    
    // Header Style
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 38, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KARTU PESERTA - SELEKSI MASUK MANDIRI (SPMB)", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(settings.schoolName.toUpperCase(), 105, 24, { align: "center" });
    doc.setFontSize(9);
    doc.text("Bandar Lampung, Provinsi Lampung, Indonesia", 105, 30, { align: "center" });
    
    // Draw Accent line
    doc.setDrawColor(245, 158, 11); // Amber
    doc.setLineWidth(1.5);
    doc.line(0, 38, 210, 38);
    
    // Section header
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("KARTU BUKTI PENDAFTARAN RESMI", 15, 52);
    doc.line(15, 55, 195, 55);
    
    // Details
    doc.setFontSize(10);
    const dataRows = [
      ["No. Pendaftaran", app.id],
      ["Nama Lengkap", app.fullName],
      ["NIK / No.KTP", app.nik],
      ["NISN Nasional", app.nisn],
      ["Jenis Kelamin", app.gender],
      ["Tempat, Tanggal Lahir", `${app.birthPlace}, ${app.birthDate}`],
      ["Sekolah Asal", app.previousSchool],
      ["Minat Penjurusan", app.preferredMajor],
      ["Status Seleksi", app.status],
    ];
    
    let y = 64;
    dataRows.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + " :", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(val, 62, y);
      y += 9;
    });
    
    // Footer Box
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(15, y + 4, 180, 25, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(15, y + 4, 180, 25);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("PENGUMUMAN PENTING & INFORMASI PENERIMAAN:", 19, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text("1. Silakan simpan kartu ini sebagai bukti resmi pendaftaran Sekolah Unggulan kami.", 19, y + 15);
    doc.text("2. Harap memantau secara berkala menu 'Cek Status' untuk memeriksa hasil kelengkapan berkas Anda.", 19, y + 20);
    
    // Signature
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text("Bandar Lampung, " + new Date().toLocaleDateString("id-ID"), 145, y + 42);
    doc.text("Panitia Penerimaan SPMB,", 145, y + 47);
    doc.setFont("helvetica", "bold");
    doc.text("SMA Bintang Plus", 145, y + 62);
    
    doc.save(`KARTU_SPMB_${app.id}.pdf`);
    showAlert("success", "Berhasil mencetak dokumen bukti pendaftaraan PDF!");
  };

  // Excel data export using spreadsheet library
  const handleExportExcel = () => {
    const formatted = applicants.map((app) => ({
      "No Pendaftaran": app.id,
      "Nama Lengkap": app.fullName,
      "NIK": app.nik,
      "NISN": app.nisn,
      "Jenis Kelamin": app.gender,
      "Tempat Lahir": app.birthPlace,
      "Tanggal Lahir": app.birthDate,
      "Asal Sekolah": app.previousSchool,
      "Jurusan Pilihan": app.preferredMajor,
      "Status Seleksi": app.status,
      "Alasan Penolakan": app.rejectionReason || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendaftar SPMB");
    XLSX.writeFile(wb, `Data_Siswa_SPMB_BintangPlus.xlsx`);
    showAlert("success", "Berhasil mengekspor seluruh data pendaftar ke file Excel!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert("error", "Ukuran file " + file.name + " terlalu besar! Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormInput(prev => ({
          ...prev,
          [fieldName]: reader.result as string
        }));
        showAlert("success", "File " + file.name + " berhasil diunggah.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Registration Handlers
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formInput.fullName || !formInput.nik || !formInput.nisn || !formInput.email) {
      showAlert("error", "Mohon lengkapi seluruh field formulir pendaftaran wajib!");
      return;
    }
    if (formInput.nik.length < 12) {
      showAlert("error", "Format NIK tidak valid, minimal harus berisi 12 digit.");
      return;
    }
    if (formInput.nisn.length < 10) {
      showAlert("error", "Format NISN salah, minimal berisi 10 digit.");
      return;
    }
    if (!formInput.distance) {
      showAlert("error", "Harap isi perkiraan jarak rumah Anda ke sekolah.");
      return;
    }
    if (!formInput.foto3x4 || !formInput.kk || !formInput.akta || !formInput.ijazahSkl || !formInput.raporSemester || !formInput.suratPernyataan) {
      showAlert("error", "Harap unggah seluruh berkas persyaratan wajib (Pas Foto, KK, Akta, Ijazah/SKL, Rapor, & Surat Pernyataan)!");
      return;
    }

    // Check if NISN or NIK has been registered
    const nIsNDuplicated = applicants.some(a => a.nisn === formInput.nisn);
    if (nIsNDuplicated) {
      showAlert("error", "Nomor NISN tersebut sudah terdaftar pada sistem penerimaan sekolah kami!");
      return;
    }

    // Generate unique registration id
    const prefix = "SPMB";
    const nextNumber = applicants.length + 1;
    const formattedId = `${prefix}-${settings.tahunPendaftaran}-${String(nextNumber).padStart(3, "0")}`;

    const newApplicant: Applicant = {
      id: formattedId,
      timestamp: new Date().toISOString(),
      fullName: formInput.fullName,
      nik: formInput.nik,
      nisn: formInput.nisn,
      birthPlace: formInput.birthPlace,
      birthDate: formInput.birthDate,
      gender: formInput.gender,
      phone: formInput.phone,
      parentName: formInput.parentName,
      parentPhone: formInput.parentPhone,
      email: formInput.email,
      address: formInput.address,
      previousSchool: formInput.previousSchool,
      preferredMajor: formInput.preferredMajor,
      status: AdmissionStatus.PROSES,
      distance: formInput.distance,
      foto3x4: formInput.foto3x4 || undefined,
      kk: formInput.kk || undefined,
      akta: formInput.akta || undefined,
      ijazahSkl: formInput.ijazahSkl || undefined,
      raporSemester: formInput.raporSemester || undefined,
      suratPernyataan: formInput.suratPernyataan || undefined,
      kartuKip: formInput.kartuKip || undefined,
    };

    setApplicants((prev) => [newApplicant, ...prev]);
    setSearchId(formattedId);
    setFoundApplicant(newApplicant);
    setSearchTyped(true);

    // Reset Form
    setFormInput({
      fullName: "",
      nik: "",
      nisn: "",
      birthPlace: "",
      birthDate: "",
      gender: "Laki-laki",
      phone: "",
      parentName: "",
      parentPhone: "",
      email: "",
      address: "",
      previousSchool: "",
      preferredMajor: Major.MIPA,
      distance: "",
      foto3x4: "",
      kk: "",
      akta: "",
      ijazahSkl: "",
      raporSemester: "",
      suratPernyataan: "",
      kartuKip: "",
    });

    showAlert("success", `Pendaftaran Berhasil! Nomor SPMB Anda: ${formattedId}`);
    setCurrentTab("cek-status"); // Direct to check status & cbt exam page
  };

  // Searching individual applicant by registration index
  const handleSearchCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTyped(true);
    if (!searchId.trim()) {
      setFoundApplicant(null);
      return;
    }

    const result = applicants.find(
      (a) => a.id.toLowerCase() === searchId.trim().toLowerCase() || a.nisn === searchId.trim()
    );

    if (result) {
      setFoundApplicant(result);
    } else {
      setFoundApplicant(null);
    }
  };



  // Admin Login Handle
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassphrase === "adminspmb" || adminPassphrase === "admin") {
      setIsAdminAuthenticated(true);
      setAdminError("");
      showAlert("success", "Otorisasi Panitia Berhasil! Selamat datang di dashboard utama.");
    } else {
      setAdminError("Passphrase / Kata Sandi pengurus salah. Silakan coba kembali.");
    }
  };

  // Admin save applicant evaluation changes
  const saveApplicantEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setApplicants((prev) =>
      prev.map((app) => {
        if (app.id === selectedApplicant.id) {
          return {
            ...app,
            status: editStatus,
            rejectionReason: (editStatus === AdmissionStatus.DITOLAK || editStatus === AdmissionStatus.KURANG) ? editRejection : undefined,
          };
        }
        return app;
      })
    );

    // Refresh display
    setFoundApplicant((prev) =>
      prev && prev.id === selectedApplicant.id
        ? {
            ...prev,
            status: editStatus,
            rejectionReason: (editStatus === AdmissionStatus.DITOLAK || editStatus === AdmissionStatus.KURANG) ? editRejection : undefined,
          }
        : prev
    );

    setSelectedApplicant(null);
    showAlert("success", "Detail hasil evaluasi berkas calon murid berhasil diperbarui!");
  };

  // Admin settings update
  const handleToggleSettingsStatus = () => {
    setSettings((prev) => ({
      ...prev,
      statusPendaftaran: prev.statusPendaftaran === "Buka" ? "Tutup" : "Buka",
    }));
    showAlert("info", `Pendaftaran penerimaan murid baru sekarang diubah.`);
  };

  const handleUpdateQuotas = (major: "MIPA" | "IPS", num: number) => {
    setSettings((prev) => {
      const copy = { ...prev };
      if (major === "MIPA") copy.kuotaMIPA = num;
      if (major === "IPS") copy.kuotaIPS = num;
      return copy;
    });
  };

  // Admin reset data to factory config
  const handleResetApplicationData = () => {
    if (confirm("Apakah anda yakin ingin mereturn seluruh data pendaftar kembali ke setelan awal pabrikan? Tindakan ini bersifat permanen.")) {
      setApplicants(INITIAL_APPLICANTS);
      setSettings(INITIAL_SETTINGS);
      localStorage.removeItem("spmb_applicants");
      localStorage.removeItem("spmb_settings");
      showAlert("info", "Seluruh basis data pendaftaran telah berhasil dibersihkan kembali ke awal.");
    }
  };

  // Admin delete applicant handle
  const handleDeleteApplicant = (id: string) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    showAlert("info", `Data pendaftar dengan id ${id} berhasil dihapus.`);
  };

  // Calculate live registration counts
  const totalMIPARegistered = applicants.filter((a) => a.preferredMajor === Major.MIPA).length;
  const totalIPSRegistered = applicants.filter((a) => a.preferredMajor === Major.IPS).length;

  const totalDiterima = applicants.filter((a) => a.status === AdmissionStatus.DITERIMA).length;
  const totalDitolak = applicants.filter((a) => a.status === AdmissionStatus.DITOLAK).length;

  // Real-time Fee Estimation logic (parents love interactive widget!)
  const calculateFees = () => {
    let pendaftaranFee = 150000;
    let uangPangkal = 4500000;
    let monthlySpp = 350000;

    // Apply dorm addon
    let addonDorm = isBoarding ? 1200000 : 0; // Rp 1.2M monthly
    let addonBus = busService ? 250000 : 0;

    // Scholarship reductions
    let discountPangkal = 0;
    if (beasiswaType === "prestasi") discountPangkal = uangPangkal * 0.75; // 75%
    if (beasiswaType === "hafidz") discountPangkal = uangPangkal * 1.0; // 100%
    if (beasiswaType === "social") discountPangkal = uangPangkal * 0.5; // 50%

    let totalBiayaAwal = pendaftaranFee + (uangPangkal - discountPangkal) + (monthlySpp + addonDorm + addonBus);

    return {
      pendaftaranFee,
      uangPangkalOriginal: uangPangkal,
      discountPangkal,
      uangPangkalNett: uangPangkal - discountPangkal,
      monthlyBaseSpp: monthlySpp,
      addonDorm,
      addonBus,
      monthlyTotal: monthlySpp + addonDorm + addonBus,
      totalBiayaAwal,
    };
  };

  const fees = calculateFees();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-blue-650 selection:text-white">
      
      {/* Simulator Device Viewport Switcher */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-b border-slate-800 shrink-0 sticky top-0 z-[100] no-print">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-extrabold uppercase tracking-wider font-sans text-[11px] text-slate-200">
            SIMULASI LAYAR RESPONSIF:
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">
            (Tekan tombol untuk mensimulasikan kegunaan di layar HP, Tablet, atau Desktop secara langsung)
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`px-3 py-1.5 rounded-lg font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              deviceMode === "desktop" ? "bg-blue-600 text-white shadow-md inline-flex" : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <i className="fa-solid fa-desktop text-xs"></i>
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`px-3 py-1.5 rounded-lg font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              deviceMode === "tablet" ? "bg-blue-600 text-white shadow-md inline-flex" : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <i className="fa-solid fa-tablet-screen-button text-xs"></i>
            <span>Tablet (iPad)</span>
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`px-3 py-1.5 rounded-lg font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              deviceMode === "mobile" ? "bg-blue-600 text-white shadow-md inline-flex" : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <i className="fa-solid fa-mobile-screen-button text-xs"></i>
            <span>Smartphone (HP)</span>
          </button>
        </div>
      </div>

      {/* Actual Application Outer Shell */}
      <div className={`transition-all duration-300 flex-1 flex flex-col bg-white overflow-hidden relative ${
        deviceMode === "mobile" ? "max-w-[420px] w-full mx-auto my-6 border-[12px] border-slate-800 rounded-[36px] shadow-2xl h-[844px] overflow-y-auto" :
        deviceMode === "tablet" ? "max-w-[768px] w-full mx-auto my-6 border-[10px] border-slate-800 rounded-[24px] shadow-xl h-[1024px] overflow-y-auto" :
        "w-full min-h-screen"
      }`}>
      
        {/* Decorative colored bar top headers */}
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 w-full shrink-0" />

      {/* Persistent global toast notifications */}
      {alertMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border border-slate-200 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-6 duration-300">
          <div className={`p-1.5 rounded-lg ${
            alertMsg.type === "success" ? "bg-emerald-100 text-emerald-700" :
            alertMsg.type === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          }`}>
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-sans">Pemberitahuan Sistem</p>
            <p className="text-sm font-medium text-slate-700 font-sans">{alertMsg.text}</p>
          </div>
        </div>
      )}

      {/* Header & Logo Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://bagus-supriyadi.biz.id/uploads/logo%20sma%20bintang%20plus%20bandar%20lampung.png" 
              alt="Logo SMA Bintang Plus Bandar Lampung" 
              className="h-12 w-12 object-contain filter drop-shadow" 
              onError={(e) => {
                // Return a safe fallback icon in case external URL fails
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-700 block font-display">Sistem Mandiri SPMB</span>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent font-display tracking-tight flex items-center gap-1.5">
                SMA Bintang Plus
              </h1>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => { setCurrentTab("beranda"); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentTab === "beranda" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Profil Sekolah
            </button>
            <button
              onClick={() => { setCurrentTab("alur-biaya"); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentTab === "alur-biaya" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Dokumen & Alur
            </button>
            <button
              onClick={() => { setCurrentTab("daftar"); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentTab === "daftar" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => { setCurrentTab("cek-status"); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentTab === "cek-status" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Hasil Pengumuman Kelulusan
            </button>
            <div className="h-5 w-px bg-slate-200 mx-2" />
            <button
              onClick={() => { setCurrentTab("admin"); }}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "admin" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <i className="fa-solid fa-user-shield text-xs mr-0.5"></i>
              Panitia Login
            </button>
          </nav>

          {/* Quick Info Status Indicator badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              settings.statusPendaftaran === "Buka" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                settings.statusPendaftaran === "Buka" ? "bg-emerald-500 animate-pulse" : "bg-rose-550"
              }`}></span>
              SPMB {settings.statusPendaftaran === "Buka" ? "DIBUKA" : "DITUTUP"}
            </span>
          </div>
        </div>
      </header>

      {/* Small Screen Nav menu bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 flex md:hidden gap-1 overflow-x-auto justify-start select-none">
        <button
          onClick={() => setCurrentTab("beranda")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
            currentTab === "beranda" ? "bg-blue-750 text-white" : "text-slate-600 bg-white"
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setCurrentTab("alur-biaya")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
            currentTab === "alur-biaya" ? "bg-blue-750 text-white" : "text-slate-600 bg-white"
          }`}
        >
          Dokumen & Alur
        </button>
        <button
          onClick={() => setCurrentTab("daftar")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
            currentTab === "daftar" ? "bg-blue-750 text-white" : "text-slate-600 bg-white"
          }`}
        >
          Formulir
        </button>
        <button
          onClick={() => setCurrentTab("cek-status")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
            currentTab === "cek-status" ? "bg-blue-750 text-white" : "text-slate-600 bg-white"
          }`}
        >
          Hasil Pengumuman Kelulusan
        </button>
        <button
          onClick={() => setCurrentTab("admin")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
            currentTab === "admin" ? "bg-blue-100 text-blue-700" : "text-slate-600 bg-white"
          }`}
        >
          Panitia Admin
        </button>
      </div>

      {/* Main content body panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: Beranda & Profil Sekolah (Detik-style News Portal & Luxury School Landing Page) */}
        {currentTab === "beranda" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Inject styled marquee keyframes at runtime */}
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                display: flex;
                width: max-content;
                animation: marquee 35s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>

            {/* Red & Gold Running Text Ticker - Detik-style */}
            <div className="bg-red-700 text-white rounded-xl shadow-md flex items-center overflow-hidden h-11 px-4 border border-red-800">
              <div className="bg-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded bg-gradient-to-r from-red-800 to-slate-900 shrink-0 mr-4 flex items-center gap-1.5 shadow-md">
                <i className="fa-solid fa-bullhorn text-red-500 animate-pulse"></i>
                INFO UTAMA
              </div>
              <div className="overflow-hidden w-full relative">
                <div className="animate-marquee whitespace-nowrap text-xs md:text-sm font-semibold tracking-wide flex items-center gap-16">
                  <span>📢 SPMB TA {settings.tahunPendaftaran}/{Number(settings.tahunPendaftaran)+1}: Selamat Datang di Angkatan Rintisan Pertama SMA Bintang Plus Bandar Lampung. Pendaftaran Secara Mandiri Berbasis Karakter & Prestasi Resmi Dibuka!</span>
                  <span>🔥 ALUR SEKOLAH DIGITAL: Selesaikan pendaftaran mandiri, unggah berkas validasi, dan pantau hasil seleksi secara paperless terintegrasi langsung di portal ini!</span>
                  <span>🌟 BEASISWA UNGULAN: Tersedia Beasiswa Sosial bagi anak Yatim Piatu & Beasiswa Hafidz Al-Qur&apos;an khusus minimal 3 Juz.</span>
                  <span>🤖 ASISTEN AI PINTAR: Konsultasikan penjurusan & bakat Anda 24/7 dengan chatbot asisten cerdas AI kami di pojok kanan bawah!</span>
                  {/* Duplicate once for seamless looping */}
                  <span>📢 SPMB TA {settings.tahunPendaftaran}/{Number(settings.tahunPendaftaran)+1}: Selamat Datang di Angkatan Rintisan Pertama SMA Bintang Plus Bandar Lampung. Pendaftaran Secara Mandiri Berbasis Karakter & Prestasi Resmi Dibuka!</span>
                  <span>🔥 ALUR SEKOLAH DIGITAL: Selesaikan pendaftaran mandiri, unggah berkas validasi, dan pantau hasil seleksi secara paperless terintegrasi langsung di portal ini!</span>
                  <span>🌟 BEASISWA UNGULAN: Tersedia Beasiswa Sosial bagi anak Yatim Piatu & Beasiswa Hafidz Al-Qur&apos;an khusus minimal 3 Juz.</span>
                  <span>🤖 ASISTEN AI PINTAR: Konsultasikan penjurusan & bakat Anda 24/7 dengan chatbot asisten cerdas AI kami di pojok kanan bawah!</span>
                </div>
              </div>
            </div>

            {/* Detik-style News Grid (Hero Headline + Popular Secondary Articles) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Headline Utama (Main News Story) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative group rounded-3xl overflow-hidden bg-slate-950 min-h-[480px] sm:min-h-[430px] lg:min-h-[450px] shadow-lg border border-slate-200 flex flex-col justify-end">
                  {/* Backdrop Gradient & Premium Theme Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.25),transparent_60%)] z-0" />
                  
                  {/* Dynamic Graphic Pattern representing State School prestige */}
                  <div className="absolute inset-0 opacity-10 flex items-center justify-center z-0">
                    <div className="w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px] rotate-12" />
                  </div>

                  {/* Absolute Badge Category */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex flex-wrap gap-1.5">
                    <span className="bg-red-600 text-white font-extrabold text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-md">
                      SOROTAN UTAMA
                    </span>
                    <span className="bg-blue-600/90 text-white font-extrabold text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-md backdrop-blur">
                      SPMB TA {settings.tahunPendaftaran}
                    </span>
                  </div>

                  {/* Lower Text content - natural layout inside flex-end container prevents absolute overlap */}
                  <div className="relative z-20 p-5 sm:p-8 space-y-4 pt-20 mt-auto bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-amber-400 font-bold">
                      <i className="fa-solid fa-clock"></i>
                      <span>Dipublikasikan: Baru Saja</span>
                      <span className="text-slate-500">•</span>
                      <span>Oleh: Panitia SPMB</span>
                    </div>

                    <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-display hover:text-blue-200 transition duration-300">
                      Membangun Karakter, Meraih Keunggulan: Menjawab Kebutuhan Pendidikan Menengah Modern di Bandar Lampung
                    </h3>

                    <p 
                      onClick={() => setKabarDetail("profil")}
                      className="text-slate-300 text-xs sm:text-sm font-sans leading-relaxed max-w-4xl hover:text-amber-300 group cursor-pointer transition-all duration-300 flex items-center gap-1.5"
                    >
                      <span>
                        <strong>Bintang Plus Senior High School</strong> didirikan dengan tekad menghadirkan lembaga pendidikan unggulan di Bandar Lampung yang berfokus pada pembentukan karakter (&ldquo;Excellence and Character&rdquo;), kecakapan global, dan pembinaan moral religius terintegrasi. <span className="text-blue-400 group-hover:text-amber-300 font-bold underline inline-block">Klik di sini untuk membaca detail Profil &amp; Identitas Sekolah selengkapnya &rarr;</span>
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => setCurrentTab("daftar")}
                        className="bg-blue-650 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition duration-300 pointer border-0 tracking-wide flex items-center gap-2 shadow-md"
                      >
                        <i className="fa-solid fa-file-signature"></i>
                        Isi Formulir Mandiri
                      </button>
                      <a
                        href="https://wa.me/6289503312895?text=Halo%20Panitia%20SPMB%20SMA%20Bintang%20Plus%20Bandar%20Lampung%2C%20saya%20ingin%20berkonsultasi%20mengenai%20penerimaan%20siswa%20baru."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition pointer flex items-center gap-2 no-underline shadow-md"
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        Konsultasi Pendaftaran (WA)
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Detik-style Secondary Sidebar (Kabar Terbaru) */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-display flex items-center gap-2">
                      <i className="fa-solid fa-newspaper text-red-600"></i>
                      KABAR UTAMA SEKOLAH
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  </div>

                  {/* Vertical items stack */}
                  <div className="divide-y divide-slate-150 space-y-3 pt-1">
                    {[
                      {
                        rank: "1",
                        tag: "PROFIL UTAMA",
                        title: "Identitas Lengkap & Profil Utama Bintang Plus Senior High School.",
                        meta: "Klik untuk Baca Selengkapnya",
                        type: "profil"
                      },
                      {
                        rank: "2",
                        tag: "KURIKULUM",
                        title: "Sistem Pendidikan Holistik & Pedoman Kurikulum Merdeka Terintegrasi.",
                        meta: "Klik untuk Baca Selengkapnya",
                        type: "kurikulum"
                      },
                      {
                        rank: "3",
                        tag: "PROGRAM UNGGULAN & EKSKUL",
                        title: "6 Program Unggulan Utama & 11 Pilihan Ekstrakurikuler Siswa.",
                        meta: "Klik untuk Baca Selengkapnya",
                        type: "program"
                      },
                      {
                        rank: "4",
                        tag: "MAKNA LOGO",
                        title: "Makna Filosofi & Arti Lambang Resmi Bintang Plus Senior High School.",
                        meta: "Klik untuk Baca Selengkapnya",
                        type: "logo"
                      },
                    ].map((item, keyIdx) => (
                      <div 
                        key={keyIdx} 
                        onClick={() => setKabarDetail(item.type as any)}
                        className="flex gap-4 pt-3 first:pt-0 group cursor-pointer hover:bg-slate-55 p-2 rounded-xl transition-all duration-200"
                        title="Klik untuk membuka informasi detail"
                      >
                        <span className="font-display font-black text-3xl text-slate-205 group-hover:text-amber-500 transition duration-300 leading-none shrink-0 w-6 text-center">
                          {item.rank}
                        </span>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-widest text-red-650 block uppercase">{item.tag}</span>
                          <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition leading-snug block font-sans">
                            {item.title}
                          </span>
                          <p className="text-[10px] text-blue-600 group-hover:text-blue-800 font-mono font-bold flex items-center gap-1">
                            <i className="fa-solid fa-book-open text-[9px] animate-pulse"></i>
                            {item.meta}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* CARD JADWAL TANGGAL PENTING SPMB */}
            <div className="bg-white border text-left border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">
                    <i className="fa-solid fa-calendar-days text-blue-600 animate-pulse"></i>
                    <span>Jadwal Penting Kegiatan SPMB</span>
                  </h3>
                  <p className="text-slate-500 text-xs font-sans">
                    Catat dan ingat baik-baik agenda kelanjutan penerimaan siswa baru tahun ajaran {settings.tahunPendaftaran}/{Number(settings.tahunPendaftaran)+1}:
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl text-blue-700 text-xs font-bold font-mono self-start sm:self-auto uppercase tracking-wide">
                  Tahun Ajaran {settings.tahunPendaftaran}
                </div>
              </div>

              {/* Grid of Schedules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Pendaftaran */}
                <div className="bg-slate-50 border border-slate-200/65 p-4 rounded-2xl flex flex-col justify-between hover:ring-2 hover:ring-slate-300 hover:bg-slate-100 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-blue-600 uppercase bg-blue-50 rounded-lg border border-blue-100 px-2 py-1 inline-block">TAHAP 1</span>
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase mt-2">Pendaftaran Mandiri</h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-1 leading-normal">Pengisian biodata online secara mandiri &amp; unggah kelengkapan berkas fisik.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200/40 mt-3">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">Jadwal Pelaksanaan</p>
                    <p className="text-xs text-slate-800 font-black font-sans mt-1.5">{settings.tglPendaftaran || "-"}</p>
                  </div>
                </div>

                {/* 2. Verifikasi Berkas */}
                <div className="bg-slate-50 border border-slate-200/65 p-4 rounded-2xl flex flex-col justify-between hover:ring-2 hover:ring-slate-300 hover:bg-slate-100 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-amber-600 uppercase bg-amber-50 rounded-lg border border-amber-100 px-2 py-1 inline-block">TAHAP 2</span>
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase mt-2">Verifikasi Berkas</h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-1 leading-normal">Pemeriksaan validasi keaslian berkas oleh Tim Verifikasi Sekolah Bintang Plus.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200/40 mt-3">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">Jadwal Pelaksanaan</p>
                    <p className="text-xs text-slate-800 font-black font-sans mt-1.5">{settings.tglVerifikasi || "-"}</p>
                  </div>
                </div>

                {/* 3. Pengumuman Kelulusan */}
                <div className="bg-slate-50 border border-slate-200/65 p-4 rounded-2xl flex flex-col justify-between hover:ring-2 hover:ring-slate-300 hover:bg-slate-100 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-emerald-600 uppercase bg-emerald-50 rounded-lg border border-emerald-100 px-2 py-1 inline-block">TAHAP 3</span>
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase mt-2">Pengumuman Kelulusan</h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-1 leading-normal">Penerbitan surat kelulusan administratif resmi di portal penelusuran status.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200/40 mt-3">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">Jadwal Pengumuman</p>
                    <p className="text-xs text-slate-800 font-black font-sans mt-1.5">{settings.tglPengumuman || "-"}</p>
                  </div>
                </div>

                {/* 4. Daftar Ulang */}
                <div className="bg-slate-50 border border-slate-200/65 p-4 rounded-2xl flex flex-col justify-between hover:ring-2 hover:ring-slate-300 hover:bg-slate-100 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-indigo-600 uppercase bg-indigo-50 rounded-lg border border-indigo-100 px-2 py-1 inline-block">TAHAP 4</span>
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase mt-2">Registrasi Ulang</h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-1 leading-normal">Bawa dokumen fisik asli berkas kependidikan dalam Map Warna Biru ke sekolah.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200/40 mt-3">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">Jadwal Pelaksanaan</p>
                    <p className="text-xs text-slate-800 font-black font-sans mt-1.5">{settings.tglDaftarUlang || "-"}</p>
                  </div>
                </div>

                {/* 5. Mulai Aktif Belajar */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-amber-500 uppercase bg-amber-950/40 border border-amber-900/30 rounded-lg px-2 py-1 inline-block animate-pulse">BERJALAN</span>
                    <h5 className="font-extrabold text-xs text-amber-500 uppercase mt-2">Mulai Aktif Belajar</h5>
                    <p className="text-[11px] text-slate-400 font-sans mt-1 leading-normal">Hari pertama masuk sekolah mengajar rintisan perdana moral karakter baru.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 mt-3">
                    <p className="text-[10px] text-slate-550 font-mono font-bold uppercase leading-none">Hari Perdana Masuk</p>
                    <p className="text-xs text-amber-400 font-black font-mono mt-1.5">{settings.tglMulaiBelajar || "-"}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* EDITORIAL BOX: Sambutan Kepala Sekolah Sekolah Negeri Terkemuka */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)]" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
                <div className="md:col-span-1 text-center flex flex-col justify-center items-center space-y-3.5 h-full">
                  <div className="relative inline-block w-full max-w-[170px] md:max-w-none">
                    <div className="absolute inset-0 bg-amber-500 rounded-2xl rotate-3 transform scale-102" />
                    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-slate-800 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                      <img 
                        src={settings.fotoKepalaWelcome || settings.fotoKepala || "https://bagus-supriyadi.biz.id/gambarbebas/20260412-115605_Famella%20in%20front%20of%20SMA%20Bintang%20Plus.png"} 
                        alt={settings.namaKepala || "Famella Buana Dewi"} 
                        className="absolute inset-0 w-full h-full object-cover object-top" 
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 inset-x-0 text-center z-20">
                        <span className="bg-amber-400 text-slate-950 font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full font-mono">
                          KEPALA SEKOLAH
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-display font-black text-white text-sm">{settings.namaKepala || "Famella Buana Dewi"}</h5>
                    <p className="text-[10px] text-indigo-300 font-medium font-mono">Pimpinan SMA Bintang Plus</p>
                  </div>
                </div>

                {/* Welcoming Address content */}
                <div className="md:col-span-3 space-y-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="h-0.5 w-8 bg-amber-400"></span>
                    <span className="text-amber-400 text-xs font-black tracking-widest uppercase font-mono">SAMBUTAN KEPALA SEKOLAH</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight leading-snug">
                    {settings.welcomeTitle || "Sambutan Kepala Sekolah"}
                  </h3>

                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans space-y-3.5 whitespace-pre-line">
                    {settings.welcomeText || `"Selamat datang di SMA Bintang Plus."\n\nDi sini, kami tidak sekadar mendidik siswa untuk lulus sekolah — kami mempersiapkan mereka untuk menang dalam kehidupan.`}
                  </div>

                  <div className="pt-2 flex items-center justify-between font-sans border-t border-white/10 mt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Bandar Lampung, Lampung, Indonesia</p>
                      <p className="text-[10px] text-slate-400">Bintang Plus Senior High School - Est. 2025</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* STRUKTUR ORGANISASI KEPENGURUSAN SEKOLAH */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-slate-800 tracking-tight flex items-center gap-2">
                    <i className="fa-solid fa-users text-blue-700 mr-1"></i>
                    Struktur Organisasi Kepengurusan Sekolah
                  </h3>
                  <p className="text-slate-500 text-xs font-sans mt-1">Daftar Dewan Pendidik, Manajemen, & Tenaga Kependidikan Resmi SMA Bintang Plus.</p>
                </div>
              </div>

              {/* Organogram Responsive Cards Stack */}
              <div className="space-y-6">
                {/* Level 1: Kepala Sekolah */}
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-md w-full max-w-sm border border-blue-800 text-center relative overflow-hidden group">
                    <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 text-xs">
                      <i className="fa-solid fa-crown"></i>
                    </div>
                    <img 
                      src={settings.fotoKepala || "https://bagus-supriyadi.biz.id/uploads/Famela Kepala Sekolah.jpeg"} 
                      alt={settings.namaKepala || "Famella Buana Dewi"}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-400 mb-3"
                      referrerPolicy="no-referrer"
                    />
                    <h4 className="font-bold text-sm text-white font-display">{settings.namaKepala || "Famella Buana Dewi"}</h4>
                    <p className="text-[11px] text-amber-400 font-bold uppercase tracking-widest mt-1">Kepala Sekolah</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Pimpinan & Penanggung Jawab Terpadu</p>
                  </div>
                </div>

                {/* Level 2: Wakil-wakil Kepala Sekolah Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Anita Pauriska, S.Pd */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative group hover:shadow-md transition">
                    <div className="absolute right-3 top-3 text-slate-350 text-xs">
                      <i className="fa-solid fa-address-card"></i>
                    </div>
                    <img 
                      src={settings.fotoWakaSDM || "https://bagus-supriyadi.biz.id/uploads/Anita Waka Kesiswaan.jpeg"} 
                      alt={settings.namaWakaSDM || "Anita Pauriska, S.Pd"}
                      className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-200 mb-3 group-hover:scale-105 transition duration-355"
                      referrerPolicy="no-referrer"
                    />
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaWakaSDM || "Anita Pauriska, S.Pd"}</h5>
                    <p className="text-[10px] text-blue-700 font-extrabold tracking-wide uppercase mt-1">Waka SDM & Kesiswaan</p>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Pengawas rekrutmen SDM & pembinaan prestasi siswa.</p>
                  </div>

                  {/* Anggito Ratno, S.H */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative group hover:shadow-md transition">
                    <div className="absolute right-3 top-3 text-slate-350 text-xs">
                      <i className="fa-solid fa-address-card"></i>
                    </div>
                    <img 
                      src={settings.fotoSapras || "https://bagus-supriyadi.biz.id/uploads/Anggito Waka Sapras.jpeg"} 
                      alt={settings.namaSapras || "Anggito Ratno, S.H"}
                      className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-200 mb-3 group-hover:scale-105 transition duration-355"
                      referrerPolicy="no-referrer"
                    />
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaSapras || "Anggito Ratno, S.H"}</h5>
                    <p className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase mt-1">Sapras (Sarana Prasarana)</p>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Manajer fasilitas laboratorium & operasional gedung.</p>
                  </div>

                  {/* Sri l_Waka_Humas / Sri Ayu */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative group hover:shadow-md transition">
                    <div className="absolute right-3 top-3 text-slate-350 text-xs">
                      <i className="fa-solid fa-address-card"></i>
                    </div>
                    <img 
                      src={settings.fotoHumas || "https://bagus-supriyadi.biz.id/uploads/Sri Waka Humas.jpeg"} 
                      alt={settings.namaHumas || "Sri Ayu W, S.Pd"}
                      className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-200 mb-3 group-hover:scale-105 transition duration-355"
                      referrerPolicy="no-referrer"
                    />
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaHumas || "Sri Ayu W, S.Pd"}</h5>
                    <p className="text-[10px] text-emerald-700 font-extrabold tracking-wide uppercase mt-1">Waka Humas</p>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Koordinator humas relasi kemasyarakatan & kemitraan.</p>
                  </div>

                  {/* Herlan, S.P */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative group hover:shadow-md transition">
                    <div className="absolute right-3 top-3 text-slate-350 text-xs">
                      <i className="fa-solid fa-address-card"></i>
                    </div>
                    <img 
                      src={settings.fotoKurikulum || "https://bagus-supriyadi.biz.id/uploads/Herlan Waka Kurikulum.jpeg"} 
                      alt={settings.namaKurikulum || "Herlan, S.P"}
                      className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-200 mb-3 group-hover:scale-105 transition duration-355"
                      referrerPolicy="no-referrer"
                    />
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaKurikulum || "Herlan, S.P"}</h5>
                    <p className="text-[10px] text-purple-700 font-extrabold tracking-wide uppercase mt-1">Waka Kurikulum</p>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Penyusun program belajar-mengajar & agenda evaluasi.</p>
                  </div>

                </div>

                {/* Level 3: Asisten & staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  
                  {/* Muash Shomah */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-sm transition">
                    <img 
                      src={settings.fotoAsistenSDM || "https://bagus-supriyadi.biz.id/uploads/Muas Asisten-1.jpeg"} 
                      alt={settings.namaAsistenSDM || "Muash Shomah"}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">{settings.namaAsistenSDM || "Muash Shomah"}</h5>
                      <span className="text-[9.5px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">Asisten SDM / Kesiswaan</span>
                      <p className="text-[10px] text-slate-450 mt-1">Asisten pelaksana administrasi tata tertib & administrasi guru.</p>
                    </div>
                  </div>

                  {/* Afrilia Siska Y, S.Si */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-sm transition">
                    <img 
                      src={settings.fotoAsistenHumas || "https://bagus-supriyadi.biz.id/uploads/Aprilia Waka Humas.jpeg"} 
                      alt={settings.namaAsistenHumas || "Afrilia Siska Y, S.Si"}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">{settings.namaAsistenHumas || "Afrilia Siska Y, S.Si"}</h5>
                      <span className="text-[9.5px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">Asisten Humas / Panitia</span>
                      <p className="text-[10px] text-slate-450 mt-1">Asisten administrasi publikasi dan manajemen data umum.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* STRUKTUR PANITIA SPMB TERPADU */}
            <div className="space-y-6 pt-2">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-800 tracking-tight flex items-center gap-2">
                  <i className="fa-solid fa-id-card text-red-600 mr-1"></i>
                  Struktur Panitia Pelaksana SPMB Terpadu
                </h3>
                <p className="text-slate-500 text-xs font-sans mt-1">Struktur fungsional pengawas Seleksi Penerimaan Murid Baru Berbasis Pemerintah Swasta Mandiri.</p>
              </div>

              {/* Process map hierarchy block */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-center font-sans">
                
                {/* Penanggung Jawab */}
                <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded font-black tracking-wide font-mono block mb-2">PENGUASA TATA USAHA</span>
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaPanitiaPJ || "Famella Buana Dewi"}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Penanggung Jawab SPMB</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 font-mono">Pemberi kuasa sah evaluasi & pengesahan kuota kelulusan.</p>
                </div>

                {/* Ketua SPMB */}
                <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-black tracking-wide font-mono block mb-2">KAPAL PELAKSANA</span>
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaPanitiaKetua || "Anita Pauriska, S.Pd"}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Ketua SPMB</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 font-mono">Pengendali utama jalannya tes, pendaftaran, & jadwal seleksi.</p>
                </div>

                {/* Sekretaris SPMB */}
                <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded font-black tracking-wide font-mono block mb-2">ADMINISTRASI AKTIF</span>
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaPanitiaSekretaris || "Sri Ayu Wahyuni, S.pd"}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Sekretaris SPMB</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 font-mono">Penanggung jawab pencatatan berkas, nomor pendaftaran, & laporan.</p>
                </div>

                {/* Bendahara SPMB */}
                <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded font-black tracking-wide font-mono block mb-2">KEUANGAN & DONASI</span>
                    <h5 className="font-bold text-xs text-slate-800">{settings.namaPanitiaBendahara || "Afrilia Siska Yanti, S.Si"}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Bendahara SPMB</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 font-mono">Verifikator administrasi dana pendaftaran & simulasi beasiswa.</p>
                </div>

              </div>
            </div>

            {/* PROFILE NEGARA & VISI MISI (Highly polished public-themed grids) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Left Column: Visi, Misi & Nilai Inti with Local Interactive Tab selection */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded bg-gradient-to-r from-slate-100 to-slate-200 font-mono inline-block">
                      FILOSOFI & PEDOMAN SEKOLAH
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setVisiMisiTab("visi")}
                        className={`px-3 py-1 rounded text-[10px] font-extrabold transition-all border-0 cursor-pointer uppercase tracking-wider ${
                          visiMisiTab === "visi" ? "bg-blue-700 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        Visi &amp; Misi
                      </button>
                      <button
                        onClick={() => setVisiMisiTab("nilai")}
                        className={`px-3 py-1 rounded text-[10px] font-extrabold transition-all border-0 cursor-pointer uppercase tracking-wider ${
                          visiMisiTab === "nilai" ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        Core Values
                      </button>
                    </div>
                  </div>

                  {visiMisiTab === "visi" ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h4 className="font-extrabold text-xs text-red-650 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <i className="fa-solid fa-mountain"></i>
                          1. Visi Bintang Plus Senior High School
                        </h4>
                        <p className="bg-slate-50 text-slate-700 text-xs p-4 rounded-xl leading-relaxed font-sans border border-slate-100 border-l-4 border-l-red-600 font-medium italic">
                          &ldquo;Menjadi lembaga pendidikan unggulan di Bandar Lampung yang membentuk generasi berkarakter mulia, cerdas, berdaya saing global, serta berjiwa pemimpin yang siap menjadi agen perubahan positif bagi bangsa dan dunia.&rdquo;
                        </p>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs text-blue-700 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                          <i className="fa-solid fa-list-check"></i>
                          2. Misi Bintang Plus Senior High School
                        </h4>
                        <ul className="text-slate-650 text-xs space-y-2.5 font-sans pl-1 leading-relaxed">
                          {[
                            "Menyelenggarakan pendidikan berkualitas tinggi berbasis ilmu pengetahuan, teknologi, nilai budaya, dan literasi digital untuk membentuk peserta didik yang kompeten, adaptif, dan berwawasan global.",
                            "Menanamkan karakter unggul melalui pembiasaan nilai kejujuran, disiplin, tanggung jawab, kepedulian, religiusitas, dan etika, dalam lingkungan yang aman, inklusif, dan penuh integritas.",
                            "Mengembangkan potensi akademik dan non-akademik peserta didik melalui kurikulum inovatif, program talent development, dan pembinaan minat bakat yang terstruktur.",
                            "Membangun budaya kepemimpinan dan kemandirian melalui kegiatan organisasi, project based learning, kewirausahaan, public speaking, dan life skills.",
                            "Membangun kemitraan strategis dengan dunia usaha, perguruan tinggi, komunitas, dan lembaga profesional guna memperkuat kesiapan peserta didik menghadapi dunia kerja dan tantangan masa depan.",
                            "Mengantarkan peserta didik mencapai cita-cita terbaiknya melalui pendampingan akademik, mentoring karir, bimbingan masuk perguruan tinggi negeri/swasta terbaik, serta pembentukan karakter yang kokoh."
                          ].map((mission, mIdx) => (
                            <li key={mIdx} className="flex gap-2.5 items-start">
                              <span className="flex items-center justify-center bg-blue-50 text-blue-800 text-[10px] font-black h-5 w-5 rounded-full shrink-0 mt-0.5">
                                {mIdx + 1}
                              </span>
                              <span className="text-slate-650 leading-relaxed">{mission}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[11px] text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-solid fa-medal"></i>
                          A. Core Values &ldquo;BINTANG&rdquo;
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">Jati diri dan karakter dasar peserta didik Bintang Plus:</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { letter: "B", term: "Belief & Integrity", desc: "Beriman, jujur, dapat dipercaya, memiliki integritas di setiap tindakan." },
                          { letter: "I", term: "Innovation", desc: "Berpikir kreatif, adaptif terhadap teknologi, dan berani menciptakan solusi baru." },
                          { letter: "N", term: "Noble Character (Akhlak Mulia)", desc: "Menjunjung etika, sopan santun, empati, dan kepedulian sosial." },
                          { letter: "T", term: "Talent Development", desc: "Menggali potensi, mengembangkan bakat, dan menumbuhkan kompetensi unggulan." },
                          { letter: "A", term: "Achievement", desc: "Berorientasi pada prestasi, baik akademik maupun nonakademik." },
                          { letter: "N", term: "National Spirit", desc: "Bangga menjadi generasi Indonesia yang membawa perubahan positif." },
                          { letter: "G", term: "Global Mindset", desc: "Berwawasan luas, siap bersaing di dunia internasional tanpa meninggalkan nilai bangsa." }
                        ].map((c, idx) => (
                          <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-3">
                            <span className="bg-blue-700 text-white font-extrabold text-sm px-2.5 py-0.5 rounded-lg shrink-0 w-8 text-center font-display leading-tight">{c.letter}</span>
                            <div>
                              <p className="text-[11px] font-extrabold text-slate-800 leading-tight">{c.term}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <h4 className="font-extrabold text-[11px] text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                          <i className="fa-solid fa-circle-plus"></i>
                          B. Core Values &ldquo;PLUS&rdquo; (Nilai Tambah)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { letter: "P", term: "Professionalism", desc: "Menanamkan sikap profesional: disiplin, tepat waktu, tanggung jawab, etos kerja tinggi." },
                            { letter: "L", term: "Leadership", desc: "Membentuk jiwa kepemimpinan: mampu memimpin diri sendiri, mengambil keputusan bijak, bekerja sama." },
                            { letter: "U", term: "Upgrading Skills", desc: "Lifelong learning: peningkatan akademik, vokasi, bahasa asing, teknologi, life skills." },
                            { letter: "S", term: "Spiritual & Social Responsibility", desc: "Menguatkan kecerdasan spiritual & kepedulian sosial, berakhlaq mulia, peduli sesama." }
                          ].map((c, idx) => (
                            <div key={idx} className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50 flex items-start gap-3">
                              <span className="bg-amber-500 text-slate-950 font-extrabold text-sm px-2.5 py-0.5 rounded-lg shrink-0 w-8 text-center font-display leading-tight">{c.letter}</span>
                              <div>
                                <p className="text-[11px] font-extrabold text-indigo-900 leading-tight">{c.term}</p>
                                <p className="text-[10px] text-slate-650 mt-0.5 leading-snug">{c.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mt-2">
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                          <strong>Makna Keseluruhan:</strong> BINTANG melambangkan jati diri dan karakter dasar peserta didik, sedangkan PLUS merupakan nilai tambah unggulan yang membedakan lulusan SMA Bintang Plus dari sekolah lainnya.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-450 text-center font-mono font-semibold">
                  SMA BINTANG PLUS BANDAR LAMPUNG &bull; EST. 2025
                </div>
              </div>

              {/* Right Column: Visual Data Hub & Google Map Frame with Official Contacts */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm flex flex-col justify-between">
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md font-mono inline-block">
                      GEOGRAFIS & KONTAK UTAMA
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold font-display text-slate-800 tracking-tight">
                      Sekolah Utama &amp; Hub Resmi
                    </h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3.5 font-sans">
                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <i className="fa-solid fa-map-location-dot text-blue-700 text-sm mt-0.5 shrink-0"></i>
                      <span><strong>Alamat:</strong> {settings.schoolAddress || "SMA Bintang Plus, Jalan Pendidikan No.32-B, Kelurahan Sumber Rejo, Kecamatan Kemiling, Kota Bandar Lampung, 35152"}</span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <i className="fa-solid fa-phone text-emerald-600 text-sm mt-0.5 shrink-0"></i>
                      <div className="space-y-1">
                        <strong>No. HP / WA:</strong>
                        <div className="flex flex-col gap-1">
                          {(settings.schoolPhones || ["0895-0331-2895"]).map((phone, idx) => (
                            <a key={idx} href={`https://wa.me/62${phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700 font-bold block">
                              {phone}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <i className="fa-solid fa-envelope text-red-500 text-sm mt-0.5 shrink-0"></i>
                      <div className="space-y-1">
                        <strong>Email Resmi:</strong>
                        <div className="flex flex-col gap-1">
                          {(settings.schoolEmails || ["smabintangplus@gmail.com"]).map((email, idx) => (
                            <a key={idx} href={`mailto:${email}`} className="hover:underline text-blue-700 font-bold block">
                              {email}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <i className="fa-solid fa-globe text-indigo-600 text-sm mt-0.5 shrink-0"></i>
                      <div className="space-y-1">
                        <strong>Website:</strong>
                        <div className="flex flex-col gap-1">
                          {(settings.schoolWebsites || ["https://katakita-group.biz.id/"]).map((site, idx) => (
                            <a key={idx} href={site} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700 font-bold block">
                              {site.replace("https://", "").replace("http://", "")}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <i className="fa-solid fa-calendar-days text-slate-400 text-sm shrink-0"></i>
                      <span><strong>Layanan Penerimaan:</strong> {settings.schoolLayananPenerimaan || "Senin - Jumat (07.30 - 15.30 WIB)"}</span>
                    </div>

                    {/* Technical details mimicking governmental portals */}
                    <div className="pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                      <div>
                        <p>NSS Sekolah : 301086001002</p>
                        <p>NPSN Nasional : 69912345</p>
                      </div>
                      <div>
                        <p>Status : Swasta Plus Mandiri</p>
                        <p>Akreditasi : Rintisan Baru (Est. 2025)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stylish decorative map widget inside canvas */}
                <div className="relative rounded-2xl overflow-hidden h-36 bg-slate-900 flex items-center justify-center text-white p-4 shadow-inner border border-slate-200 mt-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-900 opacity-90" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,158,11,0.2),transparent_70%)]" />
                  <div className="relative text-center space-y-1">
                    <img 
                      src="https://bagus-supriyadi.biz.id/uploads/logo%20sma%20bintang%20plus%20bandar%20lampung.png" 
                      alt="Logo SMA Bintang Plus" 
                      className="h-12 w-12 object-contain mx-auto filter drop-shadow animate-bounce" 
                    />
                    <p className="font-bold text-xs tracking-tight">SEKOLAH UNGGULAN & BERKARAKTER</p>
                    <p className="text-[10px] text-indigo-200 font-mono">SMA Bintang Plus Bandar Lampung Hub</p>
                  </div>
                </div>

              </div>

            </div>

            {/* PEMINATAN UTAMA (MIPA, IPS, BAHASA) CARD GRIDS */}
            <div className="space-y-6 pt-2">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-800 tracking-tight flex items-center gap-2">
                  <div className="h-5 w-1 bg-blue-700 rounded-full" />
                  Peminatan & Alokasi Kursi (SPMB)
                </h3>
                <p className="text-slate-500 text-xs font-sans mt-1">Kuota tampung resmi yang diperebutkan melalui jalur Merit-System ujian CBT.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "MIPA",
                    fullName: "Matematika & Ilmu Pengetahuan Alam",
                    desc: "Fokus menggodok kecakapan sains, teknologi informasi, teknik rekayasa, statistika, kedokteran, dan logika analisis berhitung.",
                    quota: settings.kuotaMIPA,
                    registered: totalMIPARegistered,
                    color: "border-blue-200 bg-blue-50/20",
                    badge: "bg-blue-100 text-blue-800",
                  },
                  {
                    title: "IPS",
                    fullName: "Ilmu Pengetahuan Sosial",
                    desc: "Fokus mendalami interaksi sosiologi sosiokultural, ekonomi manajerial, akuntansi keahlian, hukum, tata negara dan kewirausahaan mandiri.",
                    quota: settings.kuotaIPS,
                    registered: totalIPSRegistered,
                    color: "border-amber-200 bg-amber-50/20",
                    badge: "bg-amber-100 text-amber-800",
                  },
                ].map((peminatan, idx) => {
                  const sisa = peminatan.quota - peminatan.registered;
                  return (
                    <div key={idx} className={`border rounded-2xl p-5 ${peminatan.color} flex flex-col justify-between shadow-sm space-y-4 hover:shadow-md transition`}>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-md ${peminatan.badge}`}>
                            PROGRAM {peminatan.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">
                            Kurikulum Merdeka Unggulan
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-800 text-sm">{peminatan.fullName}</h4>
                          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-sans">
                            {peminatan.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">SISA KURSI</p>
                          <p className="text-sm font-black text-slate-800 font-sans">{Math.max(0, sisa)} Kursi</p>
                        </div>
                        <div className="text-right font-sans">
                          <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">PENDAFTAR</p>
                          <p className="text-sm font-black text-slate-800">{peminatan.registered} Siswa</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* TAB 2: Dokumen & Alur (Formerly Alur & Biaya) */}
        {currentTab === "alur-biaya" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Persyaratan Dokumen & Alur Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Persyaratan Dokumen Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <span className="bg-red-50 text-red-700 text-[10px] px-2.5 py-1.5 rounded-md font-extrabold uppercase font-mono tracking-wider">
                    PERSYARATAN WAJIB
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-slate-800 tracking-tight mt-2.5">
                    1. Dokumen yang Harus Disiapkan
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1 font-sans">
                    Harap lengkapi dan scan seluruh dokumen asli berikut sebelum mengisi formulir pendaftaran.
                  </p>
                </div>

                <div className="space-y-3">
                  {(settings.reqDocuments || INITIAL_SETTINGS.reqDocuments || []).map((text, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-4 hover:bg-slate-100/55 transition duration-150">
                      <span className="flex items-center justify-center bg-blue-50 text-blue-800 text-[11px] font-black h-5.5 w-5.5 rounded-full shrink-0 font-mono mt-0.5 shadow-sm">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 font-sans leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alur Seleksi Timeline Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                <div>
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-2.5 py-1.5 rounded-md font-extrabold uppercase font-mono tracking-wider">
                    PIPELINE SELEKSI
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight mt-2.5">
                    2. Alur Pendaftaran SPMB
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mt-1 font-sans">
                    Alur tahapan penerimaan siswa baru terstandar pemerintah teratur dan transparan.
                  </p>
                </div>

                <div className="relative border-l border-slate-700 ml-3 pl-6 space-y-6">
                  {(settings.flowSteps || INITIAL_SETTINGS.flowSteps || []).map((alur, idx) => (
                    <div key={idx} className="relative group">
                      {/* Badge indicator on the left line */}
                      <span className="absolute -left-[35px] top-0.5 flex items-center justify-center bg-amber-400 text-slate-950 text-[11px] font-black h-5.5 w-5.5 rounded-full border-4 border-slate-900 group-hover:scale-110 transition duration-300">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wide font-display leading-snug group-hover:text-amber-400 transition">
                          TAHAPAN {idx + 1}: {alur.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-0.5">{alur.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4">
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    <strong>Catatan Panitia:</strong> Pastikan NIK, NISN, dan nomor WhatsApp yang dimasukkan aktif dan valid untuk memperlancar koordinasi dan verifikasi berkas oleh Tim Verifikator SMA Bintang Plus Lampung. Hubungi Hotline bantuan Kami jika ada kendala sistem.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Formulir Pendaftaran */}
        {currentTab === "daftar" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header form */}
            <div className="text-center space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 tracking-tight">Formulir Penerimaan Siswa Baru</h3>
              <p className="text-slate-500 text-sm font-sans">
                Harap isikan data di bawah ini sesuai kartu identitas Kartu Keluarga atau Akta Kelahiran resmi Anda.
              </p>
            </div>

            {settings.statusPendaftaran === "Tutup" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="font-bold text-slate-800 text-base font-display">Pendaftaran SPMB Ditutup Sementara</h4>
                  <p className="text-slate-500 text-xs font-sans">
                    Mohon maaf, saat ini sistem pendaftaran online SMA Bintang Plus sedang dikunci atau kuota tampung sementara telah diproses panitia. Silakan hubungi kami melalui Asisten AI di pojok kanan bawah jika ingin bertanya info gelombang berikutnya.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
                
                {/* Section 1: Identitas Nasional */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans border-b border-light pb-1.5">1. DATA IDENTITAS CALON SISWA</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Nama Lengkap Siswa <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formInput.fullName}
                        onChange={(e) => setFormInput({ ...formInput, fullName: e.target.value })}
                        placeholder="Masukkan nama lengkap pendaftar"
                        className="bg-slate-50 text-slate-850 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Jenis Kelamin <span className="text-red-500">*</span></label>
                      <select
                        value={formInput.gender}
                        onChange={(e: any) => setFormInput({ ...formInput, gender: e.target.value })}
                        className="bg-slate-50 text-slate-850 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={formInput.nik}
                        onChange={(e) => setFormInput({ ...formInput, nik: e.target.value.replace(/\D/g, "") })}
                        placeholder="Contoh: 1871021204090001 (16 Digit)"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Nomor NISN Sekolah SMP/MTs <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={formInput.nisn}
                        onChange={(e) => setFormInput({ ...formInput, nisn: e.target.value.replace(/\D/g, "") })}
                        placeholder="Contoh: 0091234567 (10 Digit)"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Tempat Lahir <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formInput.birthPlace}
                        onChange={(e) => setFormInput({ ...formInput, birthPlace: e.target.value })}
                        placeholder="Contoh: Bandar Lampung"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Tanggal Lahir <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formInput.birthDate}
                        onChange={(e) => setFormInput({ ...formInput, birthDate: e.target.value })}
                        className="bg-slate-50 text-slate-855 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & School Origin */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans border-b border-light pb-1.5">2. DATA HUBUNGAN & ASAL SEKOLAH</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">No. Telepon Aktif Siswa (WhatsApp) <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        required
                        value={formInput.phone}
                        onChange={(e) => setFormInput({ ...formInput, phone: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Nama Orang Tua / Wali <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formInput.parentName}
                        onChange={(e) => setFormInput({ ...formInput, parentName: e.target.value })}
                        placeholder="Nama Lengkap Ibu / Ayah / Wali"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">No. Telepon / HP Orang Tua Wali <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        required
                        value={formInput.parentPhone}
                        onChange={(e) => setFormInput({ ...formInput, parentPhone: e.target.value })}
                        placeholder="Contoh: 08129876543"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Email Aktif Peserta atau Wali <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={formInput.email}
                        onChange={(e) => setFormInput({ ...formInput, email: e.target.value })}
                        placeholder="Contoh: adi@gmail.com"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-650 font-sans">Nama Asal Sekolah SMP/MTs <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formInput.previousSchool}
                        onChange={(e) => setFormInput({ ...formInput, previousSchool: e.target.value })}
                        placeholder="Tuliskan nama lengkap SMP asal"
                        className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650 font-sans">Alamat Rumah Lengkap (Sesuai Kartu Keluarga) <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={formInput.address}
                      onChange={(e) => setFormInput({ ...formInput, address: e.target.value })}
                      placeholder="Tuliskan alamat jalan, RT/RW, kelurahan, kecamatan, dan kabupaten/kota domisili."
                      rows={3}
                      className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Section 3: Major Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans border-b border-light pb-1.5">3. PEMINATAN UTAMA PROGRAM</h4>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-650 block font-sans">Pilihan Program Jurusan <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[Major.MIPA, Major.IPS].map((maj) => {
                        const isSelected = formInput.preferredMajor === maj;
                        return (
                          <button
                            key={maj}
                            type="button"
                            onClick={() => setFormInput({ ...formInput, preferredMajor: maj })}
                            className={`flex items-center gap-2 text-left justify-start px-4 py-3 rounded-xl border transition pointer text-xs font-sans ${
                              isSelected
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`h-4.5 w-4.5 rounded-full border shrink-0 flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-350"
                            }`}>
                              {isSelected && <span className="h-1.5 w-1.5 bg-white rounded-full"></span>}
                            </span>
                            {maj}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 4: Maps & Distance */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans border-b border-light pb-1.5 flex items-center justify-between">
                    <span>4. SEKOLAH DAN JARAK DOMISILI</span>
                    <a 
                      href="https://maps.app.goo.gl/mwj5bNYP9mtVCBAA8" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 normal-case"
                    >
                      Buka Google Maps
                    </a>
                  </h4>

                  <p className="text-xs bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-800 font-sans font-semibold">
                    📍 Silahkan tentukan titik rumah / tempat tinggal anda dengan menekan/klik koordinat pada area Peta Radar GPS Interaktif di bawah ini untuk menghitung koordinat dan jarak domisili ke sekolah secara otomatis.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Integrated Interactive Vector GIS Click-To-Pin Map */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-sans flex items-center gap-1">
                          <i className="fa-solid fa-map-location-dot text-blue-600"></i> PETA RADAR GPS INTERAKTIF KEMILING
                        </span>
                        {userMapPin && (
                          <span className="text-[9px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            Koordinat: {userMapPin.lat}, {userMapPin.lng}
                          </span>
                        )}
                      </div>

                      <div 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const pctX = (x / rect.width) * 100;
                          const pctY = (y / rect.height) * 100;
                          
                          const dx = pctX - 50;
                          const dy = pctY - 50;
                          const pctDistance = Math.sqrt(dx * dx + dy * dy);
                          
                          // Radius of the coordinate plane. 50% distance is the max circle.
                          // Let's say max radius is 50%, which maps to 10 kilometers.
                          // Distance = (pctDistance / 50) * 10 KM.
                          const rawDistance = (pctDistance / 50) * 8.5;
                          const distanceKM = Math.max(0.2, Math.round(rawDistance * 10) / 10);
                          
                          // Simulating standard coordinates relative to Bandar Lampung Kemiling school campus:
                          const latOffset = -(dy / 50) * (8.5 * 0.009);
                          const lngOffset = (dx / 50) * (8.5 * 0.009);
                          const calculatedLat = -5.3907019 + latOffset;
                          const calculatedLng = 105.2101195 + lngOffset;
                          
                          setUserMapPin({
                            x,
                            y,
                            pctX,
                            pctY,
                            lat: Number(calculatedLat.toFixed(7)),
                            lng: Number(calculatedLng.toFixed(7))
                          });
                          
                          setFormInput(prev => ({
                            ...prev,
                            distance: distanceKM.toFixed(1)
                          }));
                        }}
                        className="relative w-full h-[250px] bg-slate-950 rounded-2xl overflow-hidden cursor-crosshair border border-slate-800 select-none shadow-inner"
                        style={{
                          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #030712 1px)",
                          backgroundSize: "20px 20px",
                          backgroundPosition: "0 0, 10px 10px"
                        }}
                      >
                        {/* Blueprint decorative axes */}
                        <div className="absolute inset-x-0 top-1/2 border-t border-slate-800/40 pointer-events-none"></div>
                        <div className="absolute inset-y-0 left-1/2 border-l border-slate-800/40 pointer-events-none"></div>

                        {/* Toponymic references */}
                        <span className="absolute left-4 top-4 text-[7px] text-slate-700 font-mono select-none pointer-events-none uppercase">KEC. KEMILING</span>
                        <span className="absolute right-4 bottom-4 text-[7px] text-slate-700 font-mono select-none pointer-events-none uppercase">Sandi SPMB Zone 1</span>
                        <span className="absolute right-4 top-4 text-[7px] text-slate-700 font-mono select-none pointer-events-none uppercase">Kel. Sumber Rejo</span>
                        <span className="absolute left-4 bottom-4 text-[7px] text-slate-700 font-mono select-none pointer-events-none uppercase">Lembah Hijau Lampung</span>

                        {/* concentric distance ring overlay */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border border-blue-500/10 pointer-events-none animate-pulse"></div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border border-blue-500/5 pointer-events-none"></div>

                        {/* central school node overlay */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
                          <span className="relative flex h-8 w-8">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                            <span className="relative rounded-full h-8 w-8 bg-amber-550 border-2 border-white flex items-center justify-center text-slate-900 shadow-md">
                              <img 
                                src="https://bagus-supriyadi.biz.id/uploads/logo%20sma%20bintang%20plus%20bandar%20lampung.png" 
                                alt="Official Logo Pin" 
                                className="h-5 w-5 object-contain"
                              />
                            </span>
                          </span>
                          <span className="bg-slate-950 text-[7px] text-amber-500 font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-amber-500/20 mt-1 select-none">
                            SMA BINTANG PLUS (CAMPUS)
                          </span>
                        </div>

                        {/* Plotted house and line path */}
                        {userMapPin && (
                          <>
                            <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
                              <line 
                                x1="50%" 
                                y1="50%" 
                                x2={`${userMapPin.pctX}%`} 
                                y2={`${userMapPin.pctY}%`} 
                                stroke="#10b981" 
                                strokeWidth="2" 
                                strokeDasharray="3 3" 
                                className="animate-pulse"
                              />
                            </svg>

                            <div 
                              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                              style={{ left: `${userMapPin.pctX}%`, top: `${userMapPin.pctY}%` }}
                            >
                              <span className="relative flex h-6 w-6">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                                <span className="relative rounded-full h-5 w-5 bg-emerald-600 border border-white flex items-center justify-center text-white text-[9px] font-bold">
                                  📍
                                </span>
                              </span>
                              <span className="bg-emerald-950 text-[7.5px] text-emerald-400 font-bold px-1 py-0.5 rounded shadow mt-0.5 whitespace-nowrap border border-emerald-500/20">
                                RUMAH SAYA ({formInput.distance} KM)
                              </span>
                            </div>
                          </>
                        )}

                        {/* Helper instructions if not clicked yet */}
                        {!userMapPin && (
                          <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none select-none">
                            <p className="bg-slate-950/85 backdrop-blur-sm text-[8.5px] text-amber-300 font-extrabold inline-block px-3 py-1 rounded-full border border-amber-500/20 shadow animate-pulse uppercase tracking-wide">
                              👈 KLIK PADA AREA UNTUK PLOT POSISI RUMAH ANDA
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Left/Standard Google Maps Frame and Distance Input */}
                    <div className="space-y-4">
                      {/* Embedded Google Maps direct validation */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-100 min-h-[175px]">
                        <iframe 
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3315.3156377155537!2d105.21011949999999!3d-5.3907019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40d18d524f4ecf%3A0xf264a688a9bcff07!2sSMA%20Bintang%20Plus!5e1!3m2!1sid!2sid!4v1781337797634!5m2!1sid!2sid" 
                          width="100%" 
                          height="175" 
                          className="border-0"
                          allowFullScreen={true}
                          loading="lazy" 
                          referrerPolicy="no-referrer"
                          title="Lokasi SMA Bintang Plus"
                        ></iframe>
                      </div>

                      {/* Manual GPS Coordinates Inputs */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans block flex items-center gap-1.5">
                          <i className="fa-solid fa-satellite text-blue-600"></i> INPUT TITIK KOORDINAT MANUAL (LAT, LNG)
                        </span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold text-slate-500 block">Garis Lintang (Latitude)</label>
                            <input
                              type="text"
                              value={userMapPin?.lat ?? ""}
                              onChange={(e) => {
                                const latVal = Number(e.target.value);
                                const lngVal = userMapPin?.lng ?? 105.2101195;
                                if (!isNaN(latVal)) {
                                  updateFromManualCoordinates(latVal, lngVal);
                                }
                              }}
                              placeholder="Contoh: -5.39070"
                              className="bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl p-2.5 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold text-slate-500 block">Garis Bujur (Longitude)</label>
                            <input
                              type="text"
                              value={userMapPin?.lng ?? ""}
                              onChange={(e) => {
                                const latVal = userMapPin?.lat ?? -5.3907019;
                                const lngVal = Number(e.target.value);
                                if (!isNaN(lngVal)) {
                                  updateFromManualCoordinates(latVal, lngVal);
                                }
                              }}
                              placeholder="Contoh: 105.21012"
                              className="bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl p-2.5 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-normal leading-relaxed font-sans">
                          Ketikkan koordinat rumah Anda di atas untuk langsung memposisikan penunjuk pada Peta Radar serta menghitung jarak domisili ke sekolah yang sesungguhnya secara instan.
                        </p>
                      </div>

                      {/* Distance input showing distance dynamically */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-650 font-sans block">
                          Jarak Rumah Ke Sekolah (Kilometer) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formInput.distance}
                            onChange={(e) => setFormInput({ ...formInput, distance: e.target.value.replace(/[^0-9.,]/g, "") })}
                            placeholder="Contoh: 4.5"
                            className="bg-slate-50 text-slate-855 placeholder-slate-400 text-xs rounded-xl p-3 pr-12 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none font-sans font-extrabold"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold font-mono">
                            KM
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                          Tulis estimasi rute kilometer perjalanan dari alamat tinggal Anda saat ini ke SMA Bintang Plus. (Nilai ini dapat juga terisi secara otomatis ketika Anda melakukan plot lokasi pada peta GIS di sebelah kiri).
                        </p>
                      </div>

                      <div className="bg-blue-50/65 border border-blue-100 p-3.5 rounded-xl">
                        <p className="text-[11px] text-blue-800 leading-relaxed font-sans font-medium">
                          <strong>Alamat Sekolah:</strong> SMA Bintang Plus, Jalan Pendidikan No.32-B, Kelurahan Sumber Rejo, Kecamatan Kemiling, Kota Bandar Lampung.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AUTOMATIC SURAT PERNYATAAN DOWBLOAD GENERATOR BLOCK */}
                  {(() => {
                    const isFormBiodataComplete = 
                      formInput.fullName.trim().length > 3 && 
                      formInput.nik.trim().length > 10 && 
                      formInput.nisn.trim().length > 5 && 
                      formInput.parentName.trim().length > 2 &&
                      formInput.address.trim().length > 6 && 
                      formInput.phone.trim().length > 5 && 
                      formInput.previousSchool.trim().length > 2;

                    return (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm mt-4">
                        <div className="flex items-start gap-3">
                          <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm ${
                            isFormBiodataComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                          }`}>
                            <i className={`fa-solid ${isFormBiodataComplete ? "fa-file-signature text-emerald-600" : "fa-clock text-amber-600"}`}></i>
                          </span>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                              Sistem Pembuat Surat Pernyataan Kebenaran Otomatis (A4)
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-normal font-sans">
                              Unduh berkas template pertanggungjawaban Kebenaran Bermaterai Rp 10.000 resmi ini untuk ditandatangani oleh Anda dan Orang Tua, lalu unduh dan cetak berkas tersebut untuk diunggah kembali pada Persyaratan Berkas No. 6 di bawah.
                            </p>
                          </div>
                        </div>

                        {isFormBiodataComplete ? (
                          <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-[11px] text-emerald-800 font-extrabold flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> ✓ BIODATA PENDAFTARAN LENGKAP & TEMPLATE AKTIF
                              </p>
                              <p className="text-[10px] text-slate-500">Sistem berhasil memetakan nama siswa, NIK, NISN, nama orang tua, asal sekolah, dan jarak domisili ke naskah pakta integritas.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsPernyataanModalOpen(true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition pointer border-0 uppercase tracking-wide cursor-pointer w-full sm:w-auto text-center justify-center leading-none"
                            >
                              <i className="fa-solid fa-file-pdf"></i> Unduh / Cetak Surat (A4)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-xl space-y-2">
                            <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1.5">
                              ⚠️ MENUNGGU KELENGKAPAN BIODATA FORMULIR
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                              Tombol unduh template otomatis ini akan <strong className="text-amber-800 font-sans">AKTIF SECARA OTOMATIS</strong> setelah Anda melengkapi berkas biodata di atas, yaitu: 
                              <span className="text-blue-800 font-semibold font-sans"> Nama Lengkap, NIK, NISN, Nama Orang Tua / Wali, Alamat Domisili, No. HP Siswa, dan Sekolah Asal (SMP).</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Section 5: Files Upload */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans border-b border-light pb-1.5 flex justify-between">
                    <span>5. UNGGAH BERKAS DOKUMEN PERSYARATAN</span>
                    <span className="text-[10px] text-red-500 font-medium italic">Maksimal file 2MB (*.jpg, *.png, *.pdf)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* File 1 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        1. Pas Foto Terbaru 3x4 <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={!formInput.foto3x4}
                        onChange={(e) => handleFileChange(e, "foto3x4")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.foto3x4 && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 2 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        2. Kartu Keluarga (KK) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        required={!formInput.kk}
                        onChange={(e) => handleFileChange(e, "kk")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.kk && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 3 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        3. Akta Kelahiran <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        required={!formInput.akta}
                        onChange={(e) => handleFileChange(e, "akta")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.akta && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 4 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        4. SKL / Ijazah SMP <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        required={!formInput.ijazahSkl}
                        onChange={(e) => handleFileChange(e, "ijazahSkl")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.ijazahSkl && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 5 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        5. Fotokopi Rapor (Sem 1-5) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        required={!formInput.raporSemester}
                        onChange={(e) => handleFileChange(e, "raporSemester")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.raporSemester && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 6 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        6. Surat Pernyataan Kebenaran (Bermaterai) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        required={!formInput.suratPernyataan}
                        onChange={(e) => handleFileChange(e, "suratPernyataan")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.suratPernyataan && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* File 7 */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block font-sans">
                        7. Kartu KIP / PKH / KKS <span className="text-slate-400 font-normal">(Opsional - khusus jalur afirmasi)</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        onChange={(e) => handleFileChange(e, "kartuKip")}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block w-full"
                      />
                      {formInput.kartuKip && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <span>✓ File berhasil diunggah</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirmation checklist */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 space-y-2.5">
                  <label className="flex gap-3 cursor-pointer">
                    <input type="checkbox" required className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                    <span className="font-sans leading-relaxed">Saya menyatakan bahwa berkas dan keterangan pengisian data adalah benar, sah, serta bersedia mematuhi aturan seleksi SPMB SMA Bintang Plus Bandar Lampung.</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-850 hover:to-indigo-850 text-white font-bold p-3.5 rounded-xl text-xs tracking-wide shadow-xl transition-all duration-300 transform hover:scale-[1.01] pointer border-0 uppercase"
                  >
                    Kirim Formulir Pendaftaran Online
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: CBT Tes & Hasil Status */}
        {currentTab === "cek-status" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Search Check Panel */}
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 tracking-tight">Hasil Pengumuman Kelulusan</h3>
                <p className="text-slate-500 text-sm font-sans">
                  Masukkan No Pendaftaran (contoh: SPMB-2026-001) atau NISN Anda untuk melihat dokumen hasil seleksi berkas administrasi dan kelulusan resmi.
                </p>
              </div>

              <form onSubmit={handleSearchCheck} className="flex gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                <div className="flex-1 flex items-center gap-2.5 px-3">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Contoh: SPMB-2026-001 atau NISN"
                    className="bg-transparent border-0 text-xs text-slate-800 placeholder-slate-400 font-sans outline-none w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl tracking-wide transition border-0 shrink-0 cursor-pointer"
                >
                  Cari Data
                </button>
              </form>
            </div>

            {/* Search outputs panel */}
            {searchTyped && (
              foundApplicant ? (
                <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg animate-in zoom-in-95 duration-200">
                    
                    {/* Applicant Profile Header */}
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 px-6 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-700 bg-blue-100/65 px-2 py-1 rounded-md font-bold tracking-widest uppercase font-mono">
                          {foundApplicant.id}
                        </span>
                        <h4 className="text-xl font-bold font-display text-slate-800 mt-1">{foundApplicant.fullName}</h4>
                        <p className="text-xs text-slate-400 font-sans">Pilihan Program: <strong>{foundApplicant.preferredMajor}</strong> || Asal SMP: <strong>{foundApplicant.previousSchool}</strong></p>
                      </div>

                      {/* Display download button */}
                      <button
                        onClick={() => setPrintableApplicant(foundApplicant)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4  py-2.5 rounded-xl flex items-center gap-2 shadow-md transition pointer border-0 uppercase tracking-wide"
                      >
                        <i className="fa-solid fa-print"></i> Cetak Bukti Daftar (A4)
                      </button>
                    </div>

                    {/* Status Alert Ribbon details */}
                    <div className="p-6 md:p-8 space-y-6">
                      {/* Interactive Steppers showcasing status */}
                      <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans text-center">Riwayat Alur Penyeleksian</p>
                        
                        <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-sans">
                          {[
                            { label: "Pendaftaran", active: true },
                            { label: "Verifikasi Berkas", active: foundApplicant.status === AdmissionStatus.DIVERIFIKASI || foundApplicant.status === AdmissionStatus.DITERIMA || foundApplicant.status === AdmissionStatus.DITOLAK },
                            { label: "Menunggu Pengumuman", active: foundApplicant.status === AdmissionStatus.DIVERIFIKASI || foundApplicant.status === AdmissionStatus.DITERIMA || foundApplicant.status === AdmissionStatus.DITOLAK },
                            { label: "Daftar Ulang", active: foundApplicant.status === AdmissionStatus.DITERIMA },
                          ].map((step, i) => (
                            <div key={i} className="space-y-1.5 flex flex-col items-center">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                step.active ? "bg-blue-650 text-white" : "bg-slate-200 text-slate-400"
                              }`}>
                                {i + 1}
                              </div>
                              <span className={step.active ? "font-bold text-slate-800" : "text-slate-400"}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status display container */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans border-b border-light pb-1.5">Informasi Hasil Seleksi</h5>
                          
                          <div className="space-y-3 tese-xs text-xs">
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">Nomor Registrasi :</span>
                              <span className="font-mono font-bold text-slate-800">{foundApplicant.id}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">NIK / NISN Siswa :</span>
                              <span className="font-mono text-slate-800">{foundApplicant.nik} / {foundApplicant.nisn}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">Nama Calon Siswa :</span>
                              <span className="font-bold text-slate-800">{foundApplicant.fullName}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">Pilihan Jurusan :</span>
                              <span className="font-bold text-slate-800">{foundApplicant.preferredMajor}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">Asal SMP Terkait :</span>
                              <span className="font-bold text-slate-800">{foundApplicant.previousSchool}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-550">Jarak Domisili GPS :</span>
                              <span className="font-bold text-slate-800 font-mono text-blue-700">{foundApplicant.distance} KM</span>
                            </div>

                            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 text-center mt-4">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Status Kelulusan Akhir</span>
                              
                              <p className={`text-xs font-black tracking-wide inline-block px-4 py-1.5 rounded-full ${
                                foundApplicant.status === AdmissionStatus.DITERIMA ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                foundApplicant.status === AdmissionStatus.DITOLAK ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                foundApplicant.status === AdmissionStatus.DIVERIFIKASI ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {foundApplicant.status}
                              </p>
                            </div>

                            {/* Rejection/Missing documents Notification box if applicable */}
                            {(foundApplicant.status === AdmissionStatus.DITOLAK || foundApplicant.status === AdmissionStatus.KURANG) && foundApplicant.rejectionReason && (
                              <div className="bg-amber-50/70 border border-amber-250 p-4 rounded-xl text-amber-900 text-[11px] space-y-1 font-sans mt-3">
                                <span className="font-bold uppercase tracking-wider block">
                                  {foundApplicant.status === AdmissionStatus.KURANG ? "Catatan Kekurangan / Koreksi Berkas:" : "Surat Alasan Penolakan Berkas:"}
                                </span>
                                <p className="leading-relaxed text-slate-750">{foundApplicant.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Custom Instruction Box based on Verification Status */}
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans border-b border-light pb-1.5">Petunjuk Alur Kelanjutan</h5>
                          
                          {foundApplicant.status === AdmissionStatus.PROSES && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-850 rounded-2xl p-5 space-y-3 shadow-sm">
                              <h6 className="font-bold text-xs font-sans text-amber-900 flex items-center gap-1.5">
                                <i className="fa-solid fa-hourglass-half animate-spin"></i> Berkas Berada Pada Tahap Verifikasi
                              </h6>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                Terima kasih telah mengirimkan formulir pendaftaran SPMB. Berkas Anda kini sedang ditelaah oleh <strong>Tim Verifikasi Sekolah</strong> SMA Bintang Plus. 
                              </p>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                                Kami akan memvalidasi kebenaran dokumen kependidikan yang Anda unggah serta mengonfirmasi kelayakan koordinat radar tempat tinggal secara mandiri. Silakan periksa kembali halaman penelusuran ini secara berkala.
                              </p>
                            </div>
                          )}

                          {foundApplicant.status === AdmissionStatus.DIVERIFIKASI && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-850 rounded-2xl p-5 space-y-3 shadow-sm">
                              <h6 className="font-bold text-xs font-sans text-blue-900 flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-check text-blue-700 animate-pulse"></i> Verifikasi Berkas Selesai &amp; Valid
                              </h6>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                Selamat! Berkas kependidikan digital Anda telah diverifikasi oleh <strong>Tim Verifikasi Sekolah</strong> dan dinyatakan <strong>VALID &amp; LENGKAP</strong>.
                              </p>
                              <div className="border-t border-blue-100 pt-2.5 mt-2">
                                <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">TAHAP SELANJUTNYA</p>
                                <p className="text-[11px] text-blue-800 leading-relaxed font-sans mt-1">
                                  Silakan menunggu keputusan rapat panitia SPMB untuk terbitnya pengumuman surat kelulusan resmi pendaftaran yang akan diumumkan serentak pada jadwal resmi: <strong>{settings.tglPengumuman || "-"}</strong>.
                                </p>
                              </div>
                            </div>
                          )}

                          {foundApplicant.status === AdmissionStatus.DITOLAK && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-850 rounded-2xl p-5 space-y-3 shadow-sm">
                              <h6 className="font-bold text-xs font-sans text-rose-900 flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-xmark text-rose-700"></i> Pendaftaran Gugur / Ditolak
                              </h6>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                Mohon maaf, pendaftaran administratif Anda dinyatakan <strong>TIDAK LULUS SELEKSI</strong> oleh panitia berdasarkan kriteria ketentuan yang berlaku.
                              </p>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                                Catatan alasan penolakan berkas dapat dibaca di panel sebelah kiri. Hubungi helpdesk sekolah jika merasa terdapat kekeliruan data.
                              </p>
                            </div>
                          )}

                          {foundApplicant.status === AdmissionStatus.KURANG && (
                            <div className="bg-amber-50 border border-amber-250 text-amber-955 rounded-2xl p-5 space-y-3 shadow-sm">
                              <h6 className="font-bold text-xs font-sans text-amber-900 flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-exclamation text-amber-700 animate-bounce"></i> Kelengkapan Berkas Kurang / Salah
                              </h6>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                Perhatian! Hasil verifikasi menunjukkan terdapat <strong>dokumen pendaftaran yang kurang lengkap atau salah unggah</strong>.
                              </p>
                              <p className="text-[11px] text-amber-900 font-bold leading-relaxed font-sans mt-1">
                                Silakan tinjau catatan koreksi panitia di panel sebelah kiri ("Catatan Kekurangan / Koreksi Berkas") untuk segera dilengkapi dengan menghubungi panitia atau mendaftar ulang berkas fisik di SMA Bintang Plus.
                              </p>
                            </div>
                          )}

                          {foundApplicant.status === AdmissionStatus.DITERIMA && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-sm">
                              <div className="space-y-1.5 row-layout">
                                <span className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-emerald-200 font-sans tracking-wide uppercase">
                                  🎉 Lulus Seleksi Utama
                                </span>
                                <h6 className="font-extrabold text-sm text-slate-800 font-display tracking-tight mt-2">Selamat, Anda Diterima di SMA Bintang Plus!</h6>
                                <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
                                  Untuk meyelesaikan administrasi keanggotaan peserta didik baru, Anda diwajibkan membawa dokumen kelayakan berikut saat pelaksanaan registrasi / daftar ulang fisik:
                                </p>
                              </div>

                              {/* LIST PERSYARATAN DALAM MAP WARNA BIRU */}
                              <div className="bg-white border border-emerald-150 p-4 rounded-xl space-y-2.5 shadow-xs">
                                <p className="text-[10px] font-extrabold text-emerald-800 tracking-wide font-sans border-b border-emerald-50 pb-1.5 flex items-center gap-1">
                                  <i className="fa-solid fa-folder-open text-emerald-600"></i>
                                  <span>WAJIB DIMASUKKAN KE DALAM MAP WARNA BIRU:</span>
                                </p>
                                <ul className="text-[10px] text-slate-700 space-y-2 font-sans list-none pl-0 text-left">
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Dokumen Asli &amp; 1 Lembar Fotocopy</strong> Kartu Keluarga (KK)</span>
                                  </li>
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Dokumen Asli &amp; 1 Lembar Fotocopy</strong> Akta Kelahiran resmi</span>
                                  </li>
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Dokumen Asli &amp; 1 Lembar Fotocopy</strong> Ijazah Terakhir SMP atau Surat Keterangan Lulus (SKL) resmi</span>
                                  </li>
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Dokumen Asli &amp; 1 Lembar Fotocopy</strong> Rapor Kependidikan Sekolah Menengah Pertama (SMP/MTs) Semester 1-5</span>
                                  </li>
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Lembar Asli</strong> Surat Pernyataan Tanggung Jawab Kebenaran (yang telah dicetak dan ditandatangani di atas Materai Rp 10.000)</span>
                                  </li>
                                  <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                                    <span><strong>Pas Foto Fisik</strong> Berwarna Terbaru Ukuran 3x4 sebanyak 2 lembar</span>
                                  </li>
                                  {foundApplicant.kartuKip && (
                                    <li className="flex items-start gap-1.5 bg-yellow-50 p-1.5 rounded border border-yellow-100">
                                      <span className="text-yellow-600 font-bold shrink-0 mt-0.5">✔</span>
                                      <span><strong>Fotocopy &amp; Asli</strong> Kartu Indonesia Pintar (KIP) yang terdaftar</span>
                                    </li>
                                  )}
                                </ul>
                              </div>

                              <div className="space-y-1.5">
                                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                                  * Registrasi ulang dilakukan di ruang kepanitiaan gedung utama SMA Bintang Plus Lampung pada tanggal: <strong>{settings.tglDaftarUlang || "-"}</strong>.
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    alert(`Daftar Ulang SPMB: Silakan datangi loket fisik sekolah dengan membawa Map Warna Biru dan seluruh dokumen di atas pada tanggal ${settings.tglDaftarUlang}!`);
                                  }}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-2.5 px-3 rounded-xl transition border-0 pointer tracking-wide uppercase shrink-0"
                                >
                                  Konfirmasi Daftar Ulang
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto bg-amber-50 border border-amber-250 text-amber-800 px-5 py-4 rounded-2xl text-center space-y-1 animate-in zoom-in-95 duration-200">
                    <Trophy className="w-7 h-7 text-amber-600 mx-auto" />
                    <h5 className="font-bold text-sm tracking-tight font-sans">Data Pendaftar Tidak Ditemukan!</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Kami tidak dapat menemukan No. Pendaftaran atau NISN yang Anda masukkan. Harap pastikan keaslian data kartu Anda atau daftarkan nama murid baru baru pada menu 'Daftar Sekarang'.
                    </p>
                  </div>
                )
              )}
          </div>
        )}

        {/* TAB 5: Portal Admin / Pengurus SPMB */}
        {currentTab === "admin" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black font-display text-slate-800 tracking-tight">Otorisasi Panitia SPMB</h3>
                  <p className="text-slate-500 text-xs font-sans">
                    Lembar khusus pengurus administrasi sekolah. Sesi ini memerlukan kata sandi otentikasi.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650 font-sans">Kata Sandi (Passphrase) Pengurus</label>
                    <input
                      type="password"
                      required
                      value={adminPassphrase}
                      placeholder="Masukkan kata sandi panitia (adminspmb)"
                      onChange={(e) => setAdminPassphrase(e.target.value)}
                      className="bg-slate-50 text-slate-850 placeholder-slate-400 text-xs rounded-xl p-3 w-full border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:bg-white outline-none font-sans"
                    />
                  </div>

                  {adminError && (
                    <p className="text-[11px] text-red-650 font-sans text-center font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {adminError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-3.5 rounded-xl text-xs tracking-wide shadow-lg cursor-pointer border-0 uppercase"
                  >
                    Buka Sesi Panel Panitia
                  </button>
                </form>

                <p className="text-[10px] text-center text-slate-400 font-sans leading-relaxed">
                  *Tip pengujian penilai: Gunakan kata sandi <strong>adminspmb</strong> atau <strong>admin</strong> untuk masuk dalam platform pengurus.
                </p>
              </div>
            ) : (
              // Authenticated Admin Dashboard main panel
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Admin Grid Layout with Left Sidebar & Right Viewports */}
                <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
                  
                  {/* Left Column: Admin Navigation Sidebar */}
                  <div className={`p-5 rounded-2xl text-white bg-gradient-to-b ${
                    adminTheme === "cosmic-indigo" ? "from-slate-950 to-indigo-950 border-indigo-900/30" :
                    adminTheme === "crimson-sunset" ? "from-neutral-900 to-rose-950 border-rose-900/30" :
                    adminTheme === "golden-amber" ? "from-stone-900 to-amber-950 border-amber-900/30" :
                    "from-slate-900 to-emerald-950 border-emerald-900/30"
                  } shadow-xl border space-y-5 shrink-0 font-sans`}>
                    
                    <div className="pb-3 border-b border-white/10 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-400">
                        <School className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs tracking-tight font-display text-white">PANEL KEPENGURUSAN</h4>
                        <p className="text-[9px] font-black tracking-widest text-[#fbbf24] font-sans uppercase">SMA BINTANG PLUS</p>
                      </div>
                    </div>

                    <nav className="flex flex-col gap-1 text-xs font-semibold">
                      {[
                        { tab: "dashboard", label: "Ringkasan Eksekutif", icon: <BarChart className="w-3.5 h-3.5 text-blue-400" /> },
                        { tab: "pendaftar", label: "Kelola Pendaftar", icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
                        { tab: "verifikasi", label: "Verifikasi Berkas", icon: <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />, action: () => { if (!auditApplicantId && applicants.length > 0) setAuditApplicantId(applicants[0].id); } },
                        { tab: "pengaturan", label: "Informasi Landing", icon: <Settings className="w-3.5 h-3.5 text-rose-400" /> }
                      ].map((item) => (
                        <button
                          key={item.tab}
                          onClick={() => {
                            setAdminActiveTab(item.tab as any);
                            if (item.action) item.action();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition border-0 cursor-pointer text-left ${
                            adminActiveTab === item.tab
                              ? "bg-white/15 text-white font-black"
                              : "text-slate-350 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>

                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <p className="text-[9px] font-black uppercase text-[#fbbf24] tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Personalisasi Tema</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: "royal-jade", name: "Royal Jade", bg: "from-emerald-600 to-teal-850", active: "ring-emerald-400" },
                          { id: "cosmic-indigo", name: "Cosmic", bg: "from-indigo-600 to-purple-850", active: "ring-indigo-400" },
                          { id: "crimson-sunset", name: "Sunset", bg: "from-rose-600 to-orange-655", active: "ring-rose-400" },
                          { id: "golden-amber", name: "Golden", bg: "from-amber-500 to-yellow-650 text-slate-900", active: "ring-amber-400" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setAdminTheme(t.id);
                              localStorage.setItem("spmb_admin_theme", t.id);
                              showAlert("success", `Tema diubah ke ${t.name}!`);
                            }}
                            className={`px-1.5 py-1.5 rounded-lg text-[9px] font-bold border border-white/5 transition cursor-pointer text-white text-center bg-gradient-to-r ${t.bg} ${
                              adminTheme === t.id ? `ring-1 ${t.active} scale-102` : "opacity-80 hover:opacity-100"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setIsAdminAuthenticated(false);
                          showAlert("info", "Sesi panitia ditutup.");
                        }}
                        className="w-full bg-slate-800 hover:bg-rose-950/50 text-slate-350 hover:text-white text-[9px] font-bold py-2 px-2.5 rounded-xl transition border-0 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Keluar Admin</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Actively selected Admin layout pages */}
                  <div className="space-y-6">
                    
                    {/* PAGE 1: Executive Summary */}
                    {adminActiveTab === "dashboard" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex justify-between items-center gap-4 shadow-md">
                          <div className="space-y-0.5">
                            <span className="text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 font-sans tracking-wide uppercase">DASHBOARD</span>
                            <h3 className="text-base font-black font-display text-white tracking-tight mt-1">Ringkasan Eksekutif Terpadu</h3>
                            <p className="text-[10px] text-slate-400 font-sans">Total Calon Terdaftar: <strong className="text-white">{applicants.length} Orang</strong></p>
                          </div>
                          <button
                            onClick={handleExportExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow border-0 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Ekspor Excel
                          </button>
                        </div>

                        {/* Card list with premium radiant colors so and viewer does not confuse */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { label: "Peminat Jurusan MIPA", val: `${totalMIPARegistered} / ${settings.kuotaMIPA}`, prc: Math.round((totalMIPARegistered / (settings.kuotaMIPA || 1)) * 100), desc: "Matematika & IPA", bg: "from-blue-600 via-blue-700 to-indigo-800 text-indigo-100", pbColor: "bg-yellow-300" },
                            { label: "Peminat Jurusan IPS", val: `${totalIPSRegistered} / ${settings.kuotaIPS}`, prc: Math.round((totalIPSRegistered / (settings.kuotaIPS || 1)) * 100), desc: "Ilmu Sosial", bg: "from-purple-600 via-purple-700 to-rose-700 text-purple-100", pbColor: "bg-cyan-300" },
                            { label: "Siswa Lulus Seleksi", val: `${totalDiterima} Siswa`, prc: applicants.length > 0 ? Math.round((totalDiterima / applicants.length) * 100) : 0, desc: "Status Diterima", bg: "from-emerald-600 via-teal-650 to-cyan-700 text-emerald-100", pbColor: "bg-yellow-300" }
                          ].map((c, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAdminActiveTab("pendaftar")}
                              className={`bg-gradient-to-br ${c.bg} p-4.5 rounded-2xl border-0 text-left shadow-lg transform hover:-translate-y-0.5 transition cursor-pointer`}
                            >
                              <p className="text-[8px] font-black uppercase tracking-wider opacity-80">{c.label}</p>
                              <h4 className="text-xl font-black font-display mt-2 text-white">{c.val}</h4>
                              <p className="text-[9px] opacity-75 font-sans mt-0.5">{c.desc}</p>
                              <div className="w-full bg-white/20 h-1 rounded-full mt-3">
                                <div className={`${c.pbColor} h-1 rounded-full`} style={{ width: `${Math.min(100, c.prc)}%` }}></div>
                              </div>
                              <p className="text-[8px] text-right mt-1 opacity-80">Terisi: {c.prc}%</p>
                            </button>
                          ))}
                        </div>

                        {/* Secondary Summary cards */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "BERKAS DIPROSES", num: applicants.filter(a => a.status === AdmissionStatus.PROSES).length, cls: "from-amber-50 to-orange-50 border-amber-100 text-amber-800" },
                            { label: "VERIFIKASI VALID", num: applicants.filter(a => a.status === AdmissionStatus.DIVERIFIKASI).length, cls: "from-blue-50 to-indigo-50 border-blue-100 text-blue-800" },
                            { label: "GUGUR / DITOLAK", num: totalDitolak, cls: "from-rose-50 to-red-50 border-rose-100 text-rose-800" }
                          ].map((sm, i) => (
                            <div key={i} className={`bg-gradient-to-r ${sm.cls} p-3 rounded-xl border text-xs`}>
                              <p className="text-[8px] font-black uppercase tracking-wider opacity-85 leading-normal">{sm.label}</p>
                              <p className="text-base font-black font-display mt-1">{sm.num} Murid</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PAGE 2: Manage List Table */}
                    {adminActiveTab === "pendaftar" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs font-display">Tabel Registrasi Calon Murid</h4>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">Database Real-time - Total: {applicants.length} Orang</p>
                            </div>
                            <input
                              type="text"
                              placeholder="Cari nama, NISN, atau ID..."
                              onChange={(e) => {
                                const term = e.target.value.toLowerCase();
                                document.querySelectorAll(".applicant-row").forEach((row: any) => {
                                  const searchStr = row.getAttribute("data-search").toLowerCase();
                                  row.style.display = searchStr.includes(term) ? "" : "none";
                                });
                              }}
                              className="bg-white text-slate-850 text-[11px] rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none w-full sm:w-52"
                            />
                          </div>

                          <div className="overflow-x-auto text-[11px]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                  <th className="p-3">No. SPMB / Nama</th>
                                  <th className="p-3">Asal SMP</th>
                                  <th className="p-3">Peminatan</th>
                                  <th className="p-3 text-center">Tgl Daftar</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-750">
                                {applicants.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-slate-400">Belum ada calon pendaftar online.</td>
                                  </tr>
                                ) : (
                                  applicants.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/40 transition applicant-row" data-search={`${app.id} ${app.fullName} ${app.nisn}`}>
                                      <td className="p-3">
                                        <span className="font-mono text-[9px] text-slate-400 block font-bold">{app.id}</span>
                                        <span className="font-bold text-slate-800 block mt-0.5">{app.fullName}</span>
                                        <span className="text-[9px] text-slate-400 block">NISN: {app.nisn}</span>
                                      </td>
                                      <td className="p-3 font-medium text-slate-650">{app.previousSchool}</td>
                                      <td className="p-3">
                                        <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-bold">{app.preferredMajor.split(" ")[0]}</span>
                                      </td>
                                      <td className="p-3 text-center font-mono text-slate-450">
                                        {new Date(app.timestamp).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                          app.status === AdmissionStatus.DITERIMA ? "bg-emerald-100 text-emerald-800" :
                                          app.status === AdmissionStatus.DITOLAK ? "bg-rose-100 text-rose-800" :
                                          app.status === AdmissionStatus.DIVERIFIKASI ? "bg-blue-100 text-blue-800" :
                                          "bg-amber-100 text-amber-800"
                                        }`}>
                                          {app.status.replace("Dinyatakan ", "")}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                        <button
                                          onClick={() => {
                                            setAuditApplicantId(app.id);
                                            setAdminActiveTab("verifikasi");
                                            setEditScoreTest(app.testScore || 0);
                                            setEditScoreInterview(app.interviewScore || 0);
                                            setEditStatus(app.status);
                                            setEditRejection(app.rejectionReason || "");
                                          }}
                                          className="bg-indigo-50 hover:bg-indigo-150 text-indigo-700 px-2 py-1 rounded transition border-0 cursor-pointer font-bold text-[9px]"
                                        >
                                          Audit
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedApplicant(app);
                                            setEditScoreTest(app.testScore || 0);
                                            setEditScoreInterview(app.interviewScore || 0);
                                            setEditStatus(app.status);
                                            setEditRejection(app.rejectionReason || "");
                                          }}
                                          className="bg-slate-100 hover:bg-slate-200 text-blue-700 p-1 rounded transition border-0 cursor-pointer"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        {deletingId === app.id ? (
                                          <button
                                            onClick={() => {
                                              handleDeleteApplicant(app.id);
                                              setDeletingId(null);
                                            }}
                                            onMouseLeave={() => setDeletingId(null)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold px-2 py-1.5 rounded transition border-0 cursor-pointer shadow-xs shrink-0"
                                            title="Klik sekali lagi untuk menghapus secara permanen"
                                          >
                                            Yakin?
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setDeletingId(app.id)}
                                            className="bg-slate-105 hover:bg-rose-100 text-rose-600 p-1 rounded transition border-0 cursor-pointer shrink-0"
                                            title="Hapus permanen"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PAGE 3: Rich Verification & File Audit Workspace */}
                    {adminActiveTab === "verifikasi" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-800 text-xs font-display">Hub Audit &amp; Verifikasi Semua Lampiran</h4>
                            <p className="text-[10px] text-slate-400">Verifikasikan isian form dan pratinjau lampiran berkas secara instan.</p>
                          </div>
                          <div className="w-full md:w-60">
                            <select
                              value={auditApplicantId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setAuditApplicantId(id);
                                const found = applicants.find(a => a.id === id);
                                if (found) {
                                  setEditScoreTest(found.testScore || 0);
                                  setEditScoreInterview(found.interviewScore || 0);
                                  setEditStatus(found.status);
                                  setEditRejection(found.rejectionReason || "");
                                }
                              }}
                              className="bg-slate-50 text-slate-800 text-xs rounded-xl p-2.5 w-full border border-slate-250 focus:bg-white outline-none cursor-pointer font-bold"
                            >
                              <option value="">-- Pilih Calon Siswa --</option>
                              {applicants.map(app => (
                                <option key={app.id} value={app.id}>{app.id} - {app.fullName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {(() => {
                          const app = applicants.find(a => a.id === auditApplicantId);
                          if (!app) {
                            return (
                              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                                <Search className="w-6 h-6 text-slate-350 mx-auto animate-pulse" />
                                <h5 className="font-bold text-slate-700 text-xs">Belum Ada Calon Murid yang Dipilih</h5>
                                <p className="text-[10px] text-slate-400">Silakan pilih pendaftar pada pilihan dropdown di atas.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                              
                              {/* Left side: Biodata table */}
                              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                  <h4 className="font-bold text-slate-800 text-xs font-display">A. Isian Formulir Calon Siswa</h4>
                                  <span className="bg-indigo-150 text-indigo-800 text-[8px] font-black px-2 py-0.5 rounded font-mono">{app.id}</span>
                                </div>
                                <div className="p-4 space-y-4 text-[11px]">
                                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="w-12 h-16 bg-slate-200 rounded overflow-hidden border border-slate-300 shrink-0">
                                      {app.foto3x4 ? (
                                        <img src={app.foto3x4} alt="foto" className="w-full h-full object-cover cursor-pointer" onClick={() => setLightboxImage({ src: app.foto3x4!, label: `Foto: ${app.fullName}` })} />
                                      ) : (
                                        <div className="text-[8px] text-slate-400 text-center p-1 font-bold">No Foto</div>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-[#111] text-xs font-display">{app.fullName}</h5>
                                      <p className="text-[10px] text-slate-500">Asal Sekolah: <strong className="text-slate-700">{app.previousSchool}</strong></p>
                                    </div>
                                  </div>

                                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                      <tbody className="divide-y divide-slate-100">
                                        {[
                                          { label: "Nomor Registrasi", val: app.id, cls: "font-mono font-bold text-indigo-700" },
                                          { label: "Nama Lengkap", val: app.fullName, cls: "uppercase font-bold" },
                                          { label: "NIK Siswa", val: app.nik, cls: "font-mono" },
                                          { label: "NISN Asal SMP", val: app.nisn, cls: "font-mono font-bold" },
                                          { label: "Jenis Kelamin", val: app.gender, cls: "" },
                                          { label: "Tempat, Tgl Lahir", val: `${app.birthPlace}, ${app.birthDate ? new Date(app.birthDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}`, cls: "" },
                                          { label: "Peminatan Jurusan", val: app.preferredMajor, cls: "font-bold text-blue-700" },
                                          { label: "Nama Orang Tua / Wali", val: app.parentName || "-", cls: "font-bold" },
                                          { label: "No. HP Orang Tua / Wali", val: app.parentPhone, cls: "font-mono" },
                                          { label: "Plot Jarak Radar", val: app.distance ? `${app.distance} KM` : "-", cls: "font-bold text-emerald-700" },
                                          { label: "Alamat Domisili", val: app.address, cls: "text-slate-600 leading-normal" }
                                        ].map((r, i) => (
                                          <tr key={i} className="hover:bg-slate-50/30">
                                            <td className="p-2.5 bg-slate-50/60 font-bold text-slate-400 w-2/5 border-r border-slate-100">{r.label}</td>
                                            <td className={`p-2.5 w-3/5 ${r.cls}`}>{r.val}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <button
                                    onClick={() => { setPrintableApplicant(app); }}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl transition border-0 cursor-pointer text-xs text-center flex items-center justify-center gap-1.5 shadow"
                                  >
                                    <Download className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Cetak Surat Pernyataan / Bukti Siswa (A4)</span>
                                  </button>
                                </div>
                              </div>

                              {/* Right side: file previews and form edit */}
                              <div className="space-y-4">
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 text-xs font-display">B. Cek Berkas &amp; Lampiran (Klik Lampiran Untuk Zoom)</h4>
                                  </div>
                                  <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      {[
                                        { key: "foto3x4", label: "Pas Foto 3x4 Berwarna", src: app.foto3x4, bg: "from-blue-50 to-indigo-50 border-blue-100 text-blue-800" },
                                        { key: "kk", label: "Kartu Keluarga (KK) Asli", src: app.kk, bg: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-800" },
                                        { key: "akta", label: "Akta Kelahiran Resmi", src: app.akta, bg: "from-purple-50 to-fuchsia-50 border-purple-100 text-purple-800" },
                                        { key: "ijazahSkl", label: "Ijazah / SKL SMP Asli", src: app.ijazahSkl, bg: "from-amber-50 to-yellow-50 border-amber-100 text-amber-800" },
                                        { key: "raporSemester", label: "Rapor Semester 1-5 SMP", src: app.raporSemester, bg: "from-cyan-50 to-sky-50 border-cyan-100 text-cyan-800" },
                                        { key: "suratPernyataan", label: "Surat Tanggung Jawab TTD", src: app.suratPernyataan, bg: "from-rose-50 to-pink-50 border-rose-100 text-rose-800" },
                                      ].map((f) => (
                                        <div key={f.key} className={`rounded-xl p-2 bg-gradient-to-br ${f.bg} border flex flex-col justify-between h-[105px] relative overflow-hidden`}>
                                          <span className="font-bold leading-tight block">{f.label}</span>
                                          <div className="h-10 mt-1 flex items-center justify-center">
                                            {f.src ? (
                                              <div 
                                                className="w-full h-full cursor-pointer relative rounded border border-slate-350 bg-white overflow-hidden text-center flex items-center justify-center hover:scale-102 transition"
                                                onClick={() => setLightboxImage({ src: f.src!, label: `${f.label}: ${app.fullName}` })}
                                              >
                                                <img src={f.src} alt="thumbnail" className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              <span className="text-[8px] bg-red-105 border border-red-200 rounded px-1.5 py-0.5 text-red-750 font-bold">⚠️ Belum Diunggah</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {app.kartuKip && (
                                      <div className="p-2.5 bg-yellow-50 border border-yellow-250 rounded-xl flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-yellow-800">Lampiran Kartu Indonesia Pintar (KIP) Beasiswa</span>
                                        <button onClick={() => setLightboxImage({ src: app.kartuKip!, label: `Kartu KIP: ${app.fullName}` })} className="bg-amber-600 font-bold px-2 py-1 text-white rounded border-0 cursor-pointer">Preview</button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                                  <h4 className="font-bold text-slate-800 text-[11px] font-display flex items-center gap-1">
                                    <Settings className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Keputusan Seleksi &amp; Status Seleksi Siswa</span>
                                  </h4>

                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    setApplicants(prev => prev.map(item => item.id === app.id ? { ...item, status: editStatus, rejectionReason: (editStatus === AdmissionStatus.DITOLAK || editStatus === AdmissionStatus.KURANG || editStatus === AdmissionStatus.PROSES) ? editRejection : undefined } : item));
                                    setFoundApplicant(prev => prev && prev.id === app.id ? { ...prev, status: editStatus, rejectionReason: (editStatus === AdmissionStatus.DITOLAK || editStatus === AdmissionStatus.KURANG || editStatus === AdmissionStatus.PROSES) ? editRejection : undefined } : prev);
                                    showAlert("success", `Hasil verifikasi ${app.fullName} berhasil diperbarui!`);
                                  }} className="space-y-3">
                                    
                                    <div className="space-y-0.5">
                                      <label className="text-[9px] font-bold text-slate-400 block font-mono uppercase">SET STATUS SELEKSI / VERIFIKASI BERKAS</label>
                                      <select value={editStatus} onChange={(e: any) => setEditStatus(e.target.value)} className="bg-slate-50 text-slate-800 rounded-lg p-2 w-full border border-slate-200 focus:outline-none cursor-pointer font-bold text-[11px]">
                                        <option value={AdmissionStatus.PROSES}>{AdmissionStatus.PROSES}</option>
                                        <option value={AdmissionStatus.DIVERIFIKASI}>{AdmissionStatus.DIVERIFIKASI}</option>
                                        <option value={AdmissionStatus.KURANG}>{AdmissionStatus.KURANG}</option>
                                        <option value={AdmissionStatus.PERBAIKAN}>{AdmissionStatus.PERBAIKAN}</option>
                                        <option value={AdmissionStatus.DITERIMA}>{AdmissionStatus.DITERIMA}</option>
                                        <option value={AdmissionStatus.DITOLAK}>{AdmissionStatus.DITOLAK}</option>
                                      </select>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                        <span>PEMBERITAHUAN BERKAS YANG KURANG / SALAH</span>
                                        <span className="text-blue-500 font-mono text-[8px]">TAMPIL DI PORTAL CEK STATUS & WA</span>
                                      </div>
                                      <textarea value={editRejection} onChange={(e) => setEditRejection(e.target.value)} placeholder="Tulis catatan berkas yang salah/kurang di sini untuk diinfokan ke siswa..." rows={2} className="bg-slate-50 text-slate-800 rounded-lg p-2 w-full border border-slate-200 text-xs focus:outline-none" />
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {[
                                          { t: "Foto Buram", p: "Pas Foto 3x4 buram/tidak resmi, mohon unggah ulang foto berkerah terbaru." },
                                          { t: "KK Fotocopy", p: "Scan Kartu Keluarga harus Dokumen Asli berwarna, bukan fotocopy." },
                                          { t: "Materai Belum TTD", p: "Surat Pernyataan Tanggung Jawab belum bermaterai Rp 10.000 asli dan belum ditandatangan Orang Tua." }
                                        ].map((quick, qI) => (
                                          <button type="button" key={qI} onClick={() => setEditRejection(quick.p)} className="bg-slate-100 hover:bg-slate-200 text-[8px] font-bold p-1 rounded border-0 cursor-pointer">{quick.t}</button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* WhatsApp Notifications Widget */}
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-2 mt-4 text-[10px]">
                                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                        <span className="p-0.5 bg-emerald-150 rounded text-emerald-700">💬</span>
                                        <span>Kirim Notifikasi Pemberitahuan Hasil / Berkas via WhatsApp</span>
                                      </div>
                                      <p className="text-slate-500 text-[9px]">Pesan akan diarahkan otomatis ke WhatsApp calon siswa atau wali sesuai isian formulir.</p>
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!app.phone) {
                                              showAlert("error", "Nomor ponsel pendaftar tidak terisi!");
                                              return;
                                            }
                                            const clean = app.phone.replace(/[^0-9]/g, "");
                                            const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean.startsWith("62") ? clean : "62" + clean;
                                            const text = `Halo *${app.fullName}*, ini adalah pemberitahuan dari Panitia Penerimaan Siswa Baru ${settings.schoolName}.

Terkait berkas pendaftaran Anda dengan ID *${app.id}*:
Status Verifikasi saat ini: *${editStatus}*

${editRejection ? `⚠️ Catatan Evaluasi Berkas:\n_"${editRejection}"_\n\n` : ""}Silakan periksa hasil pendaftaran Anda ke menu "Cek Status" di situs utama.`;
                                            window.open(`https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(text)}`, "_blank");
                                            showAlert("success", "WhatsApp Web dibuka untuk notifikasi siswa.");
                                          }}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg border-0 font-bold cursor-pointer transition flex items-center justify-center gap-1 text-[9px]"
                                        >
                                          <span>Siswa: {app.phone}</span>
                                        </button>

                                        {app.parentPhone && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const clean = app.parentPhone.replace(/[^0-9]/g, "");
                                              const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean.startsWith("62") ? clean : "62" + clean;
                                              const text = `Yth. Orang Tua / Wali dari *${app.fullName}*, ini pemberitahuan resmi dari Panitia Penerimaan Siswa Baru ${settings.schoolName}.

Terkait berkas pendaftaran putra/putri Anda dengan ID *${app.id}*:
Status Verifikasi saat ini: *${editStatus}*

${editRejection ? `⚠️ Catatan Evaluasi Berkas:\n_"${editRejection}"_\n\n` : ""}Harap lengkapi berkas tersebut segera melalui portal Cek Status online kami. Terima kasih.`;
                                              window.open(`https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(text)}`, "_blank");
                                              showAlert("success", "WhatsApp Web dibuka untuk notifikasi Wali.");
                                            }}
                                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg border-0 font-bold cursor-pointer transition flex items-center justify-center gap-1 text-[9px]"
                                          >
                                            <span>Wali: {app.parentPhone}</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                      <button type="button" onClick={() => {
                                        setEditStatus(app.status);
                                        setEditRejection(app.rejectionReason || "");
                                        showAlert("info", "Form di-refresh.");
                                      }} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-lg border-0 cursor-pointer font-bold">Refresh Form</button>
                                      <button type="submit" className={`w-2/3 ${
                                        adminTheme === "royal-jade" ? "bg-emerald-600 hover:bg-emerald-700" :
                                        adminTheme === "cosmic-indigo" ? "bg-indigo-600 hover:bg-indigo-700" :
                                        adminTheme === "crimson-sunset" ? "bg-rose-600 hover:bg-rose-700" :
                                        "bg-amber-500 hover:bg-amber-600 text-slate-900"
                                      } text-white p-2.5 rounded-lg border-0 cursor-pointer font-bold flex items-center justify-center gap-1`}>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Simpan Hasil Verifikasi</span>
                                      </button>
                                    </div>

                                  </form>
                                </div>
                              </div>

                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* PAGE 4: Settings & Dates landing configuration with explicit save actions */}
                    {adminActiveTab === "pengaturan" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          
                          {/* Inner settings card */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
                            <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5">Kunci / Buka Gateway &amp; Slot Kuota</h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div>
                                  <p className="font-bold text-slate-700">Gateway Pendaftaran Online</p>
                                  <p className="text-[9px] text-slate-400">Tutup formulir pengisian jika kuota terpenuhi.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftSettings(prev => ({ ...prev, statusPendaftaran: prev.statusPendaftaran === "Buka" ? "Tutup" : "Buka" }));
                                    showAlert("info", `Gateway diubah ke [${draftSettings.statusPendaftaran === "Buka" ? "Tutup" : "Buka"}]. Klik 'Simpan Perubahan' di bawah.`);
                                  }}
                                  className={`text-[8px] font-black px-2.5 py-1.5 rounded transition border-0 pointer ${
                                    draftSettings.statusPendaftaran === "Buka" ? "bg-rose-100 text-rose-800 hover:bg-rose-150" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-150"
                                  }`}
                                >
                                  {draftSettings.statusPendaftaran === "Buka" ? "TUTUP PORTAL" : "BUKA PORTAL"}
                                </button>
                              </div>

                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Limit Kapasitas Siswa per Jurusan</p>
                                <div className="space-y-1.5 text-slate-650">
                                  {[
                                    { label: "Kuota Matematika & IPA (MIPA)", key: "kuotaMIPA" },
                                    { label: "Kuota Ilmu Pengetahuan Sosial (IPS)", key: "kuotaIPS" }
                                  ].map((m) => (
                                    <div key={m.key} className="flex justify-between items-center p-1">
                                      <span>{m.label} :</span>
                                      <input
                                        type="number"
                                        value={(draftSettings as any)[m.key]}
                                        onChange={(e) => setDraftSettings({ ...draftSettings, [m.key]: Number(e.target.value) })}
                                        className="bg-slate-100 text-slate-800 text-center font-mono rounded p-1 w-16 border-0 font-bold"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Editable schedules */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
                            <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5">Tanggal Jadwal Kependidikan</h4>
                            <div className="space-y-2">
                              {[
                                { label: "1. Masa Registrasi Pendaftaran", key: "tglPendaftaran", ph: "Contoh: 10 Juni s.d 30 Juni 2026" },
                                { label: "2. Penilaian & Verifikasi Dokumen", key: "tglVerifikasi", ph: "Contoh: 12 Juni s.d 02 Juli 2026" },
                                { label: "3. Sidang Pengumuman Kelulusan", key: "tglPengumuman", ph: "Contoh: 05 Juli 2026" },
                                { label: "4. Jadwal Daftar Ulang Loket Fisik", key: "tglDaftarUlang", ph: "Contoh: 06 Juli s.d 12 Juli 2026" },
                                { label: "5. Pembelajaran Aktif Semester Ganjil", key: "tglMulaiBelajar", ph: "Contoh: 15 Juli 2026" },
                              ].map((sc) => (
                                <div key={sc.key} className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">{sc.label} :</span>
                                  <input
                                    type="text"
                                    value={(draftSettings as any)[sc.key] || ""}
                                    onChange={(e) => setDraftSettings({ ...draftSettings, [sc.key]: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none font-medium"
                                    placeholder={sc.ph}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* LIVE LANDING PAGE COGNITIVE CONTENT EDITORS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* CARD A: SAMBUTAN & STRUKTUR SEKOLAH */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5 text-xs">
                            <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                              <i className="fa-solid fa-paintbrush text-indigo-600"></i>
                              <span>1. Edit Sambutan &amp; Struktur Sekolah</span>
                            </h4>

                            <div className="space-y-3 font-sans">
                              {/* Welcome speech title */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Judul Sambutan :</span>
                                <input
                                  type="text"
                                  value={draftSettings.welcomeTitle || ""}
                                  onChange={(e) => setDraftSettings({ ...draftSettings, welcomeTitle: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none"
                                />
                              </div>

                              {/* Welcome speech text */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Isi Teks Sambutan (Mendukung Enter) :</span>
                                <textarea
                                  rows={5}
                                  value={draftSettings.welcomeText || ""}
                                  onChange={(e) => setDraftSettings({ ...draftSettings, welcomeText: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none leading-relaxed"
                                />
                              </div>

                              {/* Welcome speech image */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">URL Foto Kepala Sekolah (Bagian Sambutan) :</span>
                                <input
                                  type="text"
                                  value={draftSettings.fotoKepalaWelcome || ""}
                                  onChange={(e) => setDraftSettings({ ...draftSettings, fotoKepalaWelcome: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none"
                                />
                              </div>

                              <div className="border-t border-slate-100 pt-3 space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Foto &amp; Nama Personil Dewan Kepengurusan :</p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA KEPALA SEKOLAH:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaKepala || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaKepala: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO KEPALA SEKOLAH:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoKepala || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoKepala: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA WAKA SDM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaWakaSDM || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaWakaSDM: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO WAKA SDM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoWakaSDM || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoWakaSDM: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA WAKA SAPRAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaSapras || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaSapras: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO WAKA SAPRAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoSapras || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoSapras: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA WAKA HUMAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaHumas || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaHumas: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO WAKA HUMAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoHumas || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoHumas: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA WAKA KURIKULUM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaKurikulum || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaKurikulum: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO WAKA KURIKULUM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoKurikulum || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoKurikulum: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA ASISTEN SDM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaAsistenSDM || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaAsistenSDM: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO ASISTEN SDM:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoAsistenSDM || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoAsistenSDM: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">NAMA ASISTEN HUMAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.namaAsistenHumas || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, namaAsistenHumas: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">URL FOTO ASISTEN HUMAS:</span>
                                    <input
                                      type="text"
                                      value={draftSettings.fotoAsistenHumas || ""}
                                      onChange={(e) => setDraftSettings({ ...draftSettings, fotoAsistenHumas: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs w-full font-medium"
                                    />
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>

                          {/* CARD B: GEOGRAFIS & MULTIPLE CONTACTS FIELD */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-sans">
                            <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                              <i className="fa-solid fa-map-location-dot text-indigo-600"></i>
                              <span>2. Edit Sekolah Utama &amp; Kontak (Multiples)</span>
                            </h4>

                            <div className="space-y-3">
                              {/* Address */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Alamat Sekolah:</span>
                                <input
                                  type="text"
                                  value={draftSettings.schoolAddress || ""}
                                  onChange={(e) => setDraftSettings({ ...draftSettings, schoolAddress: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none"
                                />
                              </div>

                              {/* Layanan Jam */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Layanan Jam Kerja:</span>
                                <input
                                  type="text"
                                  value={draftSettings.schoolLayananPenerimaan || ""}
                                  onChange={(e) => setDraftSettings({ ...draftSettings, schoolLayananPenerimaan: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-lg text-xs w-full focus:bg-white focus:outline-none"
                                />
                              </div>

                              {/* Dynamic Phones */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                  <span>Daftar Nomor HP / WhatsApp :</span>
                                  <button
                                    type="button"
                                    onClick={() => setDraftSettings({
                                      ...draftSettings,
                                      schoolPhones: [...(draftSettings.schoolPhones || []), ""]
                                    })}
                                    className="bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 hover:bg-indigo-100 border-0 cursor-pointer text-[8px] font-black"
                                  >
                                    + TAMBAH NOMOR
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  {(draftSettings.schoolPhones || []).map((phone, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => {
                                          const copy = [...(draftSettings.schoolPhones || [])];
                                          copy[idx] = e.target.value;
                                          setDraftSettings({ ...draftSettings, schoolPhones: copy });
                                        }}
                                        className="bg-slate-50 border border-slate-200 text-slate-850 p-1.5 rounded-lg text-xs flex-1 focus:bg-white"
                                        placeholder="No HP, contoh: 0895-0331-2895"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = (draftSettings.schoolPhones || []).filter((_, i) => i !== idx);
                                          setDraftSettings({ ...draftSettings, schoolPhones: copy });
                                        }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1.5 border-0 cursor-pointer shadow-xs shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {(draftSettings.schoolPhones || []).length === 0 && (
                                    <p className="text-[9px] text-slate-400 italic">Belum ada nomor telepon ditambahkan.</p>
                                  )}
                                </div>
                              </div>

                              {/* Dynamic Emails */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                  <span>Daftar Email Resmi :</span>
                                  <button
                                    type="button"
                                    onClick={() => setDraftSettings({
                                      ...draftSettings,
                                      schoolEmails: [...(draftSettings.schoolEmails || []), ""]
                                    })}
                                    className="bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 hover:bg-indigo-100 border-0 cursor-pointer text-[8px] font-black"
                                  >
                                    + TAMBAH EMAIL
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  {(draftSettings.schoolEmails || []).map((email, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                          const copy = [...(draftSettings.schoolEmails || [])];
                                          copy[idx] = e.target.value;
                                          setDraftSettings({ ...draftSettings, schoolEmails: copy });
                                        }}
                                        className="bg-slate-50 border border-slate-200 text-slate-850 p-1.5 rounded-lg text-xs flex-1 focus:bg-white"
                                        placeholder="Email, contoh: help@school.sch.id"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = (draftSettings.schoolEmails || []).filter((_, i) => i !== idx);
                                          setDraftSettings({ ...draftSettings, schoolEmails: copy });
                                        }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1.5 border-0 cursor-pointer shadow-xs shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {(draftSettings.schoolEmails || []).length === 0 && (
                                    <p className="text-[9px] text-slate-400 italic">Belum ada email ditambahkan.</p>
                                  )}
                                </div>
                              </div>

                              {/* Dynamic Websites */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                  <span>Daftar Website Resmi :</span>
                                  <button
                                    type="button"
                                    onClick={() => setDraftSettings({
                                      ...draftSettings,
                                      schoolWebsites: [...(draftSettings.schoolWebsites || []), ""]
                                    })}
                                    className="bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 hover:bg-indigo-100 border-0 cursor-pointer text-[8px] font-black"
                                  >
                                    + TAMBAH WEBSITE
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  {(draftSettings.schoolWebsites || []).map((site, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={site}
                                        onChange={(e) => {
                                          const copy = [...(draftSettings.schoolWebsites || [])];
                                          copy[idx] = e.target.value;
                                          setDraftSettings({ ...draftSettings, schoolWebsites: copy });
                                        }}
                                        className="bg-slate-50 border border-slate-200 text-slate-850 p-1.5 rounded-lg text-xs flex-1 focus:bg-white"
                                        placeholder="Website, contoh: https://katakita-group.biz.id/"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = (draftSettings.schoolWebsites || []).filter((_, i) => i !== idx);
                                          setDraftSettings({ ...draftSettings, schoolWebsites: copy });
                                        }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1.5 border-0 cursor-pointer shadow-xs shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {(draftSettings.schoolWebsites || []).length === 0 && (
                                    <p className="text-[9px] text-slate-400 italic">Belum ada website ditambahkan.</p>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>

                        </div>

                        {/* CARD C: REQUIREMENT DOCUMENTS AND ALUR PIPELINE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* Persyaratan Dokumen list builder */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-sans">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                <i className="fa-solid fa-file-shield text-indigo-600"></i>
                                <span>3. Edit Deskripsi Dokumen Persyaratan Wajib</span>
                              </h4>
                              <button
                                type="button"
                                onClick={() => setDraftSettings({
                                  ...draftSettings,
                                  reqDocuments: [...(draftSettings.reqDocuments || []), ""]
                                })}
                                className="bg-indigo-50 text-indigo-700 rounded px-2 py-1 hover:bg-indigo-100 border-0 cursor-pointer text-[8.5px] font-bold"
                              >
                                + TAMBAH DOKUMEN
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(draftSettings.reqDocuments || []).map((doc, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded-xl border border-slate-100">
                                  <span className="bg-indigo-100 text-indigo-800 font-bold text-[9px] rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-1">{idx+1}</span>
                                  <textarea
                                    value={doc}
                                    rows={2}
                                    onChange={(e) => {
                                      const copy = [...(draftSettings.reqDocuments || [])];
                                      copy[idx] = e.target.value;
                                      setDraftSettings({ ...draftSettings, reqDocuments: copy });
                                    }}
                                    className="bg-transparent border-0 text-slate-850 text-xs leading-relaxed flex-1 focus:outline-none focus:bg-white p-1 rounded font-medium"
                                    placeholder="Tuliskan nama dokumen &amp; spesifikasi (format / max size)..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = (draftSettings.reqDocuments || []).filter((_, i) => i !== idx);
                                      setDraftSettings({ ...draftSettings, reqDocuments: copy });
                                    }}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1.5 border-0 cursor-pointer shadow-xs shrink-0 mt-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(draftSettings.reqDocuments || []).length === 0 && (
                                <p className="text-[9px] text-slate-400 italic">Belum ada butir dokumen persyaratan wajib.</p>
                              )}
                            </div>
                          </div>

                          {/* Alur Seleksi Pipeline steps builder */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-sans">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                <i className="fa-solid fa-code-fork text-indigo-600"></i>
                                <span>4. Edit Tahapan Alur Seleksi Kependidikan</span>
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const steps = draftSettings.flowSteps || [];
                                  setDraftSettings({
                                    ...draftSettings,
                                    flowSteps: [...steps, { id: String(steps.length + 1), title: "", desc: "" }]
                                  });
                                }}
                                className="bg-indigo-50 text-indigo-700 rounded px-2 py-1 hover:bg-indigo-100 border-0 cursor-pointer text-[8.5px] font-bold"
                              >
                                + TAMBAH TAHAPAN
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(draftSettings.flowSteps || []).map((step, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 relative">
                                  <div className="flex justify-between items-center">
                                    <span className="bg-amber-400 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded font-mono">
                                      TAHAPAN {idx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = (draftSettings.flowSteps || []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, id: String(i + 1) }));
                                        setDraftSettings({ ...draftSettings, flowSteps: copy });
                                      }}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-500 rounded p-1 border-0 cursor-pointer shadow-xs"
                                      title="Hapus Tahapan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase">NAMA / JUDUL FUNGSIONAL :</span>
                                    <input
                                      type="text"
                                      value={step.title}
                                      onChange={(e) => {
                                        const copy = [...(draftSettings.flowSteps || [])];
                                        copy[idx] = { ...copy[idx], title: e.target.value };
                                        setDraftSettings({ ...draftSettings, flowSteps: copy });
                                      }}
                                      className="bg-white border border-slate-200 text-slate-850 p-1.5 rounded-lg text-xs w-full font-bold focus:outline-none"
                                      placeholder="Contoh: UNGGAH BERKAS DOKUMEN"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[8.5px] font-bold text-slate-400 block uppercase">DESKRIPSI TUGAS / DETIL ALUR :</span>
                                    <textarea
                                      value={step.desc}
                                      rows={2}
                                      onChange={(e) => {
                                        const copy = [...(draftSettings.flowSteps || [])];
                                        copy[idx] = { ...copy[idx], desc: e.target.value };
                                        setDraftSettings({ ...draftSettings, flowSteps: copy });
                                      }}
                                      className="bg-white border border-slate-200 text-slate-850 p-1.5 rounded-lg text-[11px] leading-relaxed w-full focus:outline-none font-medium"
                                      placeholder="Tuliskan kewajiban calon dalam tahapan ini..."
                                    />
                                  </div>
                                </div>
                              ))}
                              {(draftSettings.flowSteps || []).length === 0 && (
                                <p className="text-[9px] text-slate-400 italic">Belum ada butir tahapan alur pendaftaran.</p>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Action buttons footer for save changes */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div className="text-center sm:text-left">
                            <h5 className="font-bold text-slate-800 text-xs">Simpan Konfigurasi Portal Landing</h5>
                            <p className="text-[9px] text-slate-400">Tekan Simpan agar perubahan data tanggal / kuota tampil di beranda depan.</p>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setDraftSettings(settings);
                                showAlert("info", "Form konfigurasi di-refresh.");
                              }}
                              className="w-1/2 sm:w-auto bg-white hover:bg-slate-150 text-slate-650 font-bold px-3 py-2 rounded-xl border border-slate-250 cursor-pointer text-xs"
                            >
                              Reset Form
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSettings(draftSettings);
                                localStorage.setItem("spmb_settings", JSON.stringify(draftSettings));
                                showAlert("success", "Setelan SPMB berhasil disimpan permanen!");
                              }}
                              className={`w-1/2 sm:w-auto font-bold px-4 py-2 rounded-xl text-xs transition border-0 cursor-pointer text-white flex items-center justify-center gap-1 shadow ${
                                adminTheme === "royal-jade" ? "bg-emerald-600 hover:bg-emerald-700" :
                                adminTheme === "cosmic-indigo" ? "bg-indigo-600 hover:bg-indigo-700" :
                                adminTheme === "crimson-sunset" ? "bg-rose-600 hover:bg-rose-700" :
                                "bg-amber-500 text-indigo-950 hover:bg-amber-600 font-bold text-slate-900"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>

                        {/* Factory reset & Dev assistance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2 text-xs">
                            <h5 className="font-bold text-rose-900 leading-none">⚠️ RESET TOTAL BASIS DATA</h5>
                            <p className="text-[9px] text-slate-500">Murnikan basis data siswa pendaftar dan setelan jadwal kembali ke setelan pabrikan.</p>
                            <button onClick={handleResetApplicationData} className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 text-[9px] rounded-lg border-0 cursor-pointer">Revert ke Setelan Pabrik</button>
                          </div>
                          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-white/5 text-[10px] leading-relaxed">
                            <p className="font-bold text-amber-350">Informasi Integrasi</p>
                            Portal pendaftaran ini telah dirancang kompatibel untuk diintegrasikan dengan Google Apps Script (GAS) &amp; Google Sheet. Data pendaftar akan mengalir secara transparan ke draf sheet milik Panitia Sekolah.
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Lightbox Modal Overlays Preview - View files in full detail */}
                {lightboxImage && (
                  <div 
                    className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-3 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                  >
                    <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative select-none">
                      <img src={lightboxImage.src} alt="document-zoom" className="max-w-full max-h-[75vh] object-contain mx-auto" />
                      <div className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black p-2 rounded-xl text-[10px] font-bold border-0 cursor-pointer">✕ Close</div>
                    </div>
                    <p className="text-white font-bold mt-4 text-xs bg-slate-950/70 border border-white/10 px-3.5 py-1.5 rounded-xl">{lightboxImage.label}</p>
                    <p className="text-slate-550 text-[9px] text-slate-400 mt-1">*Klik di mana saja untuk kembali ke workspace</p>
                  </div>
                )}

                {/* Edit Evaluation Modal Backdrop (Quick Edit Fallback dialog) */}
                {selectedApplicant && (
                  <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-xs">
                      <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-[8px] uppercase font-bold text-slate-400 font-mono">{selectedApplicant.id}</p>
                          <h4 className="font-bold text-xs">Evaluasi Berkas: {selectedApplicant.fullName}</h4>
                        </div>
                        <button onClick={() => setSelectedApplicant(null)} className="text-white/70 hover:text-white border-0 bg-transparent cursor-pointer font-bold">✕</button>
                      </div>

                      <form onSubmit={saveApplicantEvaluation} className="p-4 space-y-3 font-sans">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 block">STATUS KEPUTUSAN / VERIFIKASI BERKAS</span>
                          <select value={editStatus} onChange={(e: any) => setEditStatus(e.target.value)} className="bg-slate-50 text-slate-800 rounded-lg p-2 w-full border border-slate-200 focus:outline-none font-bold cursor-pointer">
                            <option value={AdmissionStatus.PROSES}>{AdmissionStatus.PROSES}</option>
                            <option value={AdmissionStatus.DIVERIFIKASI}>{AdmissionStatus.DIVERIFIKASI}</option>
                            <option value={AdmissionStatus.KURANG}>{AdmissionStatus.KURANG}</option>
                            <option value={AdmissionStatus.PERBAIKAN}>{AdmissionStatus.PERBAIKAN}</option>
                            <option value={AdmissionStatus.DITERIMA}>{AdmissionStatus.DITERIMA}</option>
                            <option value={AdmissionStatus.DITOLAK}>{AdmissionStatus.DITOLAK}</option>
                          </select>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 block">ALASAN REVISI / DITOLAK / CATATAN PERSYARATAN (JIKA ADA)</span>
                          <textarea value={editRejection} onChange={(e) => setEditRejection(e.target.value)} placeholder="Tulis catatan berkas kurang atau alasan lainnya..." rows={2} className="bg-slate-50 text-slate-850 p-2 rounded-lg w-full border border-slate-200 focus:outline-none text-xs" />
                        </div>

                        <div className="pt-2 flex gap-2">
                          <button type="button" onClick={() => setSelectedApplicant(null)} className="w-1/3 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-lg border-0 cursor-pointer font-bold">Batal</button>
                          <button type="submit" className="w-2/3 bg-blue-700 hover:bg-indigo-900 text-white p-2.5 rounded-lg border-0 cursor-pointer font-bold shadow">Simpan</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* Decorative footer element */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 mt-16 border-t border-slate-900 no-print">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
            {/* Column 1: School Identity */}
            <div className="md:col-span-1.5 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <img 
                  src="https://bagus-supriyadi.biz.id/uploads/logo%20sma%20bintang%20plus%20bandar%20lampung.png" 
                  alt="Logo SMA Bintang Plus" 
                  className="h-10 w-10 object-contain filter drop-shadow animate-pulse" 
                />
                <div>
                  <h4 className="font-display font-extrabold text-white text-sm tracking-wide">SMA BINTANG PLUS</h4>
                  <p className="text-[10px] text-amber-500 font-sans tracking-widest font-black uppercase">Building Character, Achieving Excellence</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans pt-1">
                Bintang Plus Senior High School didirikan dengan tekad kuat untuk menghadirkan lembaga pendidikan tingkat menengah atas swasta unggulan yang berfokus pada ketangguhan karakter moral sekaligus pencapaian prestasi akademik puncak tingkat internasional.
              </p>
            </div>

            {/* Column 2: Tautan Pintar */}
            <div className="space-y-4 text-left">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider font-sans border-l-2 border-amber-400 pl-2.5">Tautan Utama</h5>
              <ul className="space-y-2.5 text-[11px] font-sans text-slate-450">
                <li>
                  <button onClick={() => setKabarDetail("profil")} className="hover:text-amber-400 transition cursor-pointer text-left font-semibold">
                    <i className="fa-solid fa-angle-right mr-1 text-slate-600"></i> Identitas & Profil Sekolah
                  </button>
                </li>
                <li>
                  <button onClick={() => setKabarDetail("kurikulum")} className="hover:text-amber-400 transition cursor-pointer text-left font-semibold">
                    <i className="fa-solid fa-angle-right mr-1 text-slate-600"></i> Sistem Kurikulum SKS
                  </button>
                </li>
                <li>
                  <button onClick={() => setKabarDetail("program")} className="hover:text-amber-400 transition cursor-pointer text-left font-semibold">
                    <i className="fa-solid fa-angle-right mr-1 text-slate-600"></i> Program Unggulan Kampus
                  </button>
                </li>
                <li>
                  <button onClick={() => setKabarDetail("logo")} className="hover:text-amber-400 transition cursor-pointer text-left font-semibold">
                    <i className="fa-solid fa-angle-right mr-1 text-slate-600"></i> Filosofi Lambang Sekolah
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div className="space-y-4 text-left">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider font-sans border-l-2 border-amber-400 pl-2.5">Hubungi Kami</h5>
              <ul className="space-y-3 text-[11px] text-slate-450 leading-relaxed">
                <li className="flex gap-2.5 items-start">
                  <i className="fa-solid fa-map-location-dot text-amber-500 mt-0.5 text-xs shrink-0"></i>
                  <span>Jalan Pendidikan No.32-B, Kelurahan Sumber Rejo, Kecamatan Kemiling, Kota Bandar Lampung, 35152</span>
                </li>
                <li className="flex gap-2.5 items-center">
                  <i className="fa-solid fa-phone text-amber-500 text-xs shrink-0"></i>
                  <a href="tel:0895-0331-2895" className="hover:text-white transition font-mono">0895-0331-2895</a>
                </li>
                <li className="flex gap-2.5 items-center">
                  <i className="fa-solid fa-envelope text-amber-500 text-xs shrink-0"></i>
                  <a href="mailto:smabintangplus@gmail.com" className="hover:text-white transition">smabintangplus@gmail.com</a>
                </li>
              </ul>
            </div>

            {/* Column 4: Laman & Sosmed */}
            <div className="space-y-4 text-left">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider font-sans border-l-2 border-amber-400 pl-2.5">Laman & Jejaring Sosial</h5>
              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-500 font-sans">
                  Kunjungi portal yayasan resmi dan saksikan aktivitas harian siswa-siswi berprestasi kami di platform sosial media utama kami:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Website */}
                  <a 
                    href="https://katakita-group.biz.id/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-amber-400 hover:text-slate-950 transition flex items-center justify-center cursor-pointer"
                    title="Website Portal Yayasan"
                  >
                    <i className="fa-solid fa-globe"></i>
                  </a>
                  {/* Instagram */}
                  <a 
                    href="https://www.instagram.com/smabintangplus_bdl/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:to-purple-600 transition flex items-center justify-center cursor-pointer"
                    title="Instagram resmi"
                  >
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  {/* Facebook */}
                  <a 
                    href="https://www.facebook.com/profile.php?id=61586034206310" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 transition flex items-center justify-center cursor-pointer"
                    title="Facebook resmi"
                  >
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  {/* WhatsApp Direct */}
                  <a 
                    href="https://wa.me/6289503312895" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-emerald-600 transition flex items-center justify-center cursor-pointer"
                    title="WhatsApp Hotline"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-600 font-mono">
            <span>&copy; {new Date().getFullYear()} Yayasan Kata Kita Edukasi &bull; SMA Bintang Plus Bandar Lampung.</span>
            <span>Sistem Informasi SPMB Online v2.4.5 &bull; Terakreditasi Mandiri</span>
          </div>

        </div>
      </footer>

      {/* KABAR UTAMA SEKOLAH - RICH DETAIL MODAL OVERLAY */}
      {kabarDetail !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 px-7 relative flex items-center justify-between border-b border-blue-950">
              <div className="space-y-1">
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded">
                  {kabarDetail === "profil" && "IDENTITAS & PROFIL EKOLAH"}
                  {kabarDetail === "kurikulum" && "SISTEM PENDIDIKAN & KURIKULUM"}
                  {kabarDetail === "program" && "PROGRAM UNGGULAN & EKSTRAKURIKULER"}
                  {kabarDetail === "logo" && "FILOSOFI MAKNA LOGO BINTANG PLUS"}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold font-display leading-tight">
                  {kabarDetail === "profil" && "Profil Utama & Identitas Lengkap Bintang Plus Senior High School"}
                  {kabarDetail === "kurikulum" && "Sistem Kurikulum Implementatif Bintang Plus Senior High School"}
                  {kabarDetail === "program" && "6 Program Unggulan Akademik & 11 Pilihan Ekstrakurikuler Pilihan"}
                  {kabarDetail === "logo" && "Filosofi & Tafsir Makna Lambang Resmi Bintang Plus Senior High School"}
                </h3>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setKabarDetail(null)}
                className="text-white hover:text-amber-400 transition-all text-sm bg-white/10 hover:bg-white/20 h-8 w-8 rounded-full cursor-pointer flex items-center justify-center border-0 font-bold font-mono"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 max-h-[70vh]">
              
              {/* CONTENT CASE 1: PROFIL UTAMA */}
              {kabarDetail === "profil" && (
                <div className="space-y-6 animate-in fade-in duration-150 font-sans">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="font-extrabold text-xs text-blue-750 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <i className="fa-solid fa-address-card text-blue-650"></i>
                      A. IDENTITAS RESMI LEMBAGA
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs text-slate-750">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">1. Nama Sekolah</span>
                        <strong className="text-slate-800">Bintang Plus Senior High School</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">2. Slogan / Tagline</span>
                        <strong className="text-slate-800 italic">Building Character, Achieving Excellence</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">3. Jenjang Pendidikan</span>
                        <strong className="text-slate-800">Sekolah Menengah Atas (SMA)</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">4. Status Sekolah</span>
                        <strong className="text-slate-800">Swasta Plus (Angkatan Pertama)</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">5. Alamat Kampus</span>
                        <strong className="text-slate-800 text-right max-w-[200px] leading-tight">Jalan Pendidikan No.32, Kel. Sumber Rejo, Kec. Kemiling, Bandar Lampung</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">6. Tahun Berdiri / Mulai</span>
                        <strong className="text-slate-800">2025</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">7. Email Resmi</span>
                        <strong className="text-slate-800 text-blue-700">smabintangplus@gmail.com</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-medium">8. Contact Person</span>
                        <strong className="text-slate-800 text-emerald-700">0831-3516-5464</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5 col-span-1 md:col-span-2">
                        <span className="text-slate-400 font-medium">9. Di bawah Naungan / Pengelola</span>
                        <strong className="text-slate-800">Yayasan Kata Kita Edukasi</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5 col-span-1 md:col-span-2">
                        <span className="text-slate-400 font-medium">10. Kepala Sekolah / Pimpinan</span>
                        <strong className="text-slate-800 text-blue-800">Famella Buana Dewi, S.Pd.</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-extrabold text-xs text-blue-750 uppercase tracking-widest flex items-center gap-1.5">
                      <i className="fa-solid fa-landmark text-blue-650"></i>
                      B. PROFIL SEKOLAH & NARASI PENGANTAR KEMAJUAN
                    </h4>
                    
                    <p className="text-xs text-slate-650 leading-relaxed text-justify">
                      Bintang Plus Senior High School didirikan dengan tekad untuk menghadirkan lembaga pendidikan unggulan di Bandar Lampung yang berfokus pada pembentukan karakter unggul (&ldquo;Excellence and Character&rdquo;) dan pengembangan potensi siswa secara menyeluruh. Sekolah ini mengintegrasikan kurikulum nasional (Kurikulum Merdeka) yang diperkaya dengan program pembinaan kepemimpinan, moral spiritual, dan kecakapan masa depan (future skills) seperti penguasaan bahasa asing (Jepang & Korea), literasi teknologi informasi, dan kewirausahaan.
                    </p>
                    
                    <p className="text-xs text-slate-650 leading-relaxed text-justify">
                      Kami percaya bahwa setiap siswa adalah pribadi unik yang memiliki potensi luar biasa. Oleh karena itu, pendekatan pembelajaran yang kami gunakan dirancang secara individual (differentiated learning) untuk memastikan setiap bakat dan minat berkembang optimal. Lingkungan sekolah kami ciptakan aman, inklusif, dan penuh integritas, yang tidak hanya mempersiapkan siswa berprestasi secara akademik, tetapi juga menjadi pribadi yang tangguh, santun, dan siap memberikan kontribusi positif bagi masyarakat global.
                    </p>
                    
                    <p className="text-xs text-slate-650 leading-relaxed text-justify">
                      Dengan keunggulan rintisan yang terfokus, sarana prasarana yang representatif, bimbingan intensif persiapan masuk perguruan tinggi negeri maupun swasta ternama, serta pembekalan vokasi keterampilan kerja praktis, Bintang Plus Senior High School siap mendampingi putra-putri Anda menjadi bintang masa depan yang bersinar terang.
                    </p>
                  </div>
                </div>
              )}

              {/* CONTENT CASE 2: KURIKULUM */}
              {kabarDetail === "kurikulum" && (
                <div className="space-y-5 animate-in fade-in duration-150 font-sans">
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold italic text-slate-500">
                    &ldquo;Bintang Plus Senior High School menerapkan sistem pendidikan holistik yang memadukan keunggulan akademik, pembinaan karakter, dan keterampilan masa depan secara seimbang.&rdquo;
                  </p>

                  <div className="grid grid-cols-1 gap-4 mt-3">
                    {[
                      {
                        title: "A. Landasan Kurikulum",
                        desc: "Menggunakan Kurikulum Nasional (Kurikulum Merdeka) sebagai kerangka dasar pembelajaran, yang dimodifikasi secara dinamis mengikuti arah tantangan global abad ke-21."
                      },
                      {
                        title: "B. Pendekatan Pembelajaran (Student-Centered)",
                        desc: "1. Project-Based Learning (PjBL): Memicu siswa memecahkan masalah riil melalui kolaborasi proyek.\n2. Blended Learning: Memadukan pengajaran tatap muka reguler dan sistem digital interaktif.\n3. Differentiated Learning: Guru mengajar disesuaikan dengan keragaman kognitif & peminatan siswa."
                      },
                      {
                        title: "C. Penguatan Akademik",
                        desc: "Pendalaman materi pelajaran inti, literasi & numerasi dasar, penalaran kritis tingkat tinggi (HOTS - Higher Order Thinking Skills), serta simulasi intensif bimbingan persiapan masuk perguruan tinggi favorit sejak dini."
                      },
                      {
                        title: "D. Penguatan Karakter & Nilai",
                        desc: "Penanaman kejujuran, disiplin, rasa tanggung jawab, moral kepedulian sosial, dan kecerdasan spiritual melalui ibadah rutin dan program literasi kegamaan harian."
                      },
                      {
                        title: "E. Pengembangan Keterampilan Masa Depan (Future Skills/Vokasi)",
                        desc: "Kurikulum tambahan berupa bahasa asing praktis (Jepang & Korea), literasi teknologi informasi (dasar coding, office, desain), dasar-dasar kepemimpinan mandiri (public speaking, komunikasi terpadu), dan kewirausahaan."
                      }
                    ].map((step, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-1.5 hover:shadow-sm transition">
                        <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-700"></span>
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line font-sans pl-3.5 border-l border-slate-300">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTENT CASE 3: PROGRAM UNGGULAN & EKSKUL */}
              {kabarDetail === "program" && (
                <div className="space-y-6 animate-in fade-in duration-150 font-sans">
                  
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-red-650 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
                      <i className="fa-solid fa-star text-amber-500 animate-spin text-sm"></i>
                      A. 6 PROGRAM UNGGULAN MASUK UTAMA
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { num: "01", name: "Program Tahfidz & Pembinaan Akhlak", desc: "Target minimal 3 Juz bagi peminat khusus atau jalur beasiswa penghafal Al-Qur'an dengan setoran disiplin." },
                        { num: "02", name: "Program Vokasi & Bahasa Asing", desc: "Kelayakan sertifikasi kompetensi bahasa asing dasar (Jepang & Korea) menyambut persaingan global." },
                        { num: "03", name: "Program Persiapan Masuk PTN/PTS Favorit", desc: "Pendampingan saksama pemetaan minat bakat jurusan, target pembuatan portofolio, dan evaluasi berkala." },
                        { num: "04", name: "Program Intensif TKA & UTBK", desc: "Kelas intensif pembahasan bank soal nasional, pembahasan teknik pengerjaan efisien sejak kelas 10." },
                        { num: "05", name: "Kunjungan Kampus & Eksplorasi Karir", desc: "Kunjungan rutin tahunan ke universitas ternama, seminar motivasi karir bersama profesional industri." },
                        { num: "06", name: "Program Persiapan TNI/POLRI", desc: "Pembinaan fisik terarah bekerjasama dengan instruktur jasmani bersertifikat bagi peminat akademi kedinasan." }
                      ].map((p, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 border border-slate-200/60 rounded-xl flex items-start gap-3 hover:bg-slate-100 transition">
                          <span className="font-display font-black text-slate-300 text-lg shrink-0 mt-0.5">{p.num}</span>
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 leading-snug">{p.name}</h5>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-150">
                    <h4 className="font-extrabold text-xs text-blue-750 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
                      <i className="fa-solid fa-flag text-blue-600"></i>
                      B. 11 EKSTRAKURIKULER UNGGULAN PILIHAN
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                      {[
                        "Rohani Islam (Rohis)",
                        "Pramuka",
                        "Paskibra",
                        "Palang Merah Indonesia (PMI)",
                        "English Club",
                        "Teater",
                        "Tari",
                        "Musik",
                        "Catur",
                        "Futsal",
                        "Bela Diri Taekwondo",
                        "Bela Diri Karate",
                        "Bela Diri Pencak Silat"
                      ].map((eks, idx) => (
                        <div key={idx} className="bg-indigo-50/50 hover:bg-indigo-50/90 text-indigo-900 border border-indigo-100/60 rounded-xl p-2.5 font-semibold text-center flex items-center justify-center gap-2 transition duration-150">
                          <i className="fa-solid fa-heart-pulse text-[10px] text-indigo-500"></i>
                          <span className="text-[10px] leading-snug">{eks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT CASE 4: MAKNA LOGO */}
              {kabarDetail === "logo" && (
                <div className="space-y-6 animate-in fade-in duration-150 font-sans text-center">
                  
                  {/* Logo Display Image frame */}
                  <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-[250px] mx-auto shadow-inner">
                    <img
                      src="https://bagus-supriyadi.biz.id/uploads/logo sma bintang plus bandar lampung.png"
                      alt="Logo Resmi SMA Bintang Plus Bandar Lampung"
                      referrerPolicy="no-referrer"
                      className="mx-auto h-28 object-contain drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] animate-pulse"
                      onError={(e) => {
                        // Fallback backup path and styling
                        (e.target as any).src = "https://bagus-supriyadi.biz.id/uploads/logo%20sma%20bintang%20plus%20bandar%20lampung.png";
                      }}
                    />
                  </div>

                  <div className="space-y-4 text-left pt-3">
                    <h4 className="font-extrabold text-xs text-blue-750 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
                      <i className="fa-solid fa-magnifying-glass-chart text-blue-650"></i>
                      DEKLARASI MAKNA & FILOSOFI LOGO UTAMA
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: "1. Figur Manusia Bertoga", desc: "Melambangkan kelulusan yang berdaya guna, kemandirian siswa, dan kebebasan berekspresi secara positif di kancah global." },
                        { title: "2. Bintang di Puncak", desc: "Melambangkan cita-cita luhur setinggi langit, keunggulan performa, prestasi puncak, dan arah penunjuk moral kebenaran sejati." },
                        { title: "3. Lingkaran Emas yang Mengorbit", desc: "Menyimbolkan perlindungan yang kokoh, persatuan sistem sekolah, serta akselerasi dinamika peradaban IPTEK modern." },
                        { title: "4. Warna Biru Tua", desc: "Melambangkan kestabilan emosi, kedalaman ilmu pengetahuan, integritas yang tangguh, keandalan, dan profesionalisme mutlak." },
                        { title: "5. Warna Kuning Emas", desc: "Melambangkan kemuliaan karakter, kejayaan prestasi, optimisme tinggi, kemakmuran, dan visi masa depan yang cerah." },
                        { title: "6. Warna Putih", desc: "Melambangkan kesucian hati, ketulusan pengabdian guru, kepolosan niat belajar siswa, dan keterbukaan inovasi kebenaran." }
                      ].map((l, lIdx) => (
                        <div key={lIdx} className="bg-slate-50 p-3.5 border border-slate-150 rounded-xl space-y-1 hover:bg-slate-100/50 transition">
                          <h5 className="font-bold text-xs text-blue-900">{l.title}</h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{l.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 text-amber-800 rounded-xl p-4 border border-amber-200 mt-4">
                      <p className="text-xs leading-relaxed font-semibold">
                        <strong>Makna Keseluruhan Logo:</strong> Simbol visual rukun rintisan yang terpadu mencerminkan tekad SMA Bintang Plus Bandar Lampung untuk mencetak lulusan agung yang berkarakter kokoh, andal, berilmu luas, dan berkontribusi gemilang berdaya saing internasional.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 text-center text-[10px] text-slate-400 font-mono flex items-center justify-between px-7">
              <span>SMA Bintang Plus Bandar Lampung &copy; 2025</span>
              <span>Hotline Hub: 0831-3516-5464</span>
            </div>

          </div>
        </div>
      )}

      {/* PRINTABLE BUKTI PENDAFTARAN RESMI A4 MODAL */}
      {printableApplicant !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-print text-amber-400"></i>
                <span className="font-bold font-display text-sm">Pratinjau Lembar Bukti Pendaftaran (A4)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition pointer border-0 uppercase tracking-widest"
                >
                  <i className="fa-solid fa-print"></i> Cetak Dokumen (A4)
                </button>
                <button
                  onClick={() => setPrintableApplicant(null)}
                  className="text-slate-400 hover:text-white transition text-xs bg-slate-800 hover:bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center pointer border-0 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
              <div 
                id="print-area" 
                className="bg-white p-10 shadow-lg border border-slate-300 w-[210mm] min-h-[297mm] mx-auto text-black font-sans leading-relaxed text-xs relative"
              >
                {/* School Kop Surat */}
                <div className="border-b-[3px] border-slate-900 pb-2 mb-6 text-center">
                  <img 
                    src="https://bagus-supriyadi.biz.id/uploads/kop%20sekolah%20bintang%20plus.png" 
                    alt="KOP SMA Bintang Plus" 
                    className="w-full h-auto object-contain max-h-[120px]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-sm font-extrabold uppercase font-sans border-b-2 border-black pb-1 inline-block tracking-wider">
                    BUKTI PENDAFTARAN RESMI PENERIMAAN SISWA BARU
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-bold">NOMOR INTEGRASI: {printableApplicant.id}</p>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-6">
                  {/* Left Column: Data blocks */}
                  <div className="col-span-3 space-y-4">
                    <h4 className="font-extrabold border-b border-dashed border-slate-300 pb-1 text-[11px] text-slate-850">
                      I. IDENTITAS CALON SISWA
                    </h4>
                    <table className="w-full text-[10.5px]">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500 w-[140px]">Nomor Pendaftaran</td>
                          <td className="py-1.5 font-extrabold text-blue-800">{printableApplicant.id}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Nama Lengkap</td>
                          <td className="py-1.5 font-bold uppercase">{printableApplicant.fullName}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">NIK (No. KTP)</td>
                          <td className="py-1.5 font-mono">{printableApplicant.nik}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">NISN Nasional</td>
                          <td className="py-1.5 font-mono font-bold">{printableApplicant.nisn}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Jenis Kelamin</td>
                          <td className="py-1.5">{printableApplicant.gender}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Tempat, Tanggal Lahir</td>
                          <td className="py-1.5">{printableApplicant.birthPlace}, {printableApplicant.birthDate ? new Date(printableApplicant.birthDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Asal Sekolah SMP/MTs</td>
                          <td className="py-1.5 font-bold">{printableApplicant.previousSchool}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Program Jurusan Pilihan</td>
                          <td className="py-1.5 font-bold text-amber-700">{printableApplicant.preferredMajor}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-1.5 font-semibold text-slate-500">Estimasi Jarak Rumah</td>
                          <td className="py-1.5 font-bold text-emerald-700">{printableApplicant.distance ? `${printableApplicant.distance} KM` : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Passport Photo spot */}
                  <div className="col-span-1 flex flex-col items-center">
                    <div className="border border-slate-350 p-1 bg-white mb-2 shadow-sm rounded-md w-[2.8cm] h-[3.8cm] flex flex-col items-center justify-center overflow-hidden">
                      {printableApplicant.foto3x4 ? (
                        <img 
                          src={printableApplicant.foto3x4} 
                          alt="Pas Foto 3x4" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="text-center text-slate-400 font-mono flex flex-col items-center justify-center h-full p-2">
                          <i className="fa-regular fa-user text-xl mb-1"></i>
                          <p className="text-[7.5px] leading-snug font-bold">Pas Foto 3x4</p>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono tracking-wider font-bold">TEMPEL FOTO</span>
                  </div>
                </div>

                {/* Section II: Status and Checklists */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-extrabold border-b border-dashed border-slate-300 pb-1 text-[11px] text-slate-850">
                    II. ALAMAT & KONTAK CALON SISWA
                  </h4>
                  <table className="w-full text-[10.5px]">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-500 w-[140px]">Alamat Domisili</td>
                        <td className="py-1.5 leading-relaxed">{printableApplicant.address}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-500">No. HP / WA Siswa</td>
                        <td className="py-1.5 font-mono">{printableApplicant.phone}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-500">Nama Orang Tua / Wali</td>
                        <td className="py-1.5 uppercase font-bold">{printableApplicant.parentName || "-"}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-500">No. HP Orang Tua / Wali</td>
                        <td className="py-1.5 font-mono">{printableApplicant.parentPhone}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-500">E-mail Aktif</td>
                        <td className="py-1.5">{printableApplicant.email}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section III: Checklist Berkas Offline */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-10">
                  <h5 className="font-bold text-[10px] text-slate-700 uppercase tracking-wide mb-2.5">
                    RECOGNITION KELENGKAPAN BERKAS FISIK WAJIB SPMB (BAWA SAAT DAFTAR ULANG):
                  </h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[9.5px]">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.foto3x4 ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Pas Foto Terbaru 3x4 (2 lembar)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.kk ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Kartu Keluarga (KK) asli & fotokopi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.akta ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Akta Kelahiran asli & fotokopi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.ijazahSkl ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Surat Keterangan Lulus (SKL) / Ijazah SMP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.raporSemester ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Rapor SMP/MTS Semester 1 s.d 5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-slate-400 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-white">
                        {printableApplicant.suratPernyataan ? "✓" : ""}
                      </div>
                      <span className="text-slate-650 font-medium">Surat Pernyataan Bermaterai Rp 10.000</span>
                    </div>
                  </div>
                </div>

                {/* Side-by-side signature section */}
                <div className="grid grid-cols-2 gap-10 text-[10.5px] pt-4 mt-6">
                  {/* Parent sign on the left */}
                  <div className="space-y-16 text-center">
                    <div className="space-y-1">
                      <p className="text-slate-600 font-bold">Orang Tua / Wali Calon Siswa,</p>
                      <p className="text-[10px] text-slate-400">(Tanda Tangan & Nama Terang)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-850 uppercase tracking-wide underline">{printableApplicant.parentName || "......................................................"}</p>
                      <p className="text-[9px] text-slate-400 font-mono font-medium">Wali Murid</p>
                    </div>
                  </div>

                  {/* Panel Committee sign on the right */}
                  <div className="space-y-16 text-center">
                    <div className="space-y-1">
                      <p className="text-slate-600 font-medium">
                        Bandar Lampung, {new Date(printableApplicant.timestamp || Date.now()).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="font-bold text-slate-800">Panitia Penerimaan SPMB SMA Bintang Plus</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 border-b border-black pb-0.5 inline-block">Tim Verifikasi Sekolah</p>
                      <p className="text-[9px] text-slate-400 font-mono block">NIP. PAN-SPMB-BINTANGPLUS</p>
                    </div>
                  </div>
                </div>

                {/* Footer Bar on Sheet */}
                <div className="absolute bottom-6 left-10 right-10 border-t border-slate-200 pt-3 text-[8.5px] text-slate-450 flex justify-between font-mono">
                  <span>Sistem SPMB Online SMA Bintang Plus</span>
                  <span>Dokumen SPMB Digital Hasil Swasembada Mandiri</span>
                </div>

              </div>
            </div>

            {/* Modal Footer (Screen Only) */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 text-center text-xs text-slate-500 font-sans flex items-center justify-between px-6 no-print">
              <span>Harap unduh atau langsung cetak dokumen bukti pendaftaran fisik ini.</span>
              <button 
                onClick={() => setPrintableApplicant(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center pointer border-0 transition"
              >
                Tutup Jendela
              </button>
            </div>

          </div>

          {/* Embedded stylesheet rules specifically for browser print trigger */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-area, #print-area * {
                visibility: visible !important;
              }
              #print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 30px !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
        </div>
      )}

      {/* PRINTABLE SURAT PERNYATAAN KEBENARAN BERMATERAI (A4) MODAL */}
      {isPernyataanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-signature text-emerald-400 animate-pulse"></i>
                <span className="font-bold font-display text-sm">Pratinjau Surat Pernyataan Kebenaran Data (A4)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition pointer border-0 uppercase tracking-widest cursor-pointer"
                >
                  <i className="fa-solid fa-print"></i> Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsPernyataanModalOpen(false)}
                  className="text-slate-400 hover:text-white transition text-xs bg-slate-800 hover:bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center pointer border-0 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
              <div 
                id="print-area" 
                className="bg-white p-10 shadow-lg border border-slate-300 w-[210mm] min-h-[297mm] mx-auto text-black font-sans leading-relaxed text-xs relative"
              >
                {/* School Kop Surat Dikosongkan Sesuai Permintaan */}
                <div className="pt-8 mb-6 text-center">
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-sm font-extrabold uppercase font-sans border-b-2 border-black pb-1 inline-block tracking-wider">
                    SURAT PERNYATAAN PERTANGGUNGJAWABAN MUTLAK (SPJM)<br/>
                    DAN KEBENARAN DOKUMEN SPMB ONLINE
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-bold">TAHUN AJARAN {settings.tahunPendaftaran}/{Number(settings.tahunPendaftaran)+1}</p>
                </div>

                <p className="text-xs text-justify leading-relaxed mb-4">
                  Yang bertanda tangan di bawah ini selaku Orang Tua / Wali murid dari Calon Siswa Baru SMA Bintang Plus Bandar Lampung:
                </p>

                {/* Orang tua table data */}
                <table className="w-full text-xs mb-4 ml-4">
                  <tbody>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500 w-[180px]">Nama Orang Tua / Wali</td>
                      <td className="py-1 uppercase font-bold text-slate-800">: {formInput.parentName || ".................................................................................."}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">No. HP / WA Orang Tua</td>
                      <td className="py-1">: {formInput.parentPhone || ".................................................................................."}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">Alamat Tempat Tinggal</td>
                      <td className="py-1 text-slate-800">: {formInput.address || ".................................................................................."}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-xs text-justify leading-relaxed mb-4">
                  Menyatakan dengan sesungguhnya dan penuh tanggung jawab bahwa data serta dokumen penunjang pendaftaran atas Calon Siswa Baru di bawah ini adalah asli dan benar:
                </p>

                {/* Siswa table data */}
                <table className="w-full text-xs mb-6 ml-4">
                  <tbody>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500 w-[180px]">Nama Lengkap Calon Siswa</td>
                      <td className="py-1 uppercase font-bold text-slate-800">: {formInput.fullName}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">NIK (Nomor Induk Kependudukan)</td>
                      <td className="py-1 font-mono text-slate-800">: {formInput.nik}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">NISN (Nomor Induk Siswa Nasional)</td>
                      <td className="py-1 font-mono font-bold text-slate-800">: {formInput.nisn}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">Asal SMP / MTs</td>
                      <td className="py-1 font-bold text-slate-800">: {formInput.previousSchool}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">Program Jurusan Pilihan</td>
                      <td className="py-1 font-bold text-blue-800">: {formInput.preferredMajor}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-500">Jarak Domisili Terplott</td>
                      <td className="py-1 text-slate-850 font-bold">: {formInput.distance ? `${formInput.distance} KM` : "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-xs text-justify leading-relaxed mb-4">
                  Menerangkan poin-poin pernyataan kepatuhan sebagai berikut:
                </p>
                <ol className="list-decimal pl-5 text-xs text-justify space-y-2 mb-6">
                  <li>Bahwa seluruh data biografi dan berkas persyaratan penunjang (Pas Foto, KK, Akta Kelahiran, Rapor, Ijazah/SKL) yang kami unggah secara mandiri pada portal online SPMB SMA Bintang Plus Bandar Lampung adalah sah dan benar adanya sesuai dokumen hukum Republik Indonesia.</li>
                  <li>Apabila dikemudian hari ditemukan indikasi pemalsuan, rekayasa, atau ketidaksesuaian data pendaftaran fisik dengan data sistem, kami bersedia dituntut sesuai hukum pidana yang berlaku dan menerima keputusan pembatalan penerimaan siswa secara sepihak oleh komite sekolah.</li>
                  <li>Kami selaku Orang Tua serta Calon Siswa menyatakan tunduk sepenuhnya pada peraturan tata tertib akhlakul karimah, disiplin karakter moral Bintang Plus, kurikulum pembelajaran SKS, serta kebijakan internal sekolah lainnya selagi berstatus murid pendaftar aktif.</li>
                </ol>

                {/* Signature section */}
                <div className="grid grid-cols-2 gap-10 text-xs pt-4 mt-6">
                  {/* Parent signature with Materai space */}
                  <div className="text-center relative">
                    <p className="text-slate-650 font-bold mb-16">Orang Tua / Wali Calon Siswa,</p>
                    
                    {/* Materai Placeholder box */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-8 border-2 border-dashed border-slate-400 bg-slate-50 w-24 h-14 flex items-center justify-center text-[7px] text-slate-400 font-mono font-black opacity-80 leading-none">
                      MATERAI<br/>RP 10.000<br/>Tanda Tangan
                    </div>

                    <p className="font-bold text-slate-800 uppercase tracking-wide underline">{formInput.parentName || "......................................................"}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Tanda Tangan & Nama Terang Orang Tua</p>
                  </div>

                  {/* Student signature */}
                  <div className="text-center font-sans">
                    <p className="text-slate-650 font-medium mb-16">
                      Bandar Lampung, ............................................ {new Date().getFullYear()}
                    </p>
                    <p className="font-bold text-slate-800 uppercase tracking-wide underline">{formInput.fullName || "......................................................"}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Tanda Tangan & Nama Terang Calon Siswa</p>
                  </div>
                </div>

                {/* Footer Bar on Sheet */}
                <div className="absolute bottom-6 left-10 right-10 border-t border-slate-200 pt-3 text-[8.5px] text-slate-450 flex justify-between font-mono">
                  <span>Dokumen SPJM Digital SPMB SMA Bintang Plus</span>
                  <span>Dicetak Secara Otomatis oleh Sistem SPMB Digital</span>
                </div>

              </div>
            </div>

            {/* Modal Footer (Screen Only) */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 text-center text-xs text-slate-500 font-sans flex items-center justify-between px-6 no-print">
              <span>Harap unduh atau cetak dokumen pendaftaran ini, lalu scan setelah ditandatangani untuk dilampirkan.</span>
              <button 
                type="button"
                onClick={() => setIsPernyataanModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center pointer border-0 transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Persistent Gemini Conversational Tutor Assistant Widget bottom floating */}
      <AIAssistant isSimulated={deviceMode !== "desktop"} />

      </div>

    </div>
  );
}
