import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";

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
        <div className="absolute top-4 right-5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-[10px] font-bold text-white shadow-sm z-40">
          v1.0.0 (Beta)
        </div>
        
        <main className="w-full h-full min-h-screen">
          {children}
        </main>
        
        <BottomNavigation />
      </body>
    </html>
  );
}
