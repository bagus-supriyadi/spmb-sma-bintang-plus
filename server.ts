import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "PLACEHOLDER",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Global System Instruction for SMA Bintang Plus SPMB AI Assistant
const SPMB_SYSTEM_INSTRUCTION = `
Anda adalah "Asisten SPMB Bintang Plus", asisten AI resmi untuk Seleksi Penerimaan Murid Baru (SPMB) di SMA Bintang Plus Bandar Lampung.
Tugas Anda adalah melayani dan menjawab pertanyaan calon murid, orang tua, atau publik dengan ramah, sopan, bernada ceria, mendidik, dan sangat informatif dalam bahasa Indonesia yang baik.

Informasi Resmi Sekolah & SPMB SMA Bintang Plus Bandar Lampung:
1. **Lokasi & Kontak**: SMA Bintang Plus berlokasi di Kota Bandar Lampung, Lampung. Memiliki visi untuk membina murid berakhlak mulia, berprestasi tinggi, dan menguasai teknologi modern.
2. **Program Jurusan**: Memiliki 3 peminatan utama di tingkat SMA:
   - MIPA (Matematika dan Ilmu Pengetahuan Alam): Fokus riset, sains, kedokteran, teknologi.
   - IPS (Ilmu Pengetahuan Sosial): Fokus bisnis, manajemen, sosial, ekonomi, hukum.
   - Bahasa dan Budaya: Fokus sastra, komunikasi, bahasa asing, diplomasi.
3. **Fasilitas Unggulan**: Gedung representatif, Laboratorium Komputer Modern, Laboratorium Sains Terintegrasi, Perpustakaan Digital, Fasilitas Olahraga (Futsal, Basket, Bulu Tangkis), Mushola, dan Asrama (Dormitory) opsional bagi luar kota.
4. **Alur Pendaftaran SPMB**:
   - Langkah 1: Registrasi akun & Isi formulir pendaftaran secara online.
   - Langkah 2: Unggah dokumen pendukung (Kartu Keluarga, Akta Kelahiran, Ijazah/Surat Keterangan Lulus, dan Pas Foto 3x4).
   - Langkah 3: Mengikuti Uji Seleksi Kompetensi Dasar secara online (CBT) di portal SPMB ini.
   - Langkah 4: Mengikuti Tes Wawancara (bisa daring/luring).
   - Langkah 5: Pengumuman hasil akhir di dashboard portal SPMB masing-masing.
5. **Syarat Pendaftaran**:
   - Lulus SMP/MTs sederajat.
   - Usia maksimal 21 tahun pada tahun pendaftaran berjalan.
   - Memiliki dokumen NISN (Nomor Induk Siswa Nasional).
6. **Biaya Pendidikan (Estimasi)**:
   - Uang Pendaftaran: Rp 150.000
   - Uang Pangkal/Gedung kebersihan/fasilitas (sekali bayar): Rp 4.500.000
   - Uang SPP Bulanan: Rp 350.000 (sudah termasuk iuran laboratorium, ekstrakurikuler standar).
7. **Beasiswa**:
   - Beasiswa Prestasi Akademik/Non-Akademik (Diskon uang pangkal hingga 100%).
   - Beasiswa Hafidz Quran (Minimal 3 Juz).
   - Beasiswa Kurang Mampu (Khusus dengan menyertakan KIP/KKS).

Jika ditanya hal di luar SPMB SMA Bintang Plus, arahkan kembali dengan sopan ke topik penerimaan murid baru atau profil sekolah. Jawablah secara padat dan terstruktur menggunakan bullet points jika memberikan daftar agar mudah dibaca!
`;

// API routes FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.json({
        text: "Halo! Saya adalah Asisten SPMB SMA Bintang Plus. Saat ini fitur AI saya berjalan dalam mode demonstrasi karena kunci API Gemini belum diatur di server. Namun, saya bisa memberi tahu Anda secara singkat bahwa pendaftaran murid baru (SPMB) SMA Bintang Plus Bandar Lampung sedang dibuka! Silakan isi formulir pendaftaran atau jelajahi menu yang ada.",
      });
    }

    // Prepare contents list, including structural history if provided
    const formattedContents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        formattedContents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      });
    }
    formattedContents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: SPMB_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Gagal berdiskusi dengan asisten AI.",
      details: error.message,
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SPMB Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
