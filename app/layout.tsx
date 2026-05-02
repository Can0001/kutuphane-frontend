import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "BibliosHub — Kütüphane Yönetim Sistemi",
  description: "Modern kütüphane otomasyon sistemi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {/* AuthProvider tüm uygulamayı sarar — context her sayfada hazır */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}