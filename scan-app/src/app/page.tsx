import Link from 'next/link';
import { Camera } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Gakusyoku<br/><span className="text-blue-500">Scanner</span></h1>
        <p className="text-slate-400 text-sm">カメラで食券をスキャンして解析します</p>
      </div>

      <Link 
        href="/scan" 
        className="w-full max-w-xs aspect-square bg-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 border border-slate-700 hover:bg-slate-700 transition-all shadow-2xl group"
      >
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <Camera size={40} />
        </div>
        <span className="font-bold text-lg">スキャンを開始</span>
      </Link>

      <div className="text-xs text-slate-500 mt-12">
        <p>© 2026 工クオン_学食スタンプ開発チーム</p>
      </div>
    </div>
  );
}
