"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://localhost:7069/api";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  pageCount: number;
  isAvailable: boolean;
  borrowedBy?: string;
  borrowerId?: number;
  borrowedDate?: string;
  imagePath?: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [approvedBookIds, setApprovedBookIds] = useState<Set<number>>(new Set());
  const [myBookStatus, setMyBookStatus] = useState<Map<number, string>>(new Map());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { role: currentUserRole, userId: currentUserId } = useAuth();

  const fetchBooks = async () => {
    try {
      const [booksRes, txnsRes] = await Promise.allSettled([
        axios.get(`${API}/Books/getall`),
        axios.get(`${API}/BookTransactions/getall`),
      ]);

      const booksData: Book[] = booksRes.status === "fulfilled" ? booksRes.value.data : [];
      const txnsData: any[] = txnsRes.status === "fulfilled" ? txnsRes.value.data : [];

      // Sadece Status === "Approved" veya "Overdue" olan kayıtlar kitabın ödünçte olduğunu gösterir.
      // Returned veya Rejected kayıtlar kitabı "ödünçte" YAPMAZ — rafa dönmüştür.
      const approvedIds = new Set<number>(
        txnsData
          .filter((t: any) => t.status === "Approved" || t.status === "Overdue")
          .map((t: any) => t.bookId)
      );
      setApprovedBookIds(approvedIds);

      // Öğrencinin kitap başına son durumu — status bazlı buton kontrolü için
      if (currentUserId) {
        const statusMap = new Map<number, string>();
        txnsData
          .filter(
            (t: any) =>
              String(t.userId) === String(currentUserId) &&
              (t.status === "Pending" || t.status === "Approved" || t.status === "Overdue")
          )
          .forEach((t: any) => {
            // Her kitap için en yüksek öncelikli status’u tut
            const existing = statusMap.get(t.bookId);
            const priority: Record<string, number> = { Pending: 1, Approved: 2, Overdue: 3 };
            if (!existing || (priority[t.status] || 0) > (priority[existing] || 0)) {
              statusMap.set(t.bookId, t.status);
            }
          });
        setMyBookStatus(statusMap);
      }

      // Kitapların gerçek durumunu hesapla:
      // Bir kitap "Ödünçte" olur SADECE aktif Approved kaydı varsa.
      // Backend'in isAvailable alanı güvenilmez olabilir, transaction'a bakıyoruz.
      const enrichedBooks = booksData.map((b: Book) => ({
        ...b,
        isAvailable: !approvedIds.has(b.id),
      }));

      setBooks(enrichedBooks);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, [currentUserId]);

  const filtered = books.filter((b) => {
    const s = search.toLowerCase();
    const matchSearch = b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || b.isbn.toLowerCase().includes(s);
    const matchFilter = filter === "all" || (filter === "available" && b.isAvailable) || (filter === "borrowed" && !b.isAvailable);
    return matchSearch && matchFilter;
  });

  /* ── Borrow Modal State ────────────────────────────── */
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowBookId, setBorrowBookId] = useState<number | null>(null);
  const [borrowStudents, setBorrowStudents] = useState<any[]>([]);
  const [borrowSelectedStudent, setBorrowSelectedStudent] = useState("");
  const [borrowDueDate, setBorrowDueDate] = useState("");
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);

  const handleOpenBorrowModal = async (bookId: number) => {
    try {
      const res = await axios.get(`${API}/Users/getall`);
      const allUsers = res.data;
      const students = allUsers.filter((u: any) => u.role && (u.role.toLowerCase() === "student" || u.role.toLowerCase() === "öğrenci" || u.role.toLowerCase() === "ogrenci"));
      setBorrowStudents(students);
      setBorrowBookId(bookId);
      setBorrowSelectedStudent("");
      // Varsayılan: 15 gün sonra
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 15);
      setBorrowDueDate(defaultDue.toISOString().split("T")[0]);
      setBorrowModalOpen(true);
    } catch {
      Swal.fire({ icon: "error", title: "Hata", text: "Öğrenci listesi yüklenemedi.", background: "#111827", color: "#fff" });
    }
  };

  const handleBorrowSubmit = async () => {
    if (!borrowSelectedStudent || !borrowBookId) {
      Swal.fire({ icon: "warning", title: "Eksik", text: "Öğrenci seçmelisiniz.", background: "#111827", color: "#fff" });
      return;
    }
    setBorrowSubmitting(true);
    try {
      await axios.post(`${API}/BookTransactions/assignbook`, {
        bookId: borrowBookId,
        userId: parseInt(borrowSelectedStudent),
        dueDate: new Date(borrowDueDate).toISOString(),
      });
      setBorrowModalOpen(false);
      fetchBooks();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kitap ödünç verildi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Talep gönderilemedi.");
      Swal.fire({ icon: "error", title: "Talep İletilemedi", text: msg, background: "#111827", color: "#fff" });
    } finally { setBorrowSubmitting(false); }
  };

  const handleReturn = async (bookId: number) => {
    try {
      await axios.post(`${API}/BookTransactions/returnbybook?bookId=${bookId}`);
      fetchBooks();
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Kitap iade alındı", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "İade işlemi başarısız.");
      Swal.fire({ icon: "error", title: "İade Hatası", text: msg, background: "#111827", color: "#fff" });
    }
  };

  /* ── Request Borrow Modal State (Student) ──────────── */
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestBookId, setRequestBookId] = useState<number | null>(null);
  const [requestBookTitle, setRequestBookTitle] = useState("");
  const [requestDueDate, setRequestDueDate] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const handleOpenRequestModal = (book: Book) => {
    setRequestBookId(book.id);
    setRequestBookTitle(book.title);
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 15);
    setRequestDueDate(defaultDue.toISOString().split("T")[0]);
    setRequestModalOpen(true);
  };

  const handleRequestSubmit = async () => {
    if (!currentUserId || !requestBookId) return;
    setRequestSubmitting(true);
    try {
      await axios.post(`${API}/BookTransactions/requestbook`, {
        userId: parseInt(currentUserId),
        bookId: requestBookId,
        dueDate: new Date(requestDueDate).toISOString(),
      });
      setRequestModalOpen(false);
      fetchBooks();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Talebiniz kütüphaneciye iletildi", showConfirmButton: false, timer: 2000, background: "#111827", color: "#fff" });
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Bilinmeyen bir hata oluştu.");
      Swal.fire({ icon: "error", title: "Talep İletilemedi", text: msg, background: "#111827", color: "#fff" });
    } finally { setRequestSubmitting(false); }
  };

  const handleDelete = async (id: number, title: string) => {
    const c = await Swal.fire({
      title: "Emin misiniz?", text: `"${title}" kalıcı olarak silinecek.`, icon: "warning",
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonText: "Vazgeç",
      background: "#111827", color: "#fff"
    });
    if (c.isConfirmed) {
      try {
        await axios.delete(`${API}/Books/delete/${id}`);
        fetchBooks();
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kitap silindi", showConfirmButton: false, timer: 1500, background: "#111827", color: "#fff" });
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "Silinemedi", text: err.response?.data?.message, background: "#111827", color: "#fff" });
      }
    }
  };

  return (
    <div style={{ minHeight: "100%", background: "#0a0e1a", display: "flex", flexDirection: "column" }}>
      <style>{`
        .book-card:hover { transform: translateY(-4px); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      `}</style>

      {/* Header */}
      <header style={{ padding: "28px 36px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "4px" }}>{filtered.length} eser listeleniyor</div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>Kitap Envanteri</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kitap, yazar, ISBN ara..."
              style={{ width: "280px", padding: "10px 16px 10px 40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none" }} />
            <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", opacity: 0.3 }}>🔍</span>
          </div>
          {/* Filter */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {[{ v: "all", l: "Tümü" }, { v: "available", l: "Mevcut" }, { v: "borrowed", l: "Ödünçte" }].map(o => (
              <button key={o.v} onClick={() => setFilter(o.v)} style={{
                padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                background: filter === o.v ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent",
                color: filter === o.v ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", transition: "all 0.2s"
              }}>{o.l}</button>
            ))}
          </div>
          {/* Add button */}
          {currentUserRole !== "Student" && (
            <button onClick={() => router.push("/dashboard/add")} style={{
              padding: "10px 20px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff",
              fontSize: "12px", fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)"
            }}>+ Kitap Ekle</button>
          )}
        </div>
      </header>

      {/* Grid */}
      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "rgba(255,255,255,0.2)", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Yükleniyor</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Kitap bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "20px" }}>
            {filtered.map((book) => {
              const isReallyAvailable = book.isAvailable;
              const myStatus = myBookStatus.get(book.id); // undefined | 'Pending' | 'Approved' | 'Overdue'

              return (
              <div key={book.id} className="book-card" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px", overflow: "hidden", transition: "all 0.3s", display: "flex", flexDirection: "column"
              }}>
                {/* Cover */}
                <div style={{ height: "180px", background: "linear-gradient(135deg, #1e2435, #151b2c)", position: "relative", overflow: "hidden" }}>
                  {book.imagePath ? (
                    <img src={`${API.replace("/api", "")}${book.imagePath}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={book.title} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "72px", fontWeight: 900, color: "rgba(255,255,255,0.04)", textTransform: "uppercase" }}>
                      {book.title[0]}
                    </div>
                  )}
                  <span style={{
                    position: "absolute", top: "12px", left: "12px",
                    padding: "5px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 800,
                    letterSpacing: "0.08em", backdropFilter: "blur(8px)",
                    background: isReallyAvailable ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: isReallyAvailable ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                    color: isReallyAvailable ? "#34d399" : "#f87171"
                  }}>{isReallyAvailable ? "● Mevcut" : "● Ödünçte"}</span>
                </div>

                {/* Info */}
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 600, marginBottom: "12px" }}>{book.author}</div>

                  {!isReallyAvailable && book.borrowedBy && currentUserRole !== "Student" && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: "rgba(251,191,36,0.5)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "2px" }}>OKUYUCU</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fde68a" }}>{book.borrowedBy}</div>
                      {book.borrowedDate && <div style={{ fontSize: "10px", color: "rgba(251,191,36,0.4)", marginTop: "2px" }}>{new Date(book.borrowedDate).toLocaleDateString("tr-TR")}</div>}
                    </div>
                  )}

                  {!isReallyAvailable && currentUserRole === "Student" && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", marginBottom: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(248,113,113,0.8)" }}>Ödünçte (Mevcut Değil)</div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "auto", marginBottom: "14px" }}>
                    <div style={{ padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: "2px" }}>ISBN</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.isbn}</div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: "2px" }}>SAYFA</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{book.pageCount}</div>
                    </div>
                  </div>

                  {currentUserRole !== "Student" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => isReallyAvailable ? handleOpenBorrowModal(book.id) : handleReturn(book.id)} style={{
                        flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer",
                        background: isReallyAvailable ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(255,255,255,0.06)",
                        color: isReallyAvailable ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s"
                      }}>{isReallyAvailable ? "Ödünç Ver" : "İade Al"}</button>
                      <button onClick={() => router.push(`/dashboard/edit/${book.id}`)} style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}>✏️</button>
                      <button onClick={() => handleDelete(book.id, book.title)} style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.05)", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}>🗑️</button>
                    </div>
                  )}

                  {currentUserRole === "Student" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      {myStatus === "Pending" ? (
                        <button disabled style={{
                          flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.2)",
                          cursor: "not-allowed",
                          background: "rgba(245,158,11,0.08)",
                          color: "rgba(251,191,36,0.6)",
                          fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s",
                          opacity: 0.7,
                        }}>⏳ Onay Bekliyor</button>
                      ) : myStatus === "Approved" || myStatus === "Overdue" ? (
                        <button disabled style={{
                          flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)",
                          cursor: "not-allowed",
                          background: "rgba(16,185,129,0.08)",
                          color: "rgba(52,211,153,0.6)",
                          fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s",
                          opacity: 0.7,
                        }}>📖 Şu An Sizde</button>
                      ) : isReallyAvailable ? (
                        <button onClick={() => handleOpenRequestModal(book)} style={{
                          flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer",
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          color: "#fff",
                          fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s",
                          boxShadow: "0 8px 16px rgba(16,185,129,0.2)"
                        }}>Ödünç İste</button>
                      ) : (
                        <button disabled style={{
                          flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.12)",
                          cursor: "not-allowed",
                          background: "rgba(239,68,68,0.05)",
                          color: "rgba(248,113,113,0.5)",
                          fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s",
                          opacity: 0.6,
                        }}>Ödünçte (Mevcut Değil)</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Borrow Modal ──────────────────────────────────── */}
      {borrowModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => e.target === e.currentTarget && setBorrowModalOpen(false)}
        >
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "440px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📤</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9" }}>Kitabı Ödünç Ver</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Kitap Envanteri</div>
              </div>
              <button onClick={() => setBorrowModalOpen(false)} style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Student Select */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>Öğrenci Seç</label>
                <select
                  value={borrowSelectedStudent}
                  onChange={(e) => setBorrowSelectedStudent(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="">— Öğrenci seçiniz —</option>
                  {borrowStudents.map((s: any) => (
                    <option key={s.id} value={s.id} style={{ background: "#111827" }}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>Son Teslim Tarihi</label>
                <input
                  type="date"
                  value={borrowDueDate}
                  onChange={(e) => setBorrowDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                />
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", marginTop: "4px" }}>Varsayılan: Bugünden 15 gün sonra</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setBorrowModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Vazgeç</button>
              <button onClick={handleBorrowSubmit} disabled={borrowSubmitting} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: borrowSubmitting ? "not-allowed" : "pointer", opacity: borrowSubmitting ? 0.6 : 1, boxShadow: "0 8px 20px rgba(99,102,241,0.35)" }}>
                {borrowSubmitting ? "Kaydediliyor..." : "📤 Ödünç Ver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Request Modal ─────────────────────────── */}
      {requestModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => e.target === e.currentTarget && setRequestModalOpen(false)}
        >
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "420px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📖</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9" }}>Ödünç Alma Talebi</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Kitap İsteme</div>
              </div>
              <button onClick={() => setRequestModalOpen(false)} style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Book Info */}
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)", marginBottom: "20px" }}>
              <div style={{ fontSize: "9px", color: "rgba(52,211,153,0.5)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>Seçilen Kitap</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#a7f3d0" }}>{requestBookTitle}</div>
            </div>

            {/* Date Picker */}
            <div style={{ marginBottom: "6px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>İade Edeceğiniz Tarih</label>
              <input
                type="date"
                value={requestDueDate}
                onChange={(e) => setRequestDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
              />
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", marginTop: "4px" }}>Varsayılan: Bugünden 15 gün sonra</div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setRequestModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Vazgeç</button>
              <button onClick={handleRequestSubmit} disabled={requestSubmitting} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: requestSubmitting ? "not-allowed" : "pointer", opacity: requestSubmitting ? 0.6 : 1, boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}>
                {requestSubmitting ? "Gönderiliyor..." : "📩 Talebi Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
