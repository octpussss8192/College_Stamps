"use client"
import { Award, User, Info, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentStamps, setCurrentStamps] = useState(0);
  const [nickname, setNickname] = useState('〇〇大学 学生');
  const [userId, setUserId] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [todaySpecial, setTodaySpecial] = useState<{name: string, description: string} | null>(null);
  const maxStamps = 20;

  useEffect(() => {
    const fetchUserData = async () => {
      const mode = localStorage.getItem('app_mode');
      if (mode === 'release') {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated) {
              setCurrentStamps(data.user.stamps);
              setNickname(data.user.nickname);
              setUserId(data.user.id);
              if (data.user.created_at) {
                setCreatedAt(new Date(data.user.created_at).toLocaleString('ja-JP'));
              }
            }
          }
        } catch (e) {
             console.error(e);
        }
      } else {
        const savedStamps = localStorage.getItem('user_stamps');
        if (savedStamps) {
          setCurrentStamps(Number(savedStamps));
        }
        setUserId(0);
        setCreatedAt(new Date().toLocaleString('ja-JP'));
      }
      
      try {
        const menuRes = await fetch('/api/menu');
        const menuData = await menuRes.json();
        if (menuData.special) {
          setTodaySpecial(menuData.special);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Render dummy stamps
  const stamps = Array.from({ length: maxStamps }).map((_, i) => (
    <div key={i} className={i < currentStamps ? "stamp-filled" : "stamp-empty"}>
      {i < currentStamps ? <Award size={24} /> : <span className="text-slate-400 text-xs font-bold">{i + 1}</span>}
    </div>
  ));

  return (
    <div className="p-6 pt-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Header Profile Section */}
      <div className="flex items-center justify-between text-white relative">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">こんにちは、<br/>{nickname} さん</h1>
          <p className="text-blue-100 flex items-center gap-1 mt-1 text-sm">
            <Award size={16} /> ゴールドランク
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 hover:bg-white/30 transition shadow-sm"
          >
            <User size={28} className="text-white" />
          </button>
          
          {showAccountMenu && (
            <div className="absolute top-16 right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold border-b border-slate-100 pb-2 mb-3">アカウント情報</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">ユーザーID</span>
                  <span className="font-bold text-slate-700">{userId ?? '未設定'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">登録日時</span>
                  <span className="font-bold text-slate-700 text-xs mt-0.5">{createdAt ?? 'ゲストアクセス'}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  fetch('/api/auth/me', { method: 'POST' }).then(() => {
                    localStorage.removeItem('app_mode');
                    window.location.reload();
                  });
                }}
                className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-sm font-semibold transition"
              >
                ログアウト (モード選択へ)
              </button>
            </div>
          )}
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
          <p className="text-xs text-slate-500 text-balance">
            {todaySpecial ? `日替わり定食は「${todaySpecial.name}」です！` : '本日の日替わりは未登録です。'}
          </p>
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
