"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import type { User, UserRole } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://localhost:7069/api";

const ROLES = ["Admin", "Librarian", "Assistant", "Student"];
const ROLE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  Admin:     { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.28)", color: "#c4b5fd" },
  Librarian: { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)", color: "#93c5fd" },
  Assistant: { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", color: "#6ee7b7" },
  Student:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", color: "#fcd34d" },
};

const EMPTY: Record<string, string> = {
  firstName: "", lastName: "", email: "", password: "", role: "Student",
  studentNumber: "", department: "", phoneNumber: ""
};

/* ── Shared Modal ─────────────────────────────────────────── */
function Modal({
  title, icon, accentColor, form, setForm, onSubmit, onClose, submitting,
}: {
  title: string; icon: string; accentColor: string;
  form: Record<string, string>; setForm: (f: Record<string, string>) => void;
  onSubmit: () => void; onClose: () => void; submitting: boolean;
}) {
  const isAdd = !form._isEdit;
  const isStudent = form.role === "Student";

  const textFields = [
    { key: "firstName", label: "Ad",      placeholder: "Ad" },
    { key: "lastName",  label: "Soyad",   placeholder: "Soyad" },
    { key: "email",     label: "E-Posta", placeholder: "ornek@mail.com", type: "email" },
    ...(isAdd ? [{ key: "password", label: "Şifre", placeholder: "••••••••", type: "password" }] : []),
  ];

  const studentFields = [
    { key: "studentNumber", label: "Öğrenci No", placeholder: "Örn: 20230001" },
    { key: "department",    label: "Bölüm",      placeholder: "Örn: Bilgisayar Mühendisliği" },
    { key: "phoneNumber",   label: "Telefon",    placeholder: "Örn: 05xx xxx xx xx" },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${accentColor}22`, border: `1px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{icon}</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9" }}>{title}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Kullanıcı Yönetimi</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Rol Seçimi</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {ROLES.map((r) => {
              const active = form.role === r;
              const st = ROLE_STYLE[r] || ROLE_STYLE.Student;
              return (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  style={{
                    padding: "12px", borderRadius: "12px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    transition: "all 0.2s",
                    background: active ? st.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? st.border : "rgba(255,255,255,0.05)"}`,
                    color: active ? st.color : "rgba(255,255,255,0.5)",
                  }}
                >
                  {r === "Student" ? "Öğrenci" : r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          {textFields.map((f) => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{f.label}</label>
              <input
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
              />
            </div>
          ))}

          {isStudent && studentFields.map((f) => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{f.label}</label>
              <input
                type="text"
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}>
            Vazgeç
          </button>
          <button onClick={onSubmit} disabled={submitting} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: accentColor, border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "all 0.2s", boxShadow: `0 8px 16px ${accentColor}40` }}>
            {submitting ? "İşleniyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function UsersPage() {
  const { role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/Users/getall`);
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Kullanıcılar yüklenemedi", showConfirmButton: false, timer: 2000, background: "#111827", color: "#fff" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditTarget(u);
    setForm({
      _isEdit: "true",
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      studentNumber: u.studentNumber ?? "",
      department: u.department ?? "",
      phoneNumber: u.phoneNumber ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      Swal.fire({ icon: "warning", title: "Eksik Alan", text: "Lütfen ad, soyad ve e-posta alanlarını doldurun.", background: "#111827", color: "#fff" });
      return;
    }
    if (!editTarget && !form.password) {
      Swal.fire({ icon: "warning", title: "Şifre gerekli", text: "Yeni kullanıcı için şifre belirlemelisiniz.", background: "#111827", color: "#fff" });
      return;
    }
    setSubmitting(true);
    try {
      if (editTarget) {
        await axios.post(`${API}/Users/update`, {
          id: editTarget.id,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          status: editTarget.status,
          createdDate: editTarget.createdDate ?? new Date().toISOString(),
          studentNumber: form.role === "Student" ? form.studentNumber : "",
          department: form.role === "Student" ? form.department : "",
          phoneNumber: form.role === "Student" ? form.phoneNumber : "",
        });
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kullanıcı güncellendi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
      } else {
        await axios.post(`${API}/Users/add`, {
          id: 0,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          passwordHash: form.password,
          role: form.role,
          status: true,
          createdDate: new Date().toISOString(),
          studentNumber: form.role === "Student" ? form.studentNumber : "",
          department: form.role === "Student" ? form.department : "",
          phoneNumber: form.role === "Student" ? form.phoneNumber : "",
        });
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Kullanıcı eklendi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      let msg = "İşlem başarısız.";
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data   = err.response?.data;
        console.error("🔴 API Hatası →", status, JSON.stringify(data));
        msg = data?.message ?? data?.title ?? (typeof data === "string" ? data : null) ?? `HTTP ${status ?? "?"} hatası`;
      }
      Swal.fire({ icon: "error", title: "Hata", text: msg, background: "#111827", color: "#fff" });
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (u: User) => {
    const label = u.status ? "pasife al" : "aktive et";
    const c = await Swal.fire({
      title: "Emin misiniz?", text: `${u.firstName} ${u.lastName} kullanıcısını ${label}mak istiyorsunuz.`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Evet", cancelButtonText: "Vazgeç",
      confirmButtonColor: u.status ? "#ef4444" : "#10b981", background: "#111827", color: "#fff",
    });
    if (!c.isConfirmed) return;
    try {
      await axios.post(`${API}/Users/changestatus?id=${u.id}`);
      // Optimistic update'e gerek kalmadan fetchUsers ile tabloyu hemen güncelliyoruz
      fetchUsers();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: u.status ? "Kullanıcı pasife alındı" : "Kullanıcı aktive edildi", showConfirmButton: false, timer: 1800, background: "#111827", color: "#fff" });
    } catch (err: unknown) {
      let msg = "Durum değiştirilemedi.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message ?? err.response?.data?.title ?? msg;
      }
      Swal.fire({ icon: "error", title: "Hata", text: msg, background: "#111827", color: "#fff" });
    }
  };

  const filtered = users.filter((u) => {
    if (filterRole !== "All" && u.role !== filterRole) return false;
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.studentNumber ?? "").toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <div style={{ padding: "40px", color: "rgba(255,255,255,0.5)" }}>Yükleniyor...</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(139,92,246,0.8)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>SİSTEM YÖNETİMİ</div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.03em" }}>Kullanıcılar</h1>
        </div>
        {currentUserRole === "Admin" && (
          <button onClick={handleOpenAdd} style={{ padding: "14px 24px", background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", border: "none", borderRadius: "14px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 12px 24px rgba(139,92,246,0.25)", transition: "all 0.3s" }}>
            + Kullanıcı Ekle
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Ad, Soyad, Email veya Bölüm ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "260px", padding: "16px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontSize: "14px", outline: "none" }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ width: "180px", padding: "16px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: "14px", outline: "none", cursor: "pointer", appearance: "none" }}
        >
          <option value="All">Tüm Roller</option>
          <option value="Admin">Süper Admin</option>
          <option value="Librarian">Kütüphaneci</option>
          <option value="Assistant">Asistan</option>
          <option value="Student">Öğrenci</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <th style={{ padding: "20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Kullanıcı</th>
                <th style={{ padding: "20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rol & Detay</th>
                <th style={{ padding: "20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Durum</th>
                <th style={{ padding: "20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rStyle = ROLE_STYLE[u.role] || ROLE_STYLE.Student;
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.05)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "8px", background: rStyle.bg, border: `1px solid ${rStyle.border}`, color: rStyle.color, fontSize: "11px", fontWeight: 600 }}>
                          {u.role === "Student" ? "Öğrenci" : u.role}
                        </span>
                        {u.role === "Student" && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                            {u.department} • No: {u.studentNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "20px", background: u.status ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${u.status ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: u.status ? "#34d399" : "#f87171" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: u.status ? "#34d399" : "#f87171" }}>{u.status ? "Aktif" : "Pasif"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "20px", textAlign: "right" }}>
                      {currentUserRole === "Admin" && (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button onClick={() => handleOpenEdit(u)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.2s" }} title="Düzenle">✎</button>
                          <button onClick={() => handleToggleActive(u)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: u.status ? "rgba(239,68,68,0.8)" : "rgba(16,185,129,0.8)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }} title={u.status ? "Pasife Al" : "Aktive Et"}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Kullanıcı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editTarget ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
          icon={editTarget ? "✎" : "+"}
          accentColor={editTarget ? "#3b82f6" : "#8b5cf6"}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
