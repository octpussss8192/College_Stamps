import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "工クオン_食券スキャナー",
  description: "食券スキャン専用アプリ",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
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
      <body className={`${inter.className} bg-slate-900 max-w-md mx-auto min-h-screen`}>
        <main className="w-full min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
