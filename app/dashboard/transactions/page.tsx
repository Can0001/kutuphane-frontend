"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API = "https://localhost:7069/api";

interface Transaction {
  bookId: number;
  bookTitle: string;
  studentId: number;
  studentName: string;
  borrowedDate: string;
  isReturned: boolean;
  transactionId?: number;
}

interface Book { id: number; title: string; isAvailable: boolean; }
interface Student { id: number; firstName: string; lastName: string; }

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

/* ── Borrow Modal ─────────────────────────────────────────── */
function BorrowModal({ books, students, onClose, onDone }: {
  books: Book[]; students: Student[];
  onClose: () => void; onDone: () => void;
}) {
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableBooks = books.filter((b) => b.isAvailable);

  const handleSubmit = async () => {
    if (!selectedBook || !selectedStudent) {
      Swal.fire({ icon: "warning", title: "Seçim yapınız", text: "Kitap ve öğrenci seçmelisiniz.", background: "#111827", color: "#fff" });
      return;
    }
    setSubmitting(true);
    try {
      const student = students.find((s) => s.id === parseInt(selectedStudent));
      await axios.post(`${API}/Books/borrow/${selectedBook}`, {
        userId: parseInt(selectedStudent),
        userName: `${student?.firstName} ${student?.lastName}`,
      });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kitap ödünç verildi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
      onDone();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Hata", text: err.response?.data?.message || "İşlem başarısız.", background: "#111827", color: "#fff" });
    } finally { setSubmitting(false); }
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "460px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📤</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9" }}>Yeni Ödünç Kaydı</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Ödünç & İade</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Book Select */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>Kitap Seç</label>
            <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} style={selectStyle}>
              <option value="">— Mevcut kitap seçiniz —</option>
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            {availableBooks.length === 0 && (
              <p style={{ fontSize: "11px", color: "rgba(248,113,113,0.7)", marginTop: "6px" }}>Mevcut kitap bulunmuyor.</p>
            )}
          </div>

          {/* Student Select */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>Öğrenci Seç</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={selectStyle}>
              <option value="">— Öğrenci seçiniz —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Vazgeç</button>
          <button onClick={handleSubmit} disabled={submitting || availableBooks.length === 0} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 8px 20px rgba(59,130,246,0.35)" }}>
            {submitting ? (<><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Kaydediliyor...</>) : "📤 Ödünç Ver"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} select option{background:#111827}`}</style>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [booksRes, usersRes, pendingRes, allTxnsRes] = await Promise.allSettled([
        axios.get(`${API}/Books/getall`),
        axios.get(`${API}/Users/getall`),
        axios.get(`${API}/BookTransactions/getpending`),
        axios.get(`${API}/BookTransactions/getall`),
      ]);
      const booksData: Book[] = booksRes.status === "fulfilled" ? booksRes.value.data : [];
      const usersData: any[] = usersRes.status === "fulfilled" ? usersRes.value.data : [];
      const studentsData: Student[] = usersData.filter((u: any) => u.role && (u.role.toLowerCase() === "student" || u.role.toLowerCase() === "öğrenci" || u.role.toLowerCase() === "ogrenci"));
      const pendingData = pendingRes.status === "fulfilled" ? pendingRes.value.data : [];
      const allTxnsData = allTxnsRes.status === "fulfilled" ? allTxnsRes.value.data : [];
      
      setBooks(booksData);
      setStudents(studentsData);
      setPendingRequests(pendingData);

      // Build transaction list from BookTransactions (Status === 'Approved')
      const txns: Transaction[] = allTxnsData
        .filter((t: any) => t.status === "Approved")
        .map((t: any) => {
          const book = booksData.find(b => b.id === t.bookId);
          const user = usersData.find(u => u.id === t.userId);
          return {
            transactionId: t.id,
            bookId: t.bookId,
            bookTitle: book ? book.title : `Kitap #${t.bookId}`,
            studentId: t.userId,
            studentName: user ? `${user.firstName} ${user.lastName}` : `Kullanıcı #${t.userId}`,
            borrowedDate: t.transactionDate || t.requestDate || new Date().toISOString(),
            isReturned: false,
          };
        });
      setTransactions(txns);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.bookTitle.toLowerCase().includes(q) || t.studentName.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "active" && !t.isReturned) || (filter === "returned" && t.isReturned);
    return matchSearch && matchFilter;
  });

  const handleReturn = async (t: Transaction) => {
    const c = await Swal.fire({
      title: "İade Al", text: `"${t.bookTitle}" → ${t.studentName} kitabı iade alınacak.`, icon: "question",
      showCancelButton: true, confirmButtonText: "İade Al", cancelButtonText: "Vazgeç",
      confirmButtonColor: "#6366f1", background: "#111827", color: "#fff",
    });
    if (!c.isConfirmed) return;
    try {
      await axios.post(`${API}/Books/return/${t.bookId}`);
      fetchAll();
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Kitap iade alındı", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
    } catch { Swal.fire({ icon: "error", title: "Hata", background: "#111827", color: "#fff" }); }
  };

  const handleApprove = async (id: number) => {
    try {
      await axios.post(`${API}/BookTransactions/approve?id=${id}`);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Talep onaylandı", showConfirmButton: false, timer: 1500, background: "#111827", color: "#fff" });
      fetchAll();
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Onaylanamadı");
      Swal.fire({ icon: "error", title: "Hata", text: msg, background: "#111827", color: "#fff" });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axios.post(`${API}/BookTransactions/reject?id=${id}`);
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Talep reddedildi", showConfirmButton: false, timer: 1500, background: "#111827", color: "#fff" });
      fetchAll();
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Reddedilemedi");
      Swal.fire({ icon: "error", title: "Hata", text: msg, background: "#111827", color: "#fff" });
    }
  };

  const activeCount = transactions.filter((t) => !t.isReturned).length;
  const overdueCount = transactions.filter((t) => !t.isReturned && daysSince(t.borrowedDate) > 14).length;

  return (
    <div style={{ minHeight: "100%", background: "#080c18", display: "flex", flexDirection: "column" }}>
      {showModal && <BorrowModal books={books} students={students} onClose={() => setShowModal(false)} onDone={() => { setShowModal(false); fetchAll(); }} />}

      {/* Header */}
      <header style={{ padding: "28px 36px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "4px" }}>Ödünç Takibi</div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#fff", margin: 0 }}>Ödünç & İade</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#60a5fa" }}>{transactions.length}</div>
            <div style={{ fontSize: "9px", color: "rgba(96,165,250,0.45)", fontWeight: 700, letterSpacing: "0.1em" }}>TOPLAM</div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fbbf24" }}>{activeCount}</div>
            <div style={{ fontSize: "9px", color: "rgba(251,191,36,0.45)", fontWeight: 700, letterSpacing: "0.1em" }}>AKTİF</div>
          </div>
          {overdueCount > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#f87171" }}>{overdueCount}</div>
              <div style={{ fontSize: "9px", color: "rgba(248,113,113,0.45)", fontWeight: 700, letterSpacing: "0.1em" }}>GECİKMİŞ</div>
            </div>
          )}
          <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em", boxShadow: "0 8px 20px rgba(59,130,246,0.3)", whiteSpace: "nowrap" }}>
            + Ödünç Ver
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ padding: "14px 36px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kitap adı veya öğrenci ara..."
            style={{ width: "100%", padding: "10px 16px 10px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", opacity: 0.25 }}>🔍</span>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "4px", gap: "2px" }}>
          {[{ v: "all", l: "Tümü" }, { v: "active", l: "Aktif" }, { v: "returned", l: "İade" }].map((o) => (
            <button key={o.v} onClick={() => setFilter(o.v)} style={{ padding: "6px 14px", borderRadius: "9px", border: "none", cursor: "pointer", background: filter === o.v ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent", color: filter === o.v ? "#fff" : "rgba(255,255,255,0.28)", fontSize: "11px", fontWeight: 700, transition: "all 0.18s" }}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* Pending Requests */}
      {!loading && pendingRequests.length > 0 && (
        <div style={{ padding: "20px 36px 0" }}>
          <h2 style={{ fontSize: "12px", color: "#fbbf24", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800 }}>Onay Bekleyen Talepler ({pendingRequests.length})</h2>
          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "16px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
                  {["Kitap", "Öğrenci", "Talep Tarihi", "İşlem"].map((h, i) => (
                    <th key={h} style={{ padding: "13px 18px", textAlign: i === 3 ? "right" : "left", fontSize: "9px", color: "rgba(251,191,36,0.8)", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req, idx) => (
                  <tr key={req.id} style={{ borderBottom: "1px solid rgba(245,158,11,0.1)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}>
                    <td style={{ padding: "13px 18px", fontSize: "13px", fontWeight: 700, color: "#fde68a" }}>{req.bookTitle || `Kitap #${req.bookId}`}</td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{req.userName || `Kullanıcı #${req.userId}`}</td>
                    <td style={{ padding: "13px 18px", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                      {req.requestDate ? new Date(req.requestDate).toLocaleDateString("tr-TR") : "Bilinmiyor"}
                    </td>
                    <td style={{ padding: "13px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleApprove(req.id)} style={{ padding: "6px 14px", borderRadius: "9px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>✅ Onayla</button>
                        <button onClick={() => handleReject(req.id)} style={{ padding: "6px 14px", borderRadius: "9px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>❌ Reddet</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 36px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "38px", height: "38px", border: "3px solid rgba(59,130,246,0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>📋</div>
            <div style={{ color: "rgba(255,255,255,0.12)", fontSize: "14px" }}>{filter === "active" ? "Aktif ödünç işlemi bulunmuyor" : "Kayıt bulunamadı"}</div>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Kitap", "Öğrenci", "Ödünç Tarihi", "Süre", "Durum", "İşlem"].map((h, i) => (
                    <th key={h} style={{ padding: "13px 18px", textAlign: i === 5 ? "right" : "left", fontSize: "9px", color: "rgba(255,255,255,0.22)", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => {
                  const days = daysSince(t.borrowedDate);
                  const overdue = !t.isReturned && days > 14;
                  return (
                    <tr key={`${t.bookId}-${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}>
                      <td style={{ padding: "13px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>📚</div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{t.bookTitle}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 18px", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>{t.studentName}</td>
                      <td style={{ padding: "13px 18px", fontSize: "12px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                        {new Date(t.borrowedDate).toLocaleDateString("tr-TR")}
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", background: overdue ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)", color: overdue ? "#f87171" : "rgba(255,255,255,0.35)" }}>
                          {days} gün
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        {t.isReturned ? (
                          <span style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>● İade Edildi</span>
                        ) : overdue ? (
                          <span style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>● Gecikmiş</span>
                        ) : (
                          <span style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}>● Ödünçte</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        {!t.isReturned && (
                          <button onClick={() => handleReturn(t)} style={{ padding: "6px 15px", borderRadius: "9px", border: "1px solid rgba(99,102,241,0.28)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                            📥 İade Al
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
