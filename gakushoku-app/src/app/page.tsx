"use client";
import { Award, User, Info, Star, Utensils } from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationCenter from '@/components/NotificationCenter';

function DailyProgressChart({ count }: { count: number }) {
  const [animatedCount, setAnimatedCount] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 100);
    return () => clearTimeout(timer);
  }, [count]);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedCount % 100 === 0 && animatedCount > 0 ? 100 : animatedCount % 100;
  const offset = circumference - (progress / 100) * circumference;
  const isOver100 = count >= 100;

  let strokeColor = '#FFD166'; // Yellow default
  if (isOver100) {
    strokeColor = '#00F5A0'; // Neon Mint for 100+
  } else if (count > 70) {
    strokeColor = '#CCFF00'; // Neon Lime
  } else if (count > 50) {
    strokeColor = '#FF5E36'; // Retro Sunset Orange
  }

  return (
    <div className="neo-card p-8 bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cream rounded-full -mr-12 -mt-12 z-0 opacity-55 border-[2px] border-charcoal/10" />
      
      <div className="relative z-10 flex items-center justify-center">
        <svg className="w-52 h-52 transform -rotate-90 drop-shadow-[3px_3px_0px_rgba(24,24,26,0.15)]">
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="transparent"
            stroke="#18181A"
            strokeWidth="18"
          />
          <circle
            cx="104"
            cy="104"
            r={radius}
            stroke={strokeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="square"
            fill="transparent"
            className="transition-all duration-[1200ms] ease-in-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-dela text-charcoal leading-none select-none">{count}</span>
          <span className="text-[9px] font-dot font-black text-slate-500 uppercase tracking-widest mt-2">SCANS TODAY</span>
        </div>
      </div>
      
      <div className="mt-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-charcoal text-white px-5 py-2 rounded-xl border-[2px] border-charcoal shadow-[3px_3px_0px_rgba(24,24,26,0.25)] text-xs font-dot font-extrabold">
          <Star size={14} className="text-lime fill-lime" />
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
            if (data && data.authenticated && data.user) {
              setCurrentStamps(data.user.stamps || 0);
              setNickname(data.user.nickname || '〇〇大学 学生');
              setUserId(data.user.id);
              if (data.user.created_at) {
                setCreatedAt(new Date(data.user.created_at).toLocaleString('ja-JP'));
              }
            }
          }
        } catch (e) {
          console.error("Auth fetch failed:", e);
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
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          if (menuData) {
            if (menuData.special) {
              setTodaySpecial(menuData.special);
            }
            if (menuData.todayHashes !== undefined) {
              setTodayHashes(Number(menuData.todayHashes));
            }
          }
        }
      } catch (e) {
        console.error("Menu fetch failed:", e);
      }
    };
    
    fetchUserData();
  }, []);
  
  const stamps = Array.from({ length: maxStamps }).map((_, i) => (
    <div key={i} className={i < currentStamps ? "stamp-filled" : "stamp-empty"}>
      {i < currentStamps ? (
        <span className="font-dela text-base leading-none translate-y-[1px]">済</span>
      ) : (
        <span className="font-dot text-[11px] font-black text-charcoal/40">{i + 1}</span>
      )}
    </div>
  ));

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Header Profile Section */}
      <div className="flex items-center justify-between text-charcoal relative">
        <div className="z-10">
          <h1 className="text-xl font-dela tracking-tight text-charcoal leading-none select-none">
            こんにちは、<br/>
            <span className="inline-block bg-charcoal text-lime px-2.5 py-1 rounded-lg border-[2px] border-charcoal shadow-[2px_2px_0px_#18181A] mt-2 font-dela text-sm">{nickname}</span> さん
          </h1>
          <p className="text-charcoal/80 flex items-center gap-1 mt-2.5 text-[9px] font-dot font-extrabold uppercase tracking-wider">
            <Award size={13} className="fill-current" /> GOLD MEMBER
          </p>
        </div>
        
        <div className="flex items-center z-20">
          <NotificationCenter />
          <div className="relative">
            <button 
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="h-12 w-12 rounded-xl bg-white border-[3px] border-charcoal flex items-center justify-center shadow-[3px_3px_0px_#18181A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition-all cursor-pointer"
            >
              <User size={24} className="text-charcoal" />
            </button>
            
            {showAccountMenu && (
              <div className="absolute top-14 right-0 w-64 bg-white border-[3px] border-charcoal rounded-2xl shadow-[6px_6px_0px_#18181A] p-5 z-50 text-charcoal animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b-[2px] border-charcoal/10">
                  <div className="w-10 h-10 rounded-xl bg-lime border-[2px] border-charcoal flex items-center justify-center text-charcoal shadow-[2px_2px_0px_#18181A] shrink-0">
                    <User size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-dela text-sm text-charcoal truncate">{nickname}</p>
                    <p className="text-[9px] text-slate-500 font-dot font-extrabold tracking-wider uppercase">MEMBER ACCOUNT</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-5 font-dot">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-extrabold">ID</span>
                    <span className="font-bold text-charcoal bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{userId ?? 'GUEST'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-extrabold">SINCE</span>
                    <span className="font-bold text-charcoal text-[9px]">{createdAt ?? 'GUEST ACCESS'}</span>
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
                    className="w-full neo-btn bg-charcoal text-white hover:bg-slate-800 py-2.5 text-xs"
                  >
                    ログアウト
                  </button>
                  <button 
                    onClick={() => setShowAccountMenu(false)}
                    className="w-full neo-btn bg-white text-slate-500 hover:text-charcoal py-2 text-xs"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Stamp Card */}
      <div className="neo-card p-6 mt-4 relative overflow-hidden bg-white">
        {/* Subtle grid pattern background inside card to simulate graph paper */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(to right, #18181A 1px, transparent 1px), linear-gradient(to bottom, #18181A 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }} />
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-slate-500 text-[10px] font-dot font-black uppercase tracking-wide">STAMP CARD</p>
              <div className="text-3xl font-dela text-charcoal tracking-tight mt-1 flex items-baseline gap-1">
                {currentStamps} <span className="text-sm text-slate-400 font-dot font-black">/ {maxStamps}</span>
              </div>
            </div>
            <div className="text-right font-dot">
              <p className="text-[10px] text-orange font-black bg-orange/10 border border-orange/30 px-2.5 py-1 rounded-lg">
                {currentStamps >= maxStamps ? '特典と交換可能です！' : `あと ${maxStamps - currentStamps} スタンプ`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3.5 justify-items-center bg-[#FAF7F2] p-4 rounded-2xl border-[2px] border-charcoal/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.02)]">
            {stamps}
          </div>
        </div>
      </div>

      {/* Daily Progress Chart */}
      <DailyProgressChart count={todayHashes} />

      {/* Informational Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neo-card rounded-2xl p-4 bg-white hover:-translate-y-0.5 transition-transform flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-orange/10 border border-orange/30 flex items-center justify-center text-orange mb-3">
              <Utensils size={18} />
            </div>
            <p className="font-dela text-xs text-charcoal">本日のメニュー</p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold leading-normal">
              {todaySpecial ? `日替わり定食は「${todaySpecial.name}」です！` : '本日の日替わりは未登録です。'}
            </p>
          </div>
        </div>
        
        <div className="neo-card rounded-2xl p-4 bg-white hover:-translate-y-0.5 transition-transform flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-lime/20 border border-lime flex items-center justify-center text-charcoal mb-3">
              <Info size={18} />
            </div>
            <p className="font-dela text-xs text-charcoal">食堂混雑状況</p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold leading-normal">
              現在、食堂は「空いています」
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
