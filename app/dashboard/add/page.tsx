"use client";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function AddBook() {
  const [formData, setFormData] = useState({ title: "", author: "", isbn: "", pageCount: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("LibraryAuthToken");
      const data = new FormData();
      data.append("title", formData.title);
      data.append("author", formData.author);
      data.append("isbn", formData.isbn);
      data.append("pageCount", formData.pageCount);
      data.append("isAvailable", "true");
      data.append("status", "true");
      if (selectedFile) data.append("image", selectedFile);

      await axios.post("https://localhost:7069/api/Books/add", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      await Swal.fire({ title: "Başarılı", text: "Kitap ve kapak resmi kaydedildi!", icon: "success", confirmButtonColor: "#6366f1" });
      router.push("/dashboard");
    } catch (error) {
      Swal.fire({ title: "Hata", text: "Kayıt sırasında bir sorun oluştu.", icon: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-2xl">
        {/* Geri Butonu */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-xs font-black uppercase tracking-widest mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri Dön
        </button>

        <div className="bg-[#161b27] border border-white/5 rounded-3xl p-10">
          {/* Başlık */}
          <div className="mb-10 pb-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-lg shadow-indigo-500/30">
                📕
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Yeni Kitap Ekle</h1>
            </div>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] ml-12">Kütüphane Envanter Sistemi</p>
          </div>

          <form onSubmit={handleAddBook} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kapak Resmi */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-3">
                  Kapak Görseli
                </label>
                <label className="relative flex-1 min-h-64 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:border-indigo-500/50 transition-all">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" alt="Önizleme" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <p className="text-white text-xs font-black uppercase tracking-widest">Değiştir</p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">📸</div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Görsel Seç</p>
                      <p className="text-[9px] text-white/10">JPG, PNG, WEBP</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>
              </div>

              {/* Form Alanları */}
              <div className="flex flex-col justify-center space-y-4">
                {[
                  { key: "title", label: "Kitap Adı", type: "text" },
                  { key: "author", label: "Yazar", type: "text" },
                  { key: "isbn", label: "ISBN", type: "text" },
                  { key: "pageCount", label: "Sayfa Sayısı", type: "number" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 block">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : (
                  "Envantere Ekle"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}