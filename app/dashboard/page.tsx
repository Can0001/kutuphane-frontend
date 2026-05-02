"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://localhost:7069/api";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

function StatCard({ label, value, icon, color, bg, border }: StatCardProps) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: "20px",
      padding: "24px", display: "flex", alignItems: "center", gap: "16px",
      transition: "transform 0.2s",
    }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "14px",
        background: `${color}20`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "32px", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState({ books: 0, available: 0, borrowed: 0, students: 0, staffs: 0, transactions: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { role: currentUserRole } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [booksRes, usersRes, txnsRes] = await Promise.allSettled([
          axios.get(`${API}/Books/getall`),
          axios.get(`${API}/Users/getall`),
          axios.get(`${API}/BookTransactions/getall`),
        ]);
        const books = booksRes.status === "fulfilled" ? booksRes.value.data : [];
        const users = usersRes.status === "fulfilled" ? usersRes.value.data : [];
        const allTxns = txnsRes.status === "fulfilled" ? txnsRes.value.data : [];

        const students = users.filter((u: any) => u.role && (u.role.toLowerCase() === "student" || u.role.toLowerCase() === "öğrenci" || u.role.toLowerCase() === "ogrenci"));
        
        const approvedTxns = allTxns.filter((t: any) => t.status === "Approved");
        const borrowedCount = approvedTxns.length;
        const availableCount = books.length - borrowedCount;

        const recent = approvedTxns.map((t: any) => {
          const b = books.find((x: any) => x.id === t.bookId);
          const u = users.find((x: any) => x.id === t.userId);
          return {
            id: t.id,
            title: b ? b.title : `Kitap #${t.bookId}`,
            borrowedBy: u ? `${u.firstName} ${u.lastName}` : `Kullanıcı #${t.userId}`,
            borrowedDate: t.transactionDate || t.requestDate || new Date().toISOString()
          };
        }).slice(0, 5);

        setStats({ books: books.length, available: availableCount, borrowed: borrowedCount, students: students.length, staffs: users.length - students.length, transactions: allTxns.length });
        setRecentActivity(recent);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const allQuickLinks = [
    { label: "Kitap Ekle", desc: "Envantere yeni kitap ekle", icon: "📚", href: "/dashboard/add", color: "#6366f1", roles: ["Admin", "Librarian", "Assistant"] },
    { label: "Kullanıcılar", desc: "Tüm sistem kullanıcılarını yönet", icon: "👥", href: "/dashboard/users", color: "#10b981", roles: ["Admin", "Librarian"] },
    { label: "Ödünç & İade", desc: "Aktif işlemleri takip et", icon: "🔄", href: "/dashboard/transactions", color: "#3b82f6", roles: ["Admin", "Librarian", "Assistant"] },
  ];

  const quickLinks = allQuickLinks.filter(q => q.roles.includes(currentUserRole || ""));

  return (
    <div style={{ minHeight: "100%", background: "#0a0e1a", padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "6px" }}>Genel Bakış</div>
        <h1 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.5))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Gösterge Paneli
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="Toplam Kitap" value={loading ? "—" : stats.books} icon="📚" color="#818cf8" bg="rgba(99,102,241,0.05)" border="rgba(99,102,241,0.15)" />
        <StatCard label="Mevcut Kitap" value={loading ? "—" : stats.available} icon="✅" color="#34d399" bg="rgba(16,185,129,0.05)" border="rgba(16,185,129,0.15)" />
        <StatCard label="Ödünçte" value={loading ? "—" : stats.borrowed} icon="📤" color="#fbbf24" bg="rgba(245,158,11,0.05)" border="rgba(245,158,11,0.15)" />
        <StatCard label="Kayıtlı Öğrenci" value={loading ? "—" : stats.students} icon="🎓" color="#60a5fa" bg="rgba(59,130,246,0.05)" border="rgba(59,130,246,0.15)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Hızlı Erişim */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>Hızlı Erişim</div>
          {quickLinks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {quickLinks.map(q => (
                <button key={q.href} onClick={() => router.push(q.href)} style={{
                  display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
                  borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${q.color}12`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${q.color}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${q.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{q.icon}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "2px" }}>{q.label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>{q.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.15)", fontSize: "16px" }}>›</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px", padding: "16px 0" }}>Bu alan için yetkiniz bulunmuyor.</div>
          )}
        </div>

        {/* Son Ödünç İşlemleri */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>Aktif Ödünç Kitaplar</div>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>Yükleniyor...</div>
          ) : recentActivity.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>Aktif ödünç işlemi yok</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentActivity.map((r: any) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>📤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fde68a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                    {currentUserRole !== "Student" && (
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{r.borrowedBy}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(245,158,11,0.6)", fontWeight: 700, whiteSpace: "nowrap" }}>Ödünçte</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}