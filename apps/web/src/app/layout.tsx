import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Providers } from "@/lib/providers";
import "./globals.css";

const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "مشوار المطار — توصيل خاص من وإلى المطار",
  description: "احجز سيارة خاصة من وإلى مطارات السعودية بسعر حسب المسافة.",
};

export const viewport: Viewport = { themeColor: "#0f2d52" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={font.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>
          {/* الهيدر يقرأ المسار الحالي، فيُبث بعد العرض الأولي */}
          <Suspense fallback={<div className="h-14 bg-brand" />}>
            <Header />
          </Suspense>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
