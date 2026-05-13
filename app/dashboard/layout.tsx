"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/auth";

// ─── Menü tanımları (roles: bu menüyü kimler görebilir) ──────────────────────
const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Gösterge Paneli",
    icon: "◈",
    exact: true,
    roles: ["Admin", "Librarian", "Assistant", "Student"] as UserRole[],
  },
  {
    href: "/dashboard/books",
    label: "Kitap Envanteri",
    icon: "◉",
    roles: ["Admin", "Librarian", "Assistant", "Student"] as UserRole[],
    // Assistant için read-only — ayrı bir prop ekleyebiliriz
    readOnlyFor: ["Assistant"] as UserRole[],
  },
  {
    href: "/dashboard/my-borrows",
    label: "Ödünç Aldıklarım",
    icon: "📋",
    roles: ["Student"] as UserRole[],
  },
  {
    href: "/dashboard/users",
    label: "Kullanıcılar",
    icon: "◇",
    roles: ["Admin", "Librarian"] as UserRole[], // Librarian da erişebilsin, ancak kendi yetkisi dahilindeki veriyi görsün
  },
  {
    href: "/dashboard/transactions",
    label: "Ödünç & İade",
    icon: "⟳",
    roles: ["Admin", "Librarian", "Assistant"] as UserRole[],
  },
];

const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  Admin:     { label: "Süper Admin",  color: "#c4b5fd", bg: "rgba(139,92,246,0.15)" },
  Librarian: { label: "Kütüphaneci",  color: "#93c5fd", bg: "rgba(59,130,246,0.15)"  },
  Assistant: { label: "Asistan",      color: "#6ee7b7", bg: "rgba(16,185,129,0.15)" },
  Student:   { label: "Öğrenci",      color: "#fcd34d", bg: "rgba(245,158,11,0.15)" },
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname             = usePathname();
  const { role, userName, initials, isReady, logout } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // isReady → context localStorage'dan okumayı bitirdi
  const visibleNav = NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  );

  const badge = role ? ROLE_BADGE[role] : null;

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#080c18", color: "#fff",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <aside style={{
        width: "248px", minWidth: "248px",
        background: "linear-gradient(180deg,#0f1629 0%,#0b1120 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "0 6px 20px rgba(79,70,229,0.4)",
            }}>📖</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "16px", color: "#fff", lineHeight: 1.1 }}>
                Biblios<span style={{ color: "#818cf8" }}>Hub</span>
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.18)", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase" }}>
                Kütüphane Sistemi
              </div>
            </div>
          </div>

          {/* Kullanıcı kartı */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "12px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "13px", boxShadow: "0 4px 12px rgba(79,70,229,0.35)",
            }}>
              {isReady ? initials : "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "12px", fontWeight: 700, color: "#e2e8f0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {isReady ? (userName || "Kullanıcı") : "Yükleniyor..."}
              </div>
              {badge && (
                <span style={{
                  display: "inline-block", marginTop: "2px",
                  padding: "1px 7px", borderRadius: "6px",
                  fontSize: "9px", fontWeight: 800,
                  background: badge.bg, color: badge.color, letterSpacing: "0.08em",
                }}>{badge.label}</span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.12)", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", padding: "4px 10px 10px" }}>
            Ana Menü
          </div>

          {visibleNav.map((item) => {
            const active   = isActive(item.href, item.exact);
            const readOnly = role && item.readOnlyFor?.includes(role);
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "11px", textDecoration: "none",
                fontSize: "13px", fontWeight: active ? 700 : 500, transition: "all 0.18s",
                background: active
                  ? "linear-gradient(135deg,rgba(79,70,229,0.22),rgba(124,58,237,0.12))"
                  : "transparent",
                color: active ? "#a5b4fc" : "rgba(255,255,255,0.32)",
                border: active ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
              }}>
                <span style={{
                  width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.04)",
                  fontSize: "12px", color: active ? "#818cf8" : "rgba(255,255,255,0.2)",
                }}>{item.icon}</span>

                <span style={{ flex: 1 }}>{item.label}</span>

                {/* Read-only badge */}
                {readOnly && (
                  <span style={{
                    fontSize: "8px", fontWeight: 800, letterSpacing: "0.08em",
                    padding: "2px 6px", borderRadius: "5px",
                    background: "rgba(245,158,11,0.12)", color: "rgba(251,191,36,0.7)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}>SALT OKU</span>
                )}

                {active && (
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Erişim seviyesi bilgisi */}
        {isReady && role && role !== "Admin" && (
          <div style={{ margin: "0 10px 8px", padding: "10px 12px", borderRadius: "10px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
            <div style={{ fontSize: "9px", color: "rgba(165,180,252,0.4)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px" }}>Erişim Seviyesi</div>
            <div style={{ fontSize: "11px", color: "rgba(165,180,252,0.65)", fontWeight: 600 }}>
              {role === "Student"
                ? "Kitaplar ve ödünç talepleriniz"
                : role === "Librarian"
                ? "Personeller sayfası gizli"
                : "Kısıtlı erişim — Sadece okuma"}
            </div>
          </div>
        )}

        {/* Çıkış */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={logout} style={{
            width: "100%", padding: "10px 12px", borderRadius: "11px",
            border: "1px solid rgba(239,68,68,0.12)", background: "rgba(239,68,68,0.04)",
            color: "rgba(248,113,113,0.55)", fontSize: "12px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.18s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(248,113,113,0.55)"; }}
          >
            ↩ Sistemden Çık
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
