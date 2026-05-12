"use client"
import { Gift, Coffee, Utensils, Ticket, Loader2, Clock, Award, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import NotificationCenter from "@/components/NotificationCenter";

export default function RewardsPage() {
  const [stamps, setStamps] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [wins, setWins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [hasCheckedWin, setHasCheckedWin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, rewardsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/rewards')
        ]);
        
        const meData = await meRes.json();
        if (meData.user) {
          setStamps(meData.user.stamps || 0);
          setTickets(meData.user.tickets || 0);
        }

        const rewardsData = await rewardsRes.json();
        if (rewardsData.entries) setEntries(rewardsData.entries);
        if (rewardsData.wins) setWins(rewardsData.wins);
        
        if (rewardsData.wins?.length > 0) {
          const lastSeenWin = localStorage.getItem('last_seen_win');
          if (lastSeenWin === rewardsData.wins[0].month) {
            setHasCheckedWin(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRevealWin = () => {
    setShowCelebrate(true);
    setHasCheckedWin(true);
    if (wins.length > 0) {
      localStorage.setItem('last_seen_win', wins[0].month);
      
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  };

  const exchangeLottery = async () => {
    if (!confirm("20スタンプを消費して抽選券1枚と交換しますか？")) return;
    setBusy(true);
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "exchangeLotteryTicket" })
      });
      const data = await res.json();
      if (data.success) {
        setStamps(prev => prev - 20);
        setTickets(data.tickets);
        setEntries(prev => [{ created_at: new Date().toISOString() }, ...prev]);
        alert("抽選券を獲得しました！");
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } finally {
      setBusy(false);
    }
  };

  const rewards = [
    { id: 'lottery', title: "月間抽選券", description: "毎月の豪華特典抽選にエントリー（重複なし）", stamps: 20, icon: Ticket, action: exchangeLottery },
    { id: 1, title: "無料ドリンク券", description: "コーヒー、お茶などから1杯無料", stamps: 15, icon: Coffee, action: () => alert("準備中") },
    { id: 2, title: "学食割引クーポン", description: "お好きなお食事を100円割引", stamps: 20, icon: Ticket, action: () => alert("準備中") },
    { id: 3, title: "トッピング無料", description: "カレーやラーメンに温泉卵などを追加", stamps: 5, icon: Utensils, action: () => alert("準備中") },
    { id: 4, title: "スペシャルランチ", description: "月間MVP限定豪華ランチセット", stamps: 50, icon: Gift, action: () => alert("準備中") },
  ];

  const otherRewards = rewards.filter(r => r.id !== 'lottery');
  const lotteryReward = rewards.find(r => r.id === 'lottery');

  return (
    <div className="p-6 pt-12 flex flex-col gap-8 pb-32 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Check Results Interaction */}
      {wins.length > 0 && !hasCheckedWin && (
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-blue-100 flex flex-col items-center gap-4 text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-800">最新の抽選結果が出ています！</h3>
            <p className="text-xs text-slate-500 mt-1">ドキドキの結果を今すぐチェック</p>
          </div>
          <button 
            onClick={handleRevealWin}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
          >
            結果を確認する
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-white flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">特典と交換</h1>
          <p className="text-blue-100 mt-1 text-sm font-medium opacity-90">スタンプを貯めて豪華賞品をゲット！</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <div className="text-right bg-white/10 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/20 min-w-[100px]">
            <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest mb-1 whitespace-nowrap">所持抽選券</p>
            <p className="text-2xl font-black tabular-nums">{tickets}<span className="text-sm ml-1 font-bold">枚</span></p>
          </div>
        </div>
      </div>

      {/* Lottery Hero Section */}
      {lotteryReward && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[42px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-full aspect-[16/10] bg-slate-100 relative overflow-hidden">
              <img 
                src="/lottery-banner.png" 
                alt="Lottery Banner" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-8">
                <h2 className="text-white text-2xl font-black tracking-tight">{lotteryReward.title}</h2>
                <p className="text-blue-100 text-xs font-medium mt-1">{lotteryReward.description}</p>
              </div>
            </div>

            <div className="p-8 w-full flex flex-col items-center gap-6">
              <div className="w-full">
                <button 
                  onClick={exchangeLottery}
                  disabled={busy || stamps < lotteryReward.stamps}
                  className={`
                    w-full py-5 rounded-full text-lg font-black tracking-wider transition-all duration-300
                    ${stamps >= lotteryReward.stamps 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }
                    ${busy ? 'opacity-50' : ''}
                  `}
                >
                  {busy ? '処理中...' : 'エントリーする'}
                </button>
                
                <div className="flex flex-col items-center mt-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">必要スタンプ数</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-2xl font-black ${stamps >= lotteryReward.stamps ? 'text-blue-600' : 'text-slate-300'}`}>
                      {lotteryReward.stamps}
                    </span>
                    <span className="text-xs font-bold text-slate-400">STAMPS</span>
                  </div>
                </div>
              </div>

              {entries.length > 0 && (
                <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} /> エントリー履歴
                  </p>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {entries.map((entry, idx) => {
                      const date = new Date(entry.created_at);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-50">
                          <span className="text-xs font-bold text-slate-700">抽選券 獲得</span>
                          <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                            {date.toLocaleDateString('ja-JP')} {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Rewards List */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-bold ml-1 flex items-center gap-2">
          <Gift size={20} /> その他の特典
        </h3>
        <div className="grid gap-3">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white opacity-50" /></div>
          ) : otherRewards.map((reward) => {
            const Icon = reward.icon;
            const available = stamps >= reward.stamps;
            return (
              <div key={reward.id} className={`bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border ${available ? 'border-blue-100' : 'border-slate-50/50'} flex items-center gap-4 ${busy ? 'opacity-50 pointer-events-none' : ''} transition-all hover:shadow-md`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${available ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{reward.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{reward.description}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-3 border-l border-slate-100">
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-lg font-black ${available ? 'text-blue-600' : 'text-slate-300'}`}>{reward.stamps}</span>
                    <span className="text-[8px] font-bold text-slate-400">pts</span>
                  </div>
                  <button 
                    onClick={reward.action}
                    disabled={!available}
                    className={`mt-1 text-[9px] px-3 py-1 rounded-full font-black transition-colors ${available ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400'}`}
                  >
                    交換
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner Notification / History at Bottom */}
      {wins.length > 0 && hasCheckedWin && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-white text-lg font-bold ml-1 mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-400" /> 当選履歴
          </h3>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[32px] shadow-lg shadow-orange-200/40 border-2 border-white/20 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Gift className="text-white" size={32} />
            </div>
            <div className="text-white">
              <h2 className="text-lg font-black tracking-tight leading-none mb-1">おめでとうございます！</h2>
              <p className="text-xs font-bold opacity-90">{wins[0].month}月の抽選に当選しました</p>
              <p className="text-[10px] opacity-70 mt-2 font-medium">※受取方法は管理スタッフへご確認ください</p>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebrate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCelebrate(false)} />
          <div className="relative bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Award size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">当選確定！！</h2>
            <p className="text-slate-500 font-bold mb-8 italic">Congratulations!</p>
            
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">賞品</p>
              <p className="text-xl font-black text-blue-600 uppercase tracking-tight">{wins[0].month}月 月間賞</p>
            </div>

            <button 
              onClick={() => setShowCelebrate(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
