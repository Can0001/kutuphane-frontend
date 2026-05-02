"use client";

import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { setCookie } from "@/lib/auth";

const API = "https://localhost:7069/api";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const router   = useRouter();
  const { setToken } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/Auth/login`, { email, password });
      const { token, role, firstName, lastName } = res.data;

      // ── 1. Kullanıcı adını localStorage'a ÖNCE yaz ───────────────
      //    setToken → buildState → extractName sırasında okunabilsin
      const userName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
      if (userName) localStorage.setItem("userName", userName);

      // ── 2. Context'e token'ı ver (JWT decode + state güncelle) ──
      setToken(token);

      // ── 3. Middleware cookie'yi okuyabilsin diye kaydet ──────────
      setCookie("auth_token", token);
      // Rolü normalize et (API "admin" döndürebilir → "Admin" kaydedelim)
      if (role) {
        const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        setCookie("user_role", normalizedRole);
      }

      // ── 4. Dashboard'a yönlendir ─────────────────────────────────
      router.push("/dashboard");


    } catch (error: unknown) {
      setLoading(false);
      let msg = "E-posta veya şifre hatalı.";

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          msg = "Sunucuya bağlanılamadı. https://localhost:7069 adresini tarayıcıda açıp sertifikayı kabul edin.";
        } else if (error.response.status === 401) {
          msg = "E-posta veya şifre hatalı.";
        } else {
          msg = error.response.data?.message ?? "Giriş başarısız.";
        }
      }

      Swal.fire({
        title: "Erişim Reddedildi", text: msg, icon: "error",
        background: "#0f1629", color: "#fff",
        confirmButtonColor: "#4f46e5", confirmButtonText: "Tekrar Dene",
      });
    }
  };

  /* ── Giriş alanı yardımcısı ─────────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px 13px 44px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px", color: "#fff", fontSize: "14px", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080c18", fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG glows */}
      <div style={{ position: "absolute", top: "-20%", left: "-15%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: "420px", padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "72px", height: "72px", borderRadius: "20px",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 20px 48px rgba(79,70,229,0.4)",
            marginBottom: "20px", fontSize: "32px",
          }}>📖</div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
            Biblios<span style={{ color: "#818cf8" }}>Hub</span>
          </h1>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Kütüphane Yönetim Sistemi
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "24px", padding: "36px", backdropFilter: "blur(12px)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>Sisteme Giriş</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.22)" }}>Yetkili personel girişi</div>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>E-Posta</label>
              <div style={{ position: "relative" }}>
                <input id="login-email" type="email" required placeholder="personel@kutuphane.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(99,102,241,0.6)")}
                  onBlur={(e)  => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)")} />
                <span style={{ position: "absolute", left: "16px", top: "14px", fontSize: "16px", opacity: 0.3 }}>📧</span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Şifre</label>
              <div style={{ position: "relative" }}>
                <input id="login-password" type="password" required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(99,102,241,0.6)")}
                  onBlur={(e)  => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)")} />
                <span style={{ position: "absolute", left: "16px", top: "14px", fontSize: "16px", opacity: 0.3 }}>🔑</span>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              marginTop: "8px", width: "100%", padding: "14px", borderRadius: "14px", border: "none",
              background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: "#fff", fontSize: "13px", fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: loading ? "none" : "0 8px 28px rgba(79,70,229,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            }}>
              {loading ? (
                <>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Doğrulanıyor...
                </>
              ) : "Giriş Yap →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "rgba(255,255,255,0.12)" }}>
          Sadece yetkili personel erişebilir
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}