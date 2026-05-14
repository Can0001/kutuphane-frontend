// ─── Kullanıcı rolleri ────────────────────────────────────────────────────────
export type UserRole = "Admin" | "Librarian" | "Assistant" | "Student";

// ─── TPH Unified User model (tüm roller için tek interface) ──────────────────
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string; // "Admin" | "Librarian" | "Student" vb.
  status: boolean; // eski isActive yerine
  createdDate: string;
  // Yalnızca Student'larda dolu gelir:
  studentNumber?: string;
  department?: string;
  phoneNumber?: string;
  trustScore?: number;
  penaltyScore?: number;
}

// ─── JWT payload tipi ─────────────────────────────────────────────────────────
// ASP.NET Core, rolleri bazen standart claim adıyla ("role") bazen de tam URI
// ile ("http://schemas.microsoft.com/ws/2008/06/identity/claims/role") kodlar.
// Her iki durumu da destekliyoruz.
export interface JWTPayload {
  // Standart alanlar
  sub?: string;
  email?: string;
  exp?: number;
  iat?: number;
  // ASP.NET Core — kısa form
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  nameid?: string;
  // ASP.NET Core — tam URI form
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: UserRole;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

// ─── Rota erişim haritası ─────────────────────────────────────────────────────
// Belirtilmeyen rotalar → tüm kimliği doğrulanmış kullanıcılar erişebilir.
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/dashboard/users": ["Admin", "Librarian"],
  "/dashboard/add": ["Admin", "Librarian", "Assistant"],
  "/dashboard/edit": ["Admin", "Librarian", "Assistant"],
  "/dashboard/transactions": ["Admin", "Librarian", "Assistant"],
  "/dashboard/reports": ["Admin", "Librarian"],
  "/dashboard/my-borrows": ["Student"],
};

// ─── JWT decode (imza doğrulaması yapılmaz — bu sadece UX amaçlıdır) ─────────
// Güvenlik sunucu tarafında (C#) sağlanır.
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    // base64url → base64 dönüşümü
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Her ortamda (Edge + Browser) çalışacak şekilde
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonStr) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Payload'dan rolü normalize et (case-insensitive) ─────────────────────────
export function extractRole(payload: JWTPayload): UserRole | null {
  const raw =
    (payload.role ??
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    null) as string | null;
  if (!raw) return null;
  // İlk harfi büyüt — API "admin" gönderse de "Admin" olarak tanır
  const normalized = (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as UserRole;
  if (normalized === "Admin" || normalized === "Librarian" || normalized === "Assistant" || normalized === "Student") {
    return normalized;
  }
  return null;
}

// ─── Payload'dan adı normalize et ──────────────────────────────────────────────────────
export function extractName(payload: JWTPayload): string {
  // ASP.NET Core farklı claim adları kullanabiliyor, hepsini dene
  const p = payload as Record<string, unknown>;
  const fullNameClaim =
    (p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as string | undefined) ??
    (p["unique_name"] as string | undefined) ??
    null;
  if (fullNameClaim) return fullNameClaim;

  // firstName + lastName alanları
  const first = (payload.firstName ?? (p["given_name"] as string | undefined) ?? "") as string;
  const last  = (payload.lastName  ?? (p["family_name"] as string | undefined) ?? "") as string;
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;

  // Son çare: e-posta
  return (
    (p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string | undefined) ??
    payload.email ??
    ""
  );
}

// ─── Cookie yardımcıları (Client-Side) ───────────────────────────────────────
const COOKIE_OPTS = "path=/; max-age=86400; samesite=strict"; // 1 gün

export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_OPTS}`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
