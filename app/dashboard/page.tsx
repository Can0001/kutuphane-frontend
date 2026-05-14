"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://localhost:7069/api";

// ─── Shared StatCard ──────────────────────────────────────────────────────────
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

// ─── Student Dashboard ────────────────────────────────────────────────────────
interface BookInfo {
  id: number;
  title: string;
  author: string;
  imagePath?: string;
}

function StudentDashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0, returned: 0, overdue: 0, trustScore: 0, penaltyScore: 0 });
  const [activeBooks, setActiveBooks] = useState<{
    id: number;
    bookTitle: string;
    bookAuthor: string;
    bookImage?: string;
    transactionDate: string;
    isOverdue: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, userName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txnRes, booksRes, usersRes] = await Promise.allSettled([
          axios.get(`${API}/BookTransactions/getbyuser?userId=${userId}`),
          axios.get(`${API}/Books/getall`),
          axios.get(`${API}/Users/getall`),
        ]);
        const txns: any[] = txnRes.status === "fulfilled" ? txnRes.value.data : [];
        const books: BookInfo[] = booksRes.status === "fulfilled" ? booksRes.value.data : [];
        const users: any[] = usersRes.status === "fulfilled" ? usersRes.value.data : [];

        const me = users.find(u => String(u.id) === String(userId));
        const trustScore = me?.trustScore || 0;
        const penaltyScore = me?.penaltyScore || 0;

        const bookMap = new Map<number, BookInfo>();
        books.forEach((b) => bookMap.set(b.id, b));

        const approved = txns.filter((t) => t.status === "Approved");
        const pending = txns.filter((t) => t.status === "Pending");
        const returned = txns.filter((t) => t.status === "Returned");
        const overdue = txns.filter((t) => t.status === "Overdue");

        setStats({
          approved: approved.length,
          pending: pending.length,
          returned: returned.length,
          overdue: overdue.length,
          trustScore,
          penaltyScore,
        });

        const activeTxns = [...approved, ...overdue];
        setActiveBooks(
          activeTxns.map((t) => {
            const book = bookMap.get(t.bookId);
            return {
              id: t.id,
              bookTitle: book?.title || t.bookTitle || `Kitap #${t.bookId}`,
              bookAuthor: book?.author || "",
              bookImage: book?.imagePath || undefined,
              transactionDate: t.transactionDate || t.requestDate || new Date().toISOString(),
              isOverdue: t.status === "Overdue",
            };
          })
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return (
    <div style={{ minHeight: "100%", background: "#0a0e1a", padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "6px" }}>Hoş Geldin</div>
        <h1 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.5))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          {userName || "Öğrenci"} <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', WebkitTextFillColor: "initial" }}>👋</span>
        </h1>
      </div>

      {/* Gamification Stats */}
      {(() => {
        let maxLimit = 5;
        let tierName = "Standart Okur";
        let tierColor = "#94a3b8";
        let tierBg = "rgba(148,163,184,0.15)";
        
        if (stats.trustScore >= 100) {
          maxLimit = 10;
          tierName = "VIP Okur";
          tierColor = "#fbbf24";
          tierBg = "rgba(251,191,36,0.15)";
        } else if (stats.trustScore >= 50) {
          maxLimit = 7;
          tierName = "Güvenilir Okur";
          tierColor = "#38bdf8";
          tierBg = "rgba(56,189,248,0.15)";
        }

        const activeBooksCount = stats.approved + stats.overdue;

        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div style={{ position: "relative" }}>
              <StatCard label="Güven Puanım" value={loading ? "—" : stats.trustScore} icon="🏆" color="#10b981" bg="rgba(16,185,129,0.06)" border="rgba(16,185,129,0.2)" />
              {!loading && (
                <div style={{ position: "absolute", top: "16px", right: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 800, color: tierColor, background: tierBg, border: `1px solid ${tierColor}40`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {tierName}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                    {activeBooksCount} / {maxLimit} Kitap Kullanımda
                  </span>
                </div>
              )}
            </div>
            <StatCard label="Ceza Puanım" value={loading ? "—" : stats.penaltyScore} icon="⚠️" color="#f97316" bg="rgba(249,115,22,0.06)" border="rgba(249,115,22,0.2)" />
          </div>
        );
      })()}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="Elimdeki Kitaplar" value={loading ? "—" : stats.approved + stats.overdue} icon="📖" color="#34d399" bg="rgba(16,185,129,0.05)" border="rgba(16,185,129,0.15)" />
        <StatCard label="Bekleyen Taleplerim" value={loading ? "—" : stats.pending} icon="⏳" color="#fbbf24" bg="rgba(245,158,11,0.05)" border="rgba(245,158,11,0.15)" />
        <StatCard label="Geciken Kitaplar" value={loading ? "—" : stats.overdue} icon="⚠️" color="#dc2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.18)" />
        <StatCard label="Toplam Okuduğum" value={loading ? "—" : stats.returned} icon="✅" color="#60a5fa" bg="rgba(59,130,246,0.05)" border="rgba(59,130,246,0.15)" />
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Aktif Okuduklarım */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>Aktif Okuduklarım</div>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>Yükleniyor...</div>
          ) : activeBooks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📚</div>
              <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>Şu an elinde ödünç kitap yok</div>
              <button onClick={() => router.push("/dashboard/books")} style={{
                marginTop: "12px", padding: "8px 18px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
                fontSize: "11px", fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
              }}>Kitap Envanterine Git</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeBooks.map((ab) => (
                <div key={ab.id} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 14px", borderRadius: "14px",
                  background: ab.isOverdue ? "rgba(220,38,38,0.06)" : "rgba(16,185,129,0.04)",
                  border: ab.isOverdue ? "1px solid rgba(220,38,38,0.15)" : "1px solid rgba(16,185,129,0.1)",
                  transition: "all 0.2s",
                }}>
                  {/* Cover */}
                  {ab.bookImage ? (
                    <div style={{
                      width: "40px", height: "54px", borderRadius: "8px", flexShrink: 0,
                      overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <img src={`${API.replace("/api", "")}${ab.bookImage}`} alt={ab.bookTitle}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{
                      width: "40px", height: "54px", borderRadius: "8px", flexShrink: 0,
                      background: "linear-gradient(135deg, #1e2435, #151b2c)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 900, color: "rgba(255,255,255,0.08)",
                    }}>
                      {ab.bookTitle[0]}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: ab.isOverdue ? "#fca5a5" : "#a7f3d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ab.bookTitle}</div>
                    {ab.bookAuthor && (
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>{ab.bookAuthor}</div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {ab.isOverdue ? (
                      <>
                        <div style={{ fontSize: "9px", color: "rgba(220,38,38,0.6)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>⚠ Gecikti</div>
                        <div style={{ fontSize: "11px", color: "rgba(220,38,38,0.8)", fontFamily: "monospace", fontWeight: 600 }}>
                          Süresi Doldu
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "9px", color: "rgba(52,211,153,0.4)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Onay</div>
                        <div style={{ fontSize: "11px", color: "rgba(52,211,153,0.7)", fontFamily: "monospace", fontWeight: 600 }}>
                          {new Date(ab.transactionDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hızlı Erişim */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>Hızlı Erişim</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Kitap Envanteri", desc: "Yeni kitap ara ve ödünç iste", icon: "📚", href: "/dashboard/books", color: "#6366f1" },
              { label: "Ödünç Aldıklarım", desc: "Tüm taleplerinizi görüntüleyin", icon: "📋", href: "/dashboard/my-borrows", color: "#10b981" },
            ].map((q) => (
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
        </div>
      </div>
    </div>
  );
}

// ─── Admin/Staff Dashboard ────────────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState({ books: 0, available: 0, borrowed: 0, students: 0, staffs: 0, transactions: 0, overdue: 0 });
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
        const overdueTxns = allTxns.filter((t: any) => t.status === "Overdue");
        const borrowedCount = approvedTxns.length + overdueTxns.length;
        const availableCount = books.length - borrowedCount;

        const activeTxns = [...approvedTxns, ...overdueTxns];
        const recent = activeTxns.map((t: any) => {
          const b = books.find((x: any) => x.id === t.bookId);
          const u = users.find((x: any) => x.id === t.userId);
          return {
            id: t.id,
            title: b ? b.title : `Kitap #${t.bookId}`,
            borrowedBy: u ? `${u.firstName} ${u.lastName}` : `Kullanıcı #${t.userId}`,
            borrowedDate: t.transactionDate || t.requestDate || new Date().toISOString(),
            isOverdue: t.status === "Overdue",
          };
        }).slice(0, 5);

        setStats({ books: books.length, available: availableCount, borrowed: borrowedCount, students: students.length, staffs: users.length - students.length, transactions: allTxns.length, overdue: overdueTxns.length });
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="Toplam Kitap" value={loading ? "—" : stats.books} icon="📚" color="#818cf8" bg="rgba(99,102,241,0.05)" border="rgba(99,102,241,0.15)" />
        <StatCard label="Mevcut Kitap" value={loading ? "—" : stats.available} icon="✅" color="#34d399" bg="rgba(16,185,129,0.05)" border="rgba(16,185,129,0.15)" />
        <StatCard label="Ödünçte" value={loading ? "—" : stats.borrowed} icon="📤" color="#fbbf24" bg="rgba(245,158,11,0.05)" border="rgba(245,158,11,0.15)" />
        <StatCard label="Geciken Kitaplar" value={loading ? "—" : stats.overdue} icon="⚠️" color="#dc2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.18)" />
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
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: r.isOverdue ? "rgba(220,38,38,0.06)" : "rgba(245,158,11,0.05)", border: r.isOverdue ? "1px solid rgba(220,38,38,0.15)" : "1px solid rgba(245,158,11,0.1)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: r.isOverdue ? "rgba(220,38,38,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{r.isOverdue ? "⚠️" : "📤"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: r.isOverdue ? "#fca5a5" : "#fde68a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{r.borrowedBy}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: r.isOverdue ? "rgba(220,38,38,0.8)" : "rgba(245,158,11,0.6)", fontWeight: 700, whiteSpace: "nowrap" }}>{r.isOverdue ? "Süresi Doldu" : "Ödünçte"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export — role'e göre doğru dashboard'u render eder ──────────────────
export default function DashboardHome() {
  const { role: currentUserRole, isReady } = useAuth();

  if (!isReady) {
    return (
      <div style={{ minHeight: "100%", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "38px", height: "38px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (currentUserRole === "Student") {
    return <StudentDashboard />;
  }

  return <AdminDashboard />;
}