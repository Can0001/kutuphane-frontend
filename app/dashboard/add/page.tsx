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
    <div style={{ minHeight: "100%", background: "#080c18", padding: "36px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "800px" }}>
        
        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", marginBottom: "32px", transition: "color 0.2s"
        }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
          <span style={{ fontSize: "16px" }}>‹</span> Geri Dön
        </button>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 8px 16px rgba(99,102,241,0.3)" }}>
                📕
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Yeni Kitap Ekle</h1>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 0 64px" }}>Kütüphane Envanter Sistemi</p>
          </div>

          <form onSubmit={handleAddBook} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
              
              {/* Kapak Resmi */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: "12px" }}>Kapak Görseli</label>
                <label style={{
                  position: "relative", flex: 1, minHeight: "260px", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "20px", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.01)", transition: "all 0.2s"
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="Önizleme" />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                        <p style={{ color: "#fff", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Değiştir</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📸</div>
                      <p style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>Görsel Seç</p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", margin: 0 }}>JPG, PNG, WEBP</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>

              {/* Form Alanları */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
                {[
                  { key: "title", label: "Kitap Adı", type: "text" },
                  { key: "author", label: "Yazar", type: "text" },
                  { key: "isbn", label: "ISBN", type: "text" },
                  { key: "pageCount", label: "Sayfa Sayısı", type: "number" },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      required
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", borderRadius: "12px", padding: "14px 16px", fontSize: "14px", outline: "none", transition: "all 0.2s", boxSizing: "border-box"
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Butonlar */}
            <div style={{ display: "flex", gap: "16px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button type="button" onClick={() => router.back()} style={{
                flex: 1, padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s"
              }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"}} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"}}>
                Vazgeç
              </button>
              <button type="submit" disabled={isSubmitting} style={{
                flex: 2, padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1, boxShadow: "0 12px 24px rgba(99,102,241,0.3)", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
              }}>
                {isSubmitting ? (
                  <><span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Kaydediliyor...</>
                ) : "Envantere Ekle"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}