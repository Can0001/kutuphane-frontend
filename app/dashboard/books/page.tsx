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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { role: currentUserRole, userId: currentUserId } = useAuth();

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API}/Books/getall`);
      setBooks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, []);

  const filtered = books.filter((b) => {
    const s = search.toLowerCase();
    const matchSearch = b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || b.isbn.toLowerCase().includes(s);
    const matchFilter = filter === "all" || (filter === "available" && b.isAvailable) || (filter === "borrowed" && !b.isAvailable);
    return matchSearch && matchFilter;
  });

  const handleBorrow = async (id: number) => {
    try {
      const res = await axios.get(`${API}/Users/getall`);
      const allUsers = res.data;
      const students = allUsers.filter((u: any) => u.role && (u.role.toLowerCase() === "student" || u.role.toLowerCase() === "öğrenci" || u.role.toLowerCase() === "ogrenci"));
      const opts: any = {};
      students.forEach((s: any) => { opts[s.id] = `${s.firstName} ${s.lastName}`; });

      const { value: selectedId } = await Swal.fire({
        title: "Kitabı Ödünç Ver",
        input: "select", inputOptions: opts, inputPlaceholder: "Öğrenci seçiniz...",
        showCancelButton: true, confirmButtonText: "Onayla", cancelButtonText: "İptal",
        background: "#111827", color: "#fff", confirmButtonColor: "#6366f1",
        customClass: { popup: "swal-dark", input: "custom-swal-select" }
      });
      if (selectedId) {
        const student = students.find((s: any) => s.id == selectedId);
        await axios.post(`${API}/Books/borrow/${id}`, { userId: parseInt(selectedId), userName: `${student.firstName} ${student.lastName}` });
        fetchBooks();
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kitap ödünç verildi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
      }
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Talep gönderilemedi.");
      Swal.fire({ icon: "error", title: "Talep İletilemedi", text: msg, background: "#111827", color: "#fff" });
    }
  };

  const handleReturn = async (id: number) => {
    await axios.post(`${API}/Books/return/${id}`);
    fetchBooks();
    Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Kitap iade alındı", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
  };

  const handleRequestBorrow = async (id: number) => {
    try {
      if (!currentUserId) {
        Swal.fire({ icon: "error", title: "Hata", text: "Kullanıcı kimliği bulunamadı.", background: "#111827", color: "#fff" });
        return;
      }
      await axios.post(`${API}/BookTransactions/requestbook`, {
        userId: parseInt(currentUserId),
        bookId: id
      });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Talebiniz kütüphaneciye iletildi", showConfirmButton: false, timer: 2000, background: "#111827", color: "#fff" });
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || "Bilinmeyen bir hata oluştu.");
      Swal.fire({ icon: "error", title: "Talep İletilemedi", text: msg, background: "#111827", color: "#fff" });
    }
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
        .custom-swal-select { background: rgba(255,255,255,0.06)!important; border: 1px solid rgba(255,255,255,0.1)!important; border-radius: 12px!important; color: white!important; padding: 10px!important; }
        .custom-swal-select option { background: #111827!important; }
        .book-card:hover { transform: translateY(-4px); }
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
            {filtered.map((book) => (
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
                    background: book.isAvailable ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    border: book.isAvailable ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)",
                    color: book.isAvailable ? "#34d399" : "#fbbf24"
                  }}>{book.isAvailable ? "● Mevcut" : "● Ödünçte"}</span>
                </div>

                {/* Info */}
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 600, marginBottom: "12px" }}>{book.author}</div>

                  {!book.isAvailable && book.borrowedBy && currentUserRole !== "Student" && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: "rgba(251,191,36,0.5)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "2px" }}>OKUYUCU</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fde68a" }}>{book.borrowedBy}</div>
                      {book.borrowedDate && <div style={{ fontSize: "10px", color: "rgba(251,191,36,0.4)", marginTop: "2px" }}>{new Date(book.borrowedDate).toLocaleDateString("tr-TR")}</div>}
                    </div>
                  )}

                  {!book.isAvailable && currentUserRole === "Student" && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", marginBottom: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(251,191,36,0.8)" }}>Ödünçte (Mevcut Değil)</div>
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
                      <button onClick={() => book.isAvailable ? handleBorrow(book.id) : handleReturn(book.id)} style={{
                        flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer",
                        background: book.isAvailable ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(255,255,255,0.06)",
                        color: book.isAvailable ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s"
                      }}>{book.isAvailable ? "Ödünç Ver" : "İade Al"}</button>
                      <button onClick={() => router.push(`/dashboard/edit/${book.id}`)} style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}>✏️</button>
                      <button onClick={() => handleDelete(book.id, book.title)} style={{ width: "40px", height: "40px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.05)", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}>🗑️</button>
                    </div>
                  )}

                  {currentUserRole === "Student" && book.isAvailable && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleRequestBorrow(book.id)} style={{
                        flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "#fff",
                        fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", transition: "all 0.2s",
                        boxShadow: "0 8px 16px rgba(16,185,129,0.2)"
                      }}>Ödünç İste</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
