"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  JWTPayload,
  UserRole,
  decodeJWT,
  extractName,
  extractRole,
  deleteCookie,
} from "@/lib/auth";

// ─── Context tipleri ──────────────────────────────────────────────────────────
interface AuthState {
  payload:     JWTPayload | null;
  role:        UserRole   | null;
  userId:      string     | null;
  userName:    string;
  initials:    string;
  // Pratik bool yardımcıları
  isAdmin:     boolean;
  isLibrarian: boolean;
  isAssistant: boolean;
  isReady:     boolean; // localStorage okundu mu?
}

interface AuthContextType extends AuthState {
  /** Login sonrası çağır — token'ı parse edip state'i doldurur */
  setToken: (token: string) => void;
  logout:   () => void;
}

// ─── Varsayılan değerler ──────────────────────────────────────────────────────
const DEFAULT: AuthState = {
  payload: null, role: null, userId: null, userName: "", initials: "",
  isAdmin: false, isLibrarian: false, isAssistant: false, isReady: false,
};

const AuthContext = createContext<AuthContextType>({
  ...DEFAULT,
  setToken: () => {},
  logout: () => {},
});

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(DEFAULT);
  const router = useRouter();

  const buildState = useCallback((token: string): AuthState => {
    const payload = decodeJWT(token);
    if (!payload) return { ...DEFAULT, isReady: true };

    const role     = extractRole(payload);
    const userName = extractName(payload) || localStorage.getItem("userName") || "";
    const parts    = userName.trim().split(" ");
    const initials = parts.map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "?";

    const p = payload as Record<string, unknown>;
    const userId =
      (p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] as string | undefined) ??
      (p["nameid"] as string | undefined) ??
      (payload.sub as string | undefined) ??
      null;

    return {
      payload,
      role,
      userId,
      userName,
      initials,
      isAdmin:     role === "Admin",
      isLibrarian: role === "Librarian",
      isAssistant: role === "Assistant",
      isReady:     true,
    };
  }, []);

  /** Sayfa yüklendiğinde mevcut token'ı oku */
  useEffect(() => {
    const token = localStorage.getItem("LibraryAuthToken");
    if (token) {
      setState(buildState(token));
    } else {
      setState({ ...DEFAULT, isReady: true });
    }
  }, [buildState]);

  /** Login'den sonra çağrılır */
  const setToken = useCallback(
    (token: string) => {
      localStorage.setItem("LibraryAuthToken", token);
      setState(buildState(token));
    },
    [buildState]
  );

  const logout = useCallback(() => {
    localStorage.clear();
    deleteCookie("auth_token");
    deleteCookie("user_role");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...state, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
