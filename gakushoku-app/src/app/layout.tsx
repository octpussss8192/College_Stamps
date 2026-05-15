import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";
import InitGuard from "@/components/InitGuard";

import VersionBadge from "@/components/VersionBadge";

import MainLayout from "@/components/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "工クオン_学食スタンプ",
  description: "いつもの学食をもっと楽しく。食券をスキャンしてスタンプを貯めよう！",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "工クオン_学食スタンプ",
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
      <body className={`${inter.className} bg-slate-100 min-h-screen`}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
