"use client";
import { Camera, ExternalLink, Info } from "lucide-react";
import Link from "next/link";

export default function ScanStubPage() {
  return (
    <div className="p-6 pt-12 flex flex-col items-center justify-center text-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
        <Camera size={40} />
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">スキャン機能は分離開発中</h1>
        <p className="text-blue-100/80 text-sm max-w-[280px] mx-auto text-balance">
          カメラ認識の精度向上と偽造防止対策のため、スキャン機能は現在「スキャンアプリ」として個別に改良されています。
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 w-full">
        <div className="flex items-center gap-3 text-white mb-4">
          <Info size={20} className="text-blue-300" />
          <h2 className="font-bold text-sm">開発者の方へ</h2>
        </div>
        
        <p className="text-xs text-blue-100 text-left leading-relaxed">
          1. <code>scan-app</code> フォルダに移動します。<br/>
          2. <code>npm install</code> を実行します。<br/>
          3. <code>npm run dev</code> でスキャン専用アプリを起動してください。<br/>
          4. 開発完了後、このページに戻されます。
        </p>
      </div>

      <Link 
        href="/"
        className="mt-4 px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-white/90 transition shadow-lg"
      >
        ホームに戻る
      </Link>

      <div className="flex items-center gap-2 text-blue-200 text-xs font-medium">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        スキャンチームが作業中です
      </div>
    </div>
  );
}
