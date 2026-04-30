"use client";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("https://localhost:7069/api/Auth/login", {
        email: email,
        password: password,
      });

      const token = response.data.token;
      localStorage.setItem("LibraryAuthToken", token);

      router.push("/dashboard");

    } catch (error: unknown) {
      console.error("Login hatası:", error);
      setLoading(false);

      let errorMessage = "E-posta veya şifre eşleşmiyor. Lütfen yetkilerinizi kontrol edin.";

      if (
        error instanceof Error &&
        (error.message.includes("Network Error") || error.message.includes("ERR_CERT"))
      ) {
        errorMessage =
          "Sunucuya bağlanılamadı. Lütfen https://localhost:7069 adresini tarayıcıda açıp sertifikayı kabul edin, ardından tekrar deneyin.";
      }

      Swal.fire({
        title: '<span style="color: #fff; font-weight: 900; text-transform: uppercase;">Erişim Reddedildi</span>',
        text: errorMessage,
        icon: "error",
        background: "#161b27",
        color: "#fff",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "TEKRAR DENE",
        customClass: {
          popup: "rounded-[2.5rem] border border-white/5 shadow-2xl shadow-red-500/10",
          confirmButton: "rounded-xl px-8 py-3 text-[11px] font-black uppercase tracking-widest",
        }
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f1117] font-sans antialiased overflow-hidden">
      
      {/* Arka Plan Dekoratif Işıklar */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-md px-6">
        {/* Logo Bölümü */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/20 mb-6 group transition-transform hover:scale-110 duration-500">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Kütüphane <span className="text-indigo-500">Otomasyonu</span>
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em] mt-3">
            Merkezi Yönetim Terminali
          </p>
        </div>

        {/* Login Kartı */}
        <div className="rounded-[3rem] bg-[#161b27] p-10 shadow-2xl border border-white/5 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-8">
            
            {/* E-Posta Grubu */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
                E-Posta Adresi
              </label>
              <div className="relative group">
                <input
                  type="email"
                  className="w-full rounded-2xl bg-white/5 border border-white/5 px-6 py-4 text-sm text-white placeholder-white/10 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all pl-14"
                  placeholder="admin@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="absolute left-6 top-4 opacity-20 group-focus-within:opacity-100 transition-opacity">📧</span>
              </div>
            </div>

            {/* Şifre Grubu */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
                Güvenlik Anahtarı
              </label>
              <div className="relative group">
                <input
                  type="password"
                  className="w-full rounded-2xl bg-white/5 border border-white/5 px-6 py-4 text-sm text-white placeholder-white/10 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all pl-14"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="absolute left-6 top-4 opacity-20 group-focus-within:opacity-100 transition-opacity">🔑</span>
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-xs font-black text-white uppercase tracking-[0.3em] shadow-xl shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sorgulanıyor...
                </div>
              ) : (
                "Sisteme Giriş Yap"
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-10 text-center">
          </div>
        </div>
      </div>
    </div>
  );
}