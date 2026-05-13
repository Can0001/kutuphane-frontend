"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://localhost:7069/api";

interface Book {
  id: number;
  title: string;
  author: string;
  imagePath?: string;
}

interface BorrowRecord {
  id: number;
  bookId: number;
  bookTitle?: string;
  status: string;
  requestDate: string;
  transactionDate?: string;
  dueDate?: string;
}

interface EnrichedRecord extends BorrowRecord {
  resolvedTitle: string;
  resolvedAuthor: string;
  resolvedImage?: string;
  resolvedDueDate?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  Pending:  { label: "Bekliyor",      color: "#fbbf24", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.25)", icon: "⏳" },
  Approved: { label: "Sende",         color: "#34d399", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.25)", icon: "📖" },
  Rejected: { label: "Reddedildi",    color: "#f87171", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.25)",  icon: "✕"  },
  Returned: { label: "İade Edildi",   color: "#60a5fa", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.25)", icon: "✓"  },
  Overdue:  { label: "Süresi Doldu",  color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.35)", icon: "⚠"  },
};

type TabKey = "active" | "history";

export default function MyBorrowsPage() {
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txnRes, booksRes] = await Promise.allSettled([
          axios.get(`${API}/BookTransactions/getbyuser?userId=${userId}`),
          axios.get(`${API}/Books/getall`),
        ]);

        const txnData: BorrowRecord[] = txnRes.status === "fulfilled" ? txnRes.value.data : [];
        const booksData: Book[] = booksRes.status === "fulfilled" ? booksRes.value.data : [];

        const bookMap = new Map<number, Book>();
        booksData.forEach((b) => bookMap.set(b.id, b));

        const enriched: EnrichedRecord[] = txnData.map((r) => {
          const book = bookMap.get(r.bookId);
          return {
            ...r,
            resolvedTitle: book?.title || r.bookTitle || `Kitap #${r.bookId}`,
            resolvedAuthor: book?.author || "",
            resolvedImage: book?.imagePath || undefined,
            resolvedDueDate: r.dueDate || undefined,
          };
        });

        setRecords(enriched);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Ayrıştırılmış listeler — Overdue da aktif sayılır (hâlâ öğrencide)
  const activeRecords = records.filter((r) => r.status === "Pending" || r.status === "Approved" || r.status === "Overdue");
  const historyRecords = records.filter((r) => r.status === "Returned" || r.status === "Rejected");

  const counts = {
    Pending: records.filter((r) => r.status === "Pending").length,
    Approved: records.filter((r) => r.status === "Approved").length,
    Rejected: records.filter((r) => r.status === "Rejected").length,
    Returned: records.filter((r) => r.status === "Returned").length,
    Overdue: records.filter((r) => r.status === "Overdue").length,
  };

  const currentList = activeTab === "active" ? activeRecords : historyRecords;

  return (
    <div style={{ minHeight: "100%", background: "#080c18", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes overdueBlink{0%,100%{opacity:1}50%{opacity:0.5}} .overdue-blink{animation:overdueBlink 2s ease-in-out infinite}`}</style>
      {/* Header */}
      <header style={{
        padding: "28px 36px 22px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "4px" }}>
            Kişisel Panel
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#fff", margin: 0 }}>Ödünç Aldıklarım</h1>
        </div>

        {/* Stat Badges */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[string]][]).map(([key, cfg]) => (
            <div key={key} style={{
              padding: "10px 16px", borderRadius: "12px", textAlign: "center",
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: cfg.color }}>{counts[key as keyof typeof counts] ?? 0}</div>
              <div style={{ fontSize: "9px", color: `${cfg.color}99`, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{cfg.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div style={{
        padding: "0 36px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.008)",
      }}>
        <div style={{ display: "flex", gap: "0" }}>
          {([
            { key: "active" as TabKey, label: "Aktif İşlemlerim", count: activeRecords.length, color: "#34d399" },
            { key: "history" as TabKey, label: "İşlem Geçmişim", count: historyRecords.length, color: "#60a5fa" },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "14px 24px 13px",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                  background: "transparent",
                  color: isActive ? tab.color : "rgba(255,255,255,0.25)",
                  fontSize: "13px",
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: 800,
                  background: isActive ? `${tab.color}18` : "rgba(255,255,255,0.04)",
                  color: isActive ? tab.color : "rgba(255,255,255,0.2)",
                  border: isActive ? `1px solid ${tab.color}30` : "1px solid rgba(255,255,255,0.06)",
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 36px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "38px", height: "38px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Yükleniyor</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : currentList.length === 0 ? (
          /* ── Empty State ──────────────────────────────────── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "80px 20px", textAlign: "center",
          }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "20px",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", marginBottom: "20px",
            }}>
              {activeTab === "active" ? "📚" : "🗂️"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>
              {activeTab === "active" ? "Aktif işleminiz bulunmuyor" : "Geçmiş kaydınız henüz yok"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.08)", fontSize: "12px", maxWidth: "300px", lineHeight: 1.5 }}>
              {activeTab === "active"
                ? "Kitap Envanteri'nden ödünç talebinde bulunarak burada görüntüleyebilirsiniz."
                : "İade edilen veya reddedilen kitaplarınız burada listelenecek."}
            </div>
          </div>
        ) : activeTab === "active" ? (
          /* ── Active: Large Cards Grid ─────────────────────── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {currentList.map((record) => {
              const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;
              return (
                <div key={record.id} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  transition: "all 0.25s",
                }}>
                  {/* Status color bar */}
                  <div style={{
                    height: "3px",
                    background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}44)`,
                  }} />

                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      {/* Book cover */}
                      {record.resolvedImage ? (
                        <div style={{
                          width: "52px", height: "68px", borderRadius: "10px", flexShrink: 0,
                          overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                        }}>
                          <img
                            src={`${API.replace("/api", "")}${record.resolvedImage}`}
                            alt={record.resolvedTitle}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: "52px", height: "68px", borderRadius: "10px", flexShrink: 0,
                          background: "linear-gradient(135deg, #1e2435, #151b2c)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "24px", fontWeight: 900, color: "rgba(255,255,255,0.08)",
                          textTransform: "uppercase",
                        }}>
                          {record.resolvedTitle[0]}
                        </div>
                      )}

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "14px", fontWeight: 800, color: "#f1f5f9",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          marginBottom: "3px",
                        }}>
                          {record.resolvedTitle}
                        </div>

                        {record.resolvedAuthor && (
                          <div style={{
                            fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 600,
                            marginBottom: "8px",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {record.resolvedAuthor}
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span className={record.status === "Overdue" ? "overdue-blink" : ""} style={{
                            padding: "4px 12px", borderRadius: "20px",
                            fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em",
                            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                          }}>
                            {record.status === "Overdue" ? "⚠" : "●"} {cfg.label}
                          </span>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                            {record.transactionDate || record.requestDate
                              ? new Date(record.transactionDate || record.requestDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Extra info for approved/overdue */}
                    {(record.status === "Approved" || record.status === "Overdue") && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                        {record.transactionDate && (
                          <div style={{
                            flex: 1, padding: "10px 14px", borderRadius: "12px",
                            background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)",
                          }}>
                            <div style={{ fontSize: "9px", color: "rgba(52,211,153,0.5)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px" }}>
                              Onay Tarihi
                            </div>
                            <div style={{ fontSize: "12px", color: "#34d399", fontWeight: 700, fontFamily: "monospace" }}>
                              {new Date(record.transactionDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                            </div>
                          </div>
                        )}
                        {record.resolvedDueDate && (() => {
                          const due = new Date(record.resolvedDueDate);
                          const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                          const isUrgent = daysLeft <= 2 && daysLeft >= 0;
                          const isPast = daysLeft < 0;
                          const borderColor = isPast ? "rgba(220,38,38,0.2)" : isUrgent ? "rgba(245,158,11,0.2)" : "rgba(99,102,241,0.15)";
                          const bgColor = isPast ? "rgba(220,38,38,0.05)" : isUrgent ? "rgba(245,158,11,0.05)" : "rgba(99,102,241,0.04)";
                          const textColor = isPast ? "#f87171" : isUrgent ? "#fbbf24" : "#818cf8";
                          const labelColor = isPast ? "rgba(248,113,113,0.5)" : isUrgent ? "rgba(251,191,36,0.5)" : "rgba(129,140,248,0.5)";
                          return (
                            <div style={{
                              flex: 1, padding: "10px 14px", borderRadius: "12px",
                              background: bgColor, border: `1px solid ${borderColor}`,
                            }}>
                              <div style={{ fontSize: "9px", color: labelColor, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "3px" }}>
                                {isPast ? "⚠ Geçti!" : isUrgent ? "⚠ Son Günler" : "Teslim Tarihi"}
                              </div>
                              <div style={{ fontSize: "12px", color: textColor, fontWeight: 700, fontFamily: "monospace" }}>
                                {due.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── History: Compact List View ───────────────────── */
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "16px",
            overflow: "hidden",
          }}>
            {currentList.map((record, idx) => {
              const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.Returned;
              const date = record.transactionDate || record.requestDate;
              return (
                <div
                  key={record.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 20px",
                    borderBottom: idx < currentList.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Tiny cover */}
                  {record.resolvedImage ? (
                    <div style={{
                      width: "32px", height: "42px", borderRadius: "6px", flexShrink: 0,
                      overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <img
                        src={`${API.replace("/api", "")}${record.resolvedImage}`}
                        alt={record.resolvedTitle}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: "32px", height: "42px", borderRadius: "6px", flexShrink: 0,
                      background: "linear-gradient(135deg, #1a1f2e, #141824)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 900, color: "rgba(255,255,255,0.06)",
                      textTransform: "uppercase",
                    }}>
                      {record.resolvedTitle[0]}
                    </div>
                  )}

                  {/* Title & Author */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.65)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {record.resolvedTitle}
                    </div>
                    {record.resolvedAuthor && (
                      <div style={{
                        fontSize: "10px", color: "rgba(255,255,255,0.18)", fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {record.resolvedAuthor}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{
                    fontSize: "11px", color: "rgba(255,255,255,0.15)", fontFamily: "monospace",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {date
                      ? new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px",
                    fontSize: "9px", fontWeight: 800, letterSpacing: "0.06em",
                    background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                    flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
