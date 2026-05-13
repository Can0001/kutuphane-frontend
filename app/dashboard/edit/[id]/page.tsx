"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter, useParams } from "next/navigation";

export default function EditBook() {
  const [formData, setFormData] = useState({ title: "", author: "", isbn: "", pageCount: "", imagePath: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`https://localhost:7069/api/Books/getbyid/${params.id}`);
        const data = response.data;
        setFormData({ title: data.title, author: data.author, isbn: data.isbn, pageCount: data.pageCount.toString(), imagePath: data.imagePath });
        if (data.imagePath) setPreviewUrl(`https://localhost:7069${data.imagePath}`);
      } catch {
        Swal.fire("Hata", "Kitap bilgileri çekilemedi.", "error");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchBook();
  }, [params.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("Id", params.id as string);
      data.append("Title", formData.title);
      data.append("Author", formData.author);
      data.append("ISBN", formData.isbn);
      data.append("PageCount", formData.pageCount);
      if (selectedFile) data.append("Image", selectedFile);

      await axios.put("https://localhost:7069/api/Books/update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Swal.fire({ title: "Güncellendi!", text: "Kitap bilgileri başarıyla güncellendi.", icon: "success", confirmButtonColor: "#6366f1" });
      router.push("/dashboard");
    } catch {
      Swal.fire("Hata", "Güncelleme sırasında bir sorun oluştu.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-3xl">
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

        <div className="bg-[#161b27] border border-white/5 rounded-3xl p-8 sm:p-12">
          {/* Başlık */}
          <div className="mb-10 pb-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-lg shadow-indigo-500/30">
                ✏️
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Kitap Düzenle</h1>
            </div>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] ml-12">
              ID #{params.id} · Envanter Revizyonu
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Kapak Resmi */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-white/40 tracking-widest mb-3">
                  Kapak Görseli
                </label>
                <label className="relative flex-1 min-h-72 border border-white/10 bg-white/5 rounded-2xl overflow-hidden cursor-pointer group hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" alt="Kapak" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl">🔄</span>
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">Görseli Değiştir</p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">🖼️</div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Görsel Seç</p>
                      <p className="text-[9px] text-white/10">JPG, PNG, WEBP</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>
              </div>

              {/* Form Alanları */}
              <div className="flex flex-col justify-center space-y-5">
                {[
                  { key: "title", label: "Kitap Adı", type: "text" },
                  { key: "author", label: "Yazar", type: "text" },
                  { key: "isbn", label: "ISBN", type: "text" },
                  { key: "pageCount", label: "Sayfa Sayısı", type: "number" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-bold uppercase text-white/40 tracking-widest mb-3 block">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/15 rounded-xl px-5 py-4 text-sm outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all duration-300"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-4 pt-8 border-t border-white/5 mt-8">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 rounded-2xl border border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Güncelleniyor...
                  </span>
                ) : (
                  "Değişiklikleri Kaydet"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}