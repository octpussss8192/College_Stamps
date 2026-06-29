import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, DotGothic16, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import VersionBadge from "@/components/VersionBadge";
import MainLayout from "@/components/MainLayout";

const delaGothic = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dela",
  display: "swap",
});

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus",
  display: "swap",
});

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
    <html lang="ja" className={`${plusJakarta.variable} ${delaGothic.variable} ${dotGothic.variable}`}>
      <body className={`${plusJakarta.className} bg-[#FAF7F2] text-[#18181A] antialiased min-h-screen`}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
