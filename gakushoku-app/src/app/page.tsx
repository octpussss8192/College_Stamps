"use client";
import { Award, User, Info, AlertCircle, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

function DailyProgressChart({ count }: { count: number }) {
  const [animatedCount, setAnimatedCount] = useState(0);
  
  useEffect(() => {
    // Small timeout to ensure animation is visible after mount
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 100);
    return () => clearTimeout(timer);
  }, [count]);

  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedCount % 100 === 0 && animatedCount > 0 ? 100 : animatedCount % 100;
  const offset = circumference - (progress / 100) * circumference;
  const isOver100 = count >= 100;

  let strokeColor = '#EF4444'; // Red
  if (isOver100) {
    strokeColor = '#8B5CF6'; // Purple for 100+
  } else if (count > 70) {
    strokeColor = '#84CC16'; // Light Green
  } else if (count > 50) {
    strokeColor = '#F59E0B'; // Orange
  }

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-12 -mt-12 z-0 opacity-50" />
      <div className="relative z-10 flex items-center justify-center">
        <svg className="w-52 h-52 transform -rotate-90 drop-shadow-sm">
          {/* Outer glow/border shadow (subtle) */}
          <circle
            cx="104"
            cy="104"
            r={radius + 8}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          {/* Main Track - Darker for better visibility */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="14"
            fill="transparent"
          />
          {/* Inner border (subtle) */}
          <circle
            cx="104"
            cy="104"
            r={radius - 8}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          {/* Progress circle */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-[1500ms] ease-in-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center animate-in fade-in zoom-in duration-700 delay-300">
          <span className="text-5xl font-black text-slate-800 tracking-tighter">{count}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SCANS TODAY</span>
        </div>
      </div>
      <div className="mt-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-slate-900/20 animate-in slide-in-from-bottom-2 duration-500 delay-500">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          本日、みんなで70食達成で特典UP!!
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentStamps, setCurrentStamps] = useState(0);
  const [nickname, setNickname] = useState('〇〇大学 学生');
  const [userId, setUserId] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [todaySpecial, setTodaySpecial] = useState<{name: string, description: string} | null>(null);
  const [todayHashes, setTodayHashes] = useState(0);
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
        if (menuData.todayHashes !== undefined) {
          setTodayHashes(menuData.todayHashes);
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
            <div className="absolute top-16 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 truncate">{nickname}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">メンバーアカウント</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-bold">ユーザーID</span>
                  <span className="text-sm font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{userId ?? 'GUEST'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-bold">登録日時</span>
                  <span className="text-[11px] font-bold text-slate-700">{createdAt ?? 'ゲストアクセス'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => {
                    fetch('/api/auth/me', { method: 'POST' }).then(() => {
                      localStorage.removeItem('app_mode');
                      window.location.reload();
                    });
                  }}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                >
                  ログアウト
                </button>
                <button 
                  onClick={() => setShowAccountMenu(false)}
                  className="w-full bg-white text-slate-500 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition border border-slate-100"
                >
                  閉じる
                </button>
              </div>
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
              <p className="text-slate-600 text-sm font-bold">現在のスタンプ</p>
              <div className="text-4xl font-extrabold text-slate-800 tracking-tighter">
                {currentStamps} <span className="text-lg text-slate-500 font-medium">/ {maxStamps}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">
                {currentStamps >= maxStamps ? '特典と交換できます！' : `あと${maxStamps - currentStamps}個で特典GET!`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 justify-items-center">
            {stamps}
          </div>
        </div>
      </div>

      {/* Daily Progress Chart */}
      <DailyProgressChart count={todayHashes} />

      {/* Informational Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
            <Info size={18} />
          </div>
          <p className="font-bold text-sm text-slate-800">本日のメニュー</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {todaySpecial ? `日替わり定食は「${todaySpecial.name}」です！` : '本日の日替わりは未登録です。'}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-1">
            <AlertCircle size={18} />
          </div>
          <p className="font-bold text-sm text-slate-800">混雑状況</p>
          <p className="text-xs text-slate-600 leading-relaxed">現在、食堂は「空いています」</p>
        </div>
      </div>

    </div>
  );
}
