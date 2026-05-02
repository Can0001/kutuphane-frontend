"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { role, userName, logout } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080c18", fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG Glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: "440px", padding: "0 24px" }}>
        {/* Icon */}
        <div style={{
          width: "88px", height: "88px", borderRadius: "24px", margin: "0 auto 28px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px",
        }}>🚫</div>

        {/* Title */}
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Erişim Reddedildi
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, margin: "0 0 8px" }}>
          Bu sayfayı görüntüleme yetkiniz bulunmuyor.
        </p>

        {/* Role info */}
        {role && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "8px 16px", borderRadius: "20px", margin: "0 0 32px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <span style={{ fontSize: "12px", color: "rgba(248,113,113,0.7)" }}>
              Mevcut rol:
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#f87171" }}>
              {role}
            </span>
          </div>
        )}

        {/* Separator */}
        <div style={{ width: "48px", height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 auto 32px" }} />

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "13px 24px", borderRadius: "14px", border: "none",
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
              fontSize: "13px", fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.05em", boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
            }}
          >
            ← Gösterge Paneline Dön
          </button>
          <button
            onClick={logout}
            style={{
              padding: "13px 24px", borderRadius: "14px",
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)", color: "#f87171",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Çıkış Yap
          </button>
        </div>

        {/* Footer */}
        <p style={{ marginTop: "32px", fontSize: "11px", color: "rgba(255,255,255,0.12)" }}>
          {userName && `${userName} — `}Yöneticinizle iletişime geçin
        </p>
      </div>
    </div>
  );
}
