"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBooks = async () => {
    try {
      const response = await axios.get("https://localhost:7069/api/Books/getall");
      setBooks(response.data);
    } catch (error) {
      console.error("API Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filtreleme
  const filteredBooks = books.filter((book: any) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(s) ||
      book.author.toLowerCase().includes(s) ||
      book.isbn.toLowerCase().includes(s) ||
      (book.borrowedBy && book.borrowedBy.toLowerCase().includes(s));
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && book.isAvailable) ||
      (statusFilter === "borrowed" && !book.isAvailable);
    
    return matchesSearch && matchesStatus;
  });

  const availableCount = books.filter((b: any) => b.isAvailable).length;
  const borrowedCount = books.filter((b: any) => !b.isAvailable).length;

  const handleBorrow = async (id: number) => {
    try {
      const res = await axios.get("https://localhost:7069/api/Users/getstudents");
      const students = res.data;

      const studentOptions: any = {};
      students.forEach((s: any) => {
        studentOptions[s.id] = `${s.firstName} ${s.lastName} — [No: ${s.id}]`;
      });

      const { value: selectedId } = await Swal.fire({
        title: '<span style="color: #fff; font-weight: 900; text-transform: uppercase;">Kitabı Ödünç Ver</span>',
        html: '<p style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Teslim edilecek öğrenciyi seçiniz</p>',
        input: "select",
        inputOptions: studentOptions,
        inputPlaceholder: "Öğrenci Listesini Aç...",
        showCancelButton: true,
        confirmButtonText: "ONAYLA",
        cancelButtonText: "VAZGEÇ",
        background: "#161b27",
        color: "#fff",
        confirmButtonColor: "#6366f1", 
        cancelButtonColor: "rgba(255,255,255,0.05)",
        customClass: {
          popup: "rounded-[2.5rem] border border-white/5 shadow-2xl shadow-indigo-500/10",
          input: "custom-swal-select",
          confirmButton: "rounded-xl px-8 py-3 text-[11px] font-black uppercase tracking-widest",
          cancelButton: "rounded-xl px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white/30",
        },
      });

      if (selectedId) {
        const student = students.find((s: any) => s.id == selectedId);
        await axios.post(`https://localhost:7069/api/Books/borrow/${id}`, {
          userId: parseInt(selectedId),
          userName: `${student.firstName} ${student.lastName}`,
        });
        fetchBooks();
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kitap Teslim Edildi", showConfirmButton: false, timer: 1500, background: "#161b27", color: "#fff" });
      }
    } catch (e) {
      Swal.fire({ title: "Hata", text: "Öğrenci listesi alınamadı.", icon: "error", background: "#161b27", color: "#fff" });
    }
  };

  const handleReturn = async (id: number) => {
    await axios.post(`https://localhost:7069/api/Books/return/${id}`);
    fetchBooks();
    Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Kitap İade Alındı", showConfirmButton: false, timer: 1500, background: "#161b27", color: "#fff" });
  };

  const handleDelete = async (id: number, title: string) => {
    const confirm = await Swal.fire({
      title: "Emin misiniz?",
      text: `"${title}" kalıcı olarak silinecek.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      background: "#161b27",
      color: "#fff"
    });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`https://localhost:7069/api/Books/delete/${id}`);
        fetchBooks();
        Swal.fire({ title: "Silindi", icon: "success", background: "#161b27", color: "#fff" });
      } catch (err: any) {
        Swal.fire({ title: "Engellendi", text: err.response?.data?.message || "Hata!", icon: "error", background: "#161b27", color: "#fff" });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white font-sans antialiased">
      
      {}
      <style jsx global>{`
        .custom-swal-select {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 1.25rem !important;
          color: white !important;
          font-size: 14px !important;
          padding: 12px !important;
          margin: 20px auto !important;
          width: 90% !important;
        }
        .custom-swal-select option {
          background-color: #161b27 !important;
          color: white !important;
        }
      `}</style>

      {}
      <aside className="hidden lg:flex flex-col w-72 bg-[#161b27] border-r border-white/5 px-8 py-10 shrink-0">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">📚</div>
            <span className="font-black text-sm tracking-widest uppercase">Kütüphane</span>
          </div>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] ml-13">Yönetim Sistemi</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="rounded-3xl bg-white/5 border border-white/5 p-6 transition-all hover:bg-white/10">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Toplam</p>
            <p className="text-4xl font-black">{books.length}</p>
          </div>
          <div className="rounded-3xl bg-emerald-500/5 border border-emerald-500/10 p-6">
            <p className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest mb-1">Mevcut</p>
            <p className="text-4xl font-black text-emerald-400">{availableCount}</p>
          </div>
          <div className="rounded-3xl bg-amber-500/5 border border-amber-500/10 p-6">
            <p className="text-[10px] font-bold text-amber-400/50 uppercase tracking-widest mb-1">Ödünçte</p>
            <p className="text-4xl font-black text-amber-400">{borrowedCount}</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => router.push("/dashboard/add")} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20">
            ＋ Yeni Kitap Ekle
          </button>
        </nav>

        <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="mt-auto flex items-center gap-3 px-6 py-4 rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-widest">
          ↩ Çıkış Yap
        </button>
      </aside>

      {}
      <main className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
        
        {}
        <header className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-2xl z-20">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Envanter Paneli</h1>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em] mt-1">{filteredBooks.length} eser gösteriliyor</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <input 
                placeholder="Hızlı arama (İsim, ISBN, Öğrenci)..." 
                className="w-80 bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-3.5 text-xs outline-none focus:border-indigo-500/50 transition-all pl-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-5 top-4 opacity-20">🔍</span>
            </div>

            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5">
              {[{v:"all", l:"Tümü"}, {v:"available", l:"Mevcut"}, {v:"borrowed", l:"Ödünçte"}].map(opt => (
                <button 
                  key={opt.v}
                  onClick={() => setStatusFilter(opt.v)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === opt.v ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "text-white/20 hover:text-white/50"}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </header>

        {}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
              <div className="w-12 h-12 border-4 border-t-white rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Sistem Yükleniyor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {filteredBooks.map((book: any) => (
                <div key={book.id} className="group bg-[#161b27] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/30 transition-all duration-500 flex flex-col">
                  
                  {}
                  <div className="relative h-56 bg-[#1e2435] overflow-hidden">
                    {book.imagePath ? (
                      <img src={`https://localhost:7069${book.imagePath}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={book.title} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/5 uppercase select-none">{book.title[0]}</div>
                    )}
                    <div className="absolute top-5 left-6">
                      <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${book.isAvailable ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                        {book.isAvailable ? "• Mevcut" : "• Ödünçte"}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-lg font-black leading-tight uppercase truncate mb-1">{book.title}</h3>
                    <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-6">{book.author}</p>

                    {}
                    {!book.isAvailable && book.borrowedBy && (
                      <div className="mb-6 p-5 bg-amber-500/5 border border-amber-500/10 rounded-3xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase text-amber-500/50 tracking-widest">Okuyucu</span>
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full shadow-inner">
                            #{book.borrowerId}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-amber-200 uppercase italic truncate">{book.borrowedBy}</p>
                        <p className="text-[10px] font-mono text-amber-500/30 mt-2">📅 {new Date(book.borrowedDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-8 mt-auto">
                      <div className="bg-white/3 rounded-2xl p-4 border border-white/5">
                        <p className="text-[8px] font-black text-white/20 uppercase mb-1">ISBN</p>
                        <p className="text-[10px] font-mono font-bold text-white/60 truncate">{book.isbn}</p>
                      </div>
                      <div className="bg-white/3 rounded-2xl p-4 border border-white/5 text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase mb-1">SAYFA</p>
                        <p className="text-[10px] font-mono font-bold text-white/60">{book.pageCount}</p>
                      </div>
                    </div>

                    {}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => book.isAvailable ? handleBorrow(book.id) : handleReturn(book.id)}
                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${book.isAvailable ? "bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20" : "bg-white/5 hover:bg-white/10 text-white/50"}`}
                      >
                        {book.isAvailable ? "Ödünç Ver" : "İade Al"}
                      </button>
                      <button onClick={() => router.push(`/dashboard/edit/${book.id}`)} className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5" title="Düzenle">
                        📝
                      </button>
                      <button onClick={() => handleDelete(book.id, book.title)} className="p-3.5 rounded-2xl bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all border border-white/5" title="Sil">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}