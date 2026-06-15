import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, X, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

export default function AIAssistant({ isSimulated = false }: { isSimulated?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Halo! Saya adalah **Asisten SPMB Bintang Plus**. 🌟 Ada yang bisa saya bantu mengenai informasi pendaftaran, berkas syarat masuk, program jurusan (MIPA, IPS), biaya, atau beasiswa di SMA Bintang Plus Bandar Lampung?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      // Map simple message list for session histories
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages((prev) => [...prev, { role: "model", text: data.text }]);
      } else {
        throw new Error(data.error || "Gagal mendapatkan respon");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ Maaf, terjadi kendala koneksi ke server asisten: ${err.message}. Silakan coba kirim ulang pesan beberapa saat lagi.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt suggestions
  const QUICK_PROMPTS = [
    "Apa saja jurusan yang tersedia?",
    "Berapa biaya masuk dan SPP?",
    "Apa saja syarat berkas pendaftaran?",
    "Apakah ada beasiswa?",
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  // Convert simple markdown-like double stars list elements to html
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold formatter
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Bullet points checklist
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
      if (isBullet) {
        formattedLine = "• " + formattedLine.replace(/^[-*]\s*/, "");
        return (
          <div key={i} className="pl-4 py-0.5 text-slate-700 bg-transparent leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
      return (
        <p key={i} className="mb-2 last:mb-0 leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        id="btn-trigger-ai"
        onClick={() => setIsOpen(true)}
        className={`${
          isSimulated ? "absolute bottom-4 right-4" : "fixed bottom-6 right-6"
        } z-50 flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 pointer border-0`}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <Sparkles className="w-5 h-5 text-amber-300" />
        <span className="font-medium tracking-wide font-sans text-xs sm:text-sm">Tanya Asisten SPMB (AI)</span>
      </button>

      {/* Chat Window Panel Container */}
      {isOpen && (
        <div
          id="chat-ai-panel"
          className={`${
            isSimulated 
              ? "absolute bottom-4 right-4 max-w-[calc(100%-2rem)] w-[360px]" 
              : "fixed bottom-6 right-6 w-full max-w-md"
          } z-50 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-12 duration-300`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-5 py-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Bot className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base font-display">Asisten SPMB AI</h3>
                <p className="text-xs text-blue-200 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Gemini 3.5 Flash Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border-0 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* WhatsApp Direct Contact Banner */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <i className="fa-brands fa-whatsapp text-emerald-600 text-lg"></i>
              <span>Hubungi WA Panitia Resmi (24/7)</span>
            </div>
            <a 
              href="https://wa.me/6289503312895" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg text-[10px] transition no-underline flex items-center gap-1 uppercase tracking-wider"
            >
              <span>WhatsApp</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
            </a>
          </div>

          {/* Messages list container */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role !== "user" && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-blue-700" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-blue-700 to-indigo-750 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none overflow-hidden"
                  }`}
                >
                  {m.role === "user" ? m.text : formatMessageText(m.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4 text-blue-700" />
                </div>
                <div className="bg-white border border-slate-100 text-slate-500 text-xs px-4 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce duration-300"></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce delay-75 duration-300"></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce delay-150 duration-300"></span>
                  </span>
                  Asisten sedang berpikir...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts & Footer */}
          <div className="p-3 bg-white border-t border-slate-100 space-y-3">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(p)}
                    className="text-xs text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tulis pesan pertanyaan anda..."
                className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border-0 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all duration-300"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-700 hover:bg-indigo-800 disabled:bg-slate-200 text-white p-2.5 rounded-xl shadow-lg hover:shadow-indigo-200 transition-all duration-300 border-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
