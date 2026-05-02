import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole, JWTPayload } from "./lib/auth";

// ─── Rota → İzin verilen roller ──────────────────────────────────────────────
// Not: lib/auth.ts'den import YAPAMIYORuz çünkü oradaki bazı yardımcılar
// yalnızca Browser/Node ortamına özgü API'ler kullanabilir.
// Bu harita lib/auth.ts ile senkronize tutulmalıdır.
const ROUTE_PERMISSIONS: [string, UserRole[]][] = [
  ["/dashboard/users", ["Admin", "Librarian"]],
  ["/dashboard/add", ["Admin", "Librarian", "Assistant"]],
  ["/dashboard/edit", ["Admin", "Librarian", "Assistant"]],
  ["/dashboard/transactions", ["Admin", "Librarian", "Assistant"]],
];

// ─── JWT payload decode (Edge runtime'da atob mevcuttur) ─────────────────────
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Edge'de atob doğrudan kullanılabilir
    const json = atob(base64);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

function extractRoleFromPayload(payload: JWTPayload): UserRole | null {
  const raw = (
    payload.role ??
    (payload as Record<string, unknown>)[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] as string | undefined ??
    null
  ) as string | null;
  if (!raw) return null;
  // İlk harfi büyüt: "admin" → "Admin", "librarian" → "Librarian" (case-insensitive)
  const normalized = (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as UserRole;
  if (
    normalized === "Admin" ||
    normalized === "Librarian" ||
    normalized === "Assistant" ||
    normalized === "Student"
  ) {
    return normalized;
  }
  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Korunan alan mı?
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // 2. Token var mı?
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Token geçerli mi ve süresi dolmamış mı?
  const payload = decodeJWTPayload(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    // Token süresi dolmuş → login'e gönder, cookie'leri temizle
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    response.cookies.delete("user_role");
    return response;
  }

  // 4. Rol bazlı yetkilendirme
  const role = extractRoleFromPayload(payload);

  // Öğrenciler anasayfayı görmesin, direkt kitaplara gitsin
  if (pathname === "/dashboard" && role === "Student") {
    return NextResponse.redirect(new URL("/dashboard/books", request.url));
  }

  for (const [route, allowedRoles] of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  // 5. Geçerli — response'a güncel rolü cookie olarak ekle (SSR için kullanışlı)
  const response = NextResponse.next();
  if (role) {
    response.cookies.set("user_role", role, { path: "/", maxAge: 86400, sameSite: "strict" });
  }
  return response;
}

// Middleware'in hangi rotaları dinleyeceği
export const config = {
  matcher: ["/dashboard/:path*"],
};
