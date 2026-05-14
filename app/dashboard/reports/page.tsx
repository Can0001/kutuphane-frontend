"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const API = "https://localhost:7069/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalBooks: number;
  activeBorrows: number;
  overdueBooks: number;
  mostPopularBook?: string;
  topBook?: string; // backend alternatif alan adı
}

interface ChartItem {
  name: string;
  value: number;
}

// /api/Reports/getdetails yanıt modeli
interface TransactionDetail {
  id: number;
  bookName: string;
  userName: string;
  transactionDate: string;
  returnDate?: string;
  dueDate?: string;
  status: string;
}

// Bileşen içinde kullanılan normalize model
interface Transaction {
  id: number;
  bookTitle: string;
  borrowerName: string;
  transactionDate: string;
  returnDate?: string;
  status: string;
}

// ─── Colour palette for bars ─────────────────────────────────────────────────
const BAR_COLORS = [
  "#6366f1","#8b5cf6","#3b82f6","#06b6d4","#10b981",
  "#f59e0b","#ef4444","#ec4899","#14b8a6","#a855f7",
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    Approved:  { bg: "rgba(16,185,129,0.12)",  color: "#34d399", label: "Ödünçte"     },
    Pending:   { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", label: "Bekliyor"    },
    Returned:  { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", label: "İade Edildi" },
    Overdue:   { bg: "rgba(220,38,38,0.12)",   color: "#f87171", label: "Gecikmiş"   },
    Rejected:  { bg: "rgba(107,114,128,0.12)", color: "#9ca3af", label: "Reddedildi" },
  };
  const s = map[status] ?? { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: status };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "8px", fontSize: "11px",
      fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg, border }: {
  label: string; value: string | number; icon: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: "20px",
      padding: "24px 28px", display: "flex", alignItems: "center", gap: "18px",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{
        width: "54px", height: "54px", borderRadius: "15px", flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}28`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
        <div style={{ fontSize: "30px", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f1629", border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: "12px", padding: "10px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 900, color: "#a5b4fc" }}>{payload[0].value}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>adet</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [chartData, setChartData]       = useState<ChartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered]         = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortCol, setSortCol]           = useState<keyof Transaction>("transactionDate");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");

  // ── Fetch all data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("LibraryAuthToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, booksRes, detailsRes] = await Promise.allSettled([
          axios.get<Stats>(`${API}/Reports/getstats`, { headers }),
          axios.get<any[]>(`${API}/Books/getall`, { headers }),
          axios.get<TransactionDetail[]>(`${API}/Reports/getdetails`, { headers }),
        ]);

        // Stats
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data);
        }

        // Chart — category distribution from books
        if (booksRes.status === "fulfilled") {
          const books: any[] = booksRes.value.data;
          const catMap = new Map<string, number>();
          books.forEach(b => {
            const cat = b.category || b.genre || "Diğer";
            catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
          });
          const sorted = [...catMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
          setChartData(sorted);
        }

        // Transactions table — /api/Reports/getdetails (gerçek isimler)
        if (detailsRes.status === "fulfilled") {
          const raw: TransactionDetail[] = detailsRes.value.data;
          const mapped: Transaction[] = raw.map(t => ({
            id: t.id,
            bookTitle: t.bookName,
            borrowerName: t.userName,
            transactionDate: t.transactionDate ?? "",
            returnDate: t.returnDate ?? undefined,
            status: t.status ?? "Bilinmiyor",
          }));
          setTransactions(mapped);
          setFiltered(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Filter & sort ────────────────────────────────────────────────────────────
  const applyFilter = useCallback(() => {
    let result = [...transactions];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.bookTitle.toLowerCase().includes(q) ||
        t.borrowerName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }
    result.sort((a, b) => {
      const av = String(a[sortCol] ?? "");
      const bv = String(b[sortCol] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    setFiltered(result);
  }, [transactions, search, statusFilter, sortCol, sortDir]);

  useEffect(() => { applyFilter(); }, [applyFilter]);

  // ── Sort toggle ──────────────────────────────────────────────────────────────
  const toggleSort = (col: keyof Transaction) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Excel export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("LibraryAuthToken");
      const response = await axios.get(`${API}/Reports/exportexcel`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `biblioshub-rapor-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel indirme hatası:", err);
      alert("Excel raporu indirilirken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const thStyle = (col: keyof Transaction): React.CSSProperties => ({
    padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800,
    color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: sortCol === col ? "rgba(99,102,241,0.06)" : "transparent",
  });

  // ─── Loading spinner ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100%", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "42px", height: "42px", border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Veriler yükleniyor...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100%", background: "#0a0e1a", padding: "32px 40px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .reports-row { animation: fadeIn 0.4s ease both; }
        .table-row:hover td { background: rgba(99,102,241,0.04) !important; }
        input::placeholder { color: rgba(255,255,255,0.18); }
        select option { background: #0f1629; color: #e2e8f0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="reports-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "6px" }}>
            Admin Paneli
          </div>
          <h1 style={{
            margin: 0, fontSize: "34px", fontWeight: 900, letterSpacing: "-0.025em",
            background: "linear-gradient(120deg, #fff 30%, rgba(165,180,252,0.7))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Raporlama &amp; Analiz
          </h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.22)", fontSize: "13px" }}>
            Kütüphane istatistikleri, grafikler ve detaylı ödünç kayıtları
          </p>
        </div>

        {/* Excel export button */}
        <button
          id="btn-export-excel"
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "13px 22px", borderRadius: "14px", border: "1px solid rgba(34,197,94,0.35)",
            background: exporting ? "rgba(34,197,94,0.06)" : "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.08))",
            color: exporting ? "rgba(34,197,94,0.4)" : "#4ade80",
            fontSize: "13px", fontWeight: 800, cursor: exporting ? "default" : "pointer",
            transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
            boxShadow: exporting ? "none" : "0 4px 20px rgba(34,197,94,0.12)",
          }}
          onMouseEnter={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,rgba(34,197,94,0.22),rgba(16,185,129,0.14))"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(34,197,94,0.22)"; } }}
          onMouseLeave={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.08))"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(34,197,94,0.12)"; } }}
        >
          <span style={{ fontSize: "18px" }}>{exporting ? "⏳" : "📊"}</span>
          {exporting ? "İndiriliyor..." : "Excel Raporu İndir"}
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="reports-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "16px", marginBottom: "32px", animationDelay: "0.05s" }}>
        <StatCard label="Toplam Kitap"       value={stats?.totalBooks     ?? "—"} icon="📚" color="#818cf8" bg="rgba(99,102,241,0.06)"   border="rgba(99,102,241,0.18)" />
        <StatCard label="Aktif Ödünçtekiler" value={stats?.activeBorrows  ?? "—"} icon="📤" color="#fbbf24" bg="rgba(245,158,11,0.06)"  border="rgba(245,158,11,0.18)" />
        <StatCard label="Geciken Kitaplar"   value={stats?.overdueBooks   ?? "—"} icon="⚠️" color="#f87171" bg="rgba(220,38,38,0.06)"   border="rgba(220,38,38,0.18)" />
        <StatCard label="En Popüler Kitap"   value={stats ? (stats.mostPopularBook || stats.topBook || "—") : "—"} icon="🏆" color="#34d399" bg="rgba(16,185,129,0.06)"  border="rgba(16,185,129,0.18)" />
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="reports-row" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", padding: "28px 32px", marginBottom: "28px", animationDelay: "0.1s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>Görselleştirme</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#e2e8f0" }}>Kategorilere Göre Kitap Dağılımı</div>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", fontSize: "11px", fontWeight: 700, color: "#a5b4fc" }}>
            Bar Chart
          </div>
        </div>

        {chartData.length === 0 ? (
          <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>
            Grafik verisi bulunamadı
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                axisLine={false} tickLine={false} allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Transactions Table ──────────────────────────────────────────────── */}
      <div className="reports-row" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", overflow: "hidden", animationDelay: "0.15s" }}>
        {/* Table header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>Detaylı Liste</div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#e2e8f0" }}>Tüm Ödünç İşlemleri
                <span style={{ marginLeft: "10px", padding: "2px 10px", borderRadius: "8px", background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: "12px", fontWeight: 700 }}>
                  {filtered.length}
                </span>
              </div>
            </div>

            {/* Search + filter */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: "14px", pointerEvents: "none" }}>🔍</span>
                <input
                  id="input-search"
                  type="text"
                  placeholder="Kitap veya kişi ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    paddingLeft: "36px", paddingRight: "14px", height: "38px",
                    borderRadius: "11px", border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)", color: "#e2e8f0",
                    fontSize: "12px", outline: "none", width: "210px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <select
                id="select-status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  height: "38px", padding: "0 14px", borderRadius: "11px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)", color: "#e2e8f0",
                  fontSize: "12px", fontWeight: 600, outline: "none", cursor: "pointer",
                }}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="Approved">Ödünçte</option>
                <option value="Pending">Bekliyor</option>
                <option value="Returned">İade Edildi</option>
                <option value="Overdue">Gecikmiş</option>
                <option value="Rejected">Reddedildi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {([
                  ["id",              "#"],
                  ["bookTitle",       "Kitap Adı"],
                  ["borrowerName",    "Ödünç Alan"],
                  ["transactionDate", "Ödünç Tarihi"],
                  ["returnDate",      "İade Tarihi"],
                  ["status",         "Durum"],
                ] as [keyof Transaction, string][]).map(([col, label]) => (
                  <th key={col} style={thStyle(col)} onClick={() => toggleSort(col)}>
                    {label}
                    {sortCol === col && (
                      <span style={{ marginLeft: "4px", color: "#6366f1" }}>
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "56px 0", color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>
                    Filtreye uygun kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} className="table-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                      #{t.id}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "#e2e8f0", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.bookTitle}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                      {t.borrowerName}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {fmtDate(t.transactionDate)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {fmtDate(t.returnDate)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div style={{ padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
              Toplam <strong style={{ color: "rgba(255,255,255,0.4)" }}>{transactions.length}</strong> kayıttan <strong style={{ color: "rgba(255,255,255,0.4)" }}>{filtered.length}</strong> gösteriliyor
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
