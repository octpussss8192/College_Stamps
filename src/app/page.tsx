"use client"
import { Award, User, Info, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentStamps, setCurrentStamps] = useState(0);
  const maxStamps = 20;

  useEffect(() => {
    // コンポーネントマウント時にlocalStorageから取得
    const savedStamps = localStorage.getItem('user_stamps');
    if (savedStamps) {
      setCurrentStamps(Number(savedStamps));
    }
  }, []);
  
  // Render dummy stamps
  const stamps = Array.from({ length: maxStamps }).map((_, i) => (
    <div key={i} className={i < currentStamps ? "stamp-filled" : "stamp-empty"}>
      {i < currentStamps ? <Award size={24} /> : <span className="text-slate-400 text-xs font-bold">{i + 1}</span>}
    </div>
  ));

  return (
    <div className="p-6 pt-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Section */}
      <div className="flex items-center justify-between text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">こんにちは、<br/>〇〇大学 学生さん</h1>
          <p className="text-blue-100 flex items-center gap-1 mt-1 text-sm">
            <Award size={16} /> ゴールドランク
          </p>
        </div>
        <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
          <User size={28} className="text-white" />
        </div>
      </div>

      {/* Main Stamp Card */}
      <div className="glassmorphism rounded-3xl p-6 mt-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-slate-500 text-sm font-semibold">現在のスタンプ</p>
              <div className="text-4xl font-extrabold text-slate-800 tracking-tighter">
                {currentStamps} <span className="text-lg text-slate-500 font-medium">/ {maxStamps}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {currentStamps >= maxStamps ? '特典と交換できます！' : `あと${maxStamps - currentStamps}個で特典GET!`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 justify-items-center">
            {stamps}
          </div>
        </div>
      </div>

      {/* Informational Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
            <Info size={18} />
          </div>
          <p className="font-bold text-sm text-slate-800">本日のメニュー</p>
          <p className="text-xs text-slate-500 text-balance">日替わり定食は「油淋鶏」です！</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-1">
            <AlertCircle size={18} />
          </div>
          <p className="font-bold text-sm text-slate-800">混雑状況</p>
          <p className="text-xs text-slate-500">現在、食堂は「空いています」</p>
        </div>
      </div>

    </div>
  );
}
