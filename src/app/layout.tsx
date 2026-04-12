import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";
import InitGuard from "@/components/InitGuard";

import VersionBadge from "@/components/VersionBadge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gakusyoku Stamp",
  description: "いつもの学食をもっと楽しく。食券をスキャンしてスタンプを貯めよう！",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gakusyoku Stamp",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50 relative pb-20 max-w-md mx-auto min-h-screen shadow-2xl`}>
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[40px] -z-10" />
        
        {/* Version Badge */}
        <VersionBadge />
        
        <InitGuard>
          <main className="w-full h-full min-h-screen">
            {children}
          </main>
          
          <BottomNavigation />
        </InitGuard>
      </body>
    </html>
  );
}
