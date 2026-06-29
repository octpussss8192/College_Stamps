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
      const mode = localStorage.getItem('app_mode');
      if (mode === 'demo') {
        setStamps(parseInt(localStorage.getItem('user_stamps') || '0'));
        setTickets(parseInt(localStorage.getItem('demo_tickets') || '0'));
        setEntries(JSON.parse(localStorage.getItem('demo_entries') || '[]'));
        setWins(JSON.parse(localStorage.getItem('demo_wins') || '[]'));
        
        const lastSeenWin = localStorage.getItem('last_seen_win');
        const demoWins = JSON.parse(localStorage.getItem('demo_wins') || '[]');
        if (demoWins.length > 0 && lastSeenWin === demoWins[0].month.toString()) {
          setHasCheckedWin(true);
        }
        
        setLoading(false);
        return;
      }

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
      localStorage.setItem('last_seen_win', wins[0].month.toString());
      
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

    const mode = localStorage.getItem('app_mode');
    if (mode === 'demo') {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (stamps < 20) {
        alert("スタンプが足りません");
        setBusy(false);
        return;
      }
      
      const newStamps = stamps - 20;
      const newTickets = tickets + 1;
      setStamps(newStamps);
      setTickets(newTickets);
      localStorage.setItem('user_stamps', newStamps.toString());
      localStorage.setItem('demo_tickets', newTickets.toString());
      
      const newEntry = { created_at: new Date().toISOString() };
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('demo_entries', JSON.stringify(updatedEntries));
      
      // Auto-trigger a win to show the beautiful celebration screen!
      const currentMonth = new Date().getMonth() + 1;
      const mockWin = [{ month: currentMonth }];
      setWins(mockWin);
      localStorage.setItem('demo_wins', JSON.stringify(mockWin));
      
      alert("抽選券を獲得しました！");
      setBusy(false);
      return;
    }

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
    { id: 2, title: "学食割引クーポン", description: "お食事を100円割引", stamps: 20, icon: Ticket, action: () => alert("準備中") },
    { id: 3, title: "トッピング無料", description: "温泉卵やチーズを追加", stamps: 5, icon: Utensils, action: () => alert("準備中") },
    { id: 4, title: "スペシャルランチ", description: "月間MVP限定豪華ランチセット", stamps: 50, icon: Gift, action: () => alert("準備中") },
  ];

  const otherRewards = rewards.filter(r => r.id !== 'lottery');
  const lotteryReward = rewards.find(r => r.id === 'lottery');

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 pb-32 animate-in fade-in slide-in-from-right-4 duration-500 min-h-screen bg-cream border-x-[3px] border-charcoal">
      
      {/* Check Results Interaction */}
      {wins.length > 0 && !hasCheckedWin && (
        <div className="neo-card p-6 bg-lime flex flex-col items-center gap-4 text-center animate-in zoom-in duration-500">
          <div className="w-14 h-14 bg-charcoal text-lime rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#18181A] border-[2px] border-charcoal animate-pulse">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="font-dela text-charcoal text-sm leading-tight">抽選結果が発表されました！</h3>
            <p className="text-[10px] text-charcoal/80 font-dot font-black mt-1 uppercase">Draw results are in</p>
          </div>
          <button 
            onClick={handleRevealWin}
            className="w-full neo-btn bg-charcoal text-lime py-3.5"
          >
            結果を確認する
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-charcoal flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-dela tracking-tight text-charcoal leading-none select-none">特典交換</h1>
          <p className="text-[10px] text-charcoal/70 font-dot font-extrabold uppercase tracking-widest mt-1.5">REDEEM YOUR STAMPS</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <div className="text-right bg-white border-[2.5px] border-charcoal p-2 px-3.5 rounded-xl shadow-[3px_3px_0px_#18181A] min-w-[100px] text-charcoal">
            <p className="text-[8px] text-slate-500 uppercase font-dot font-black tracking-widest mb-0.5 whitespace-nowrap">TICKETS</p>
            <p className="text-xl font-dot font-black tabular-nums leading-none">{tickets}<span className="text-[11px] ml-0.5 font-bold">枚</span></p>
          </div>
        </div>
      </div>

      {/* Lottery Hero Section */}
      {lotteryReward && (
        <div className="relative group">
          <div className="neo-card bg-white overflow-hidden flex flex-col items-center">
            {/* Image Container */}
            <div className="p-3 w-full">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border-[2.5px] border-charcoal shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/lottery-banner.png" 
                  alt="Lottery Banner" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-white text-lg font-dela leading-tight select-none drop-shadow-[1.5px_1.5px_0px_#18181A]">{lotteryReward.title}</h2>
                  <p className="text-lime text-[9px] font-dot font-extrabold mt-0.5 drop-shadow-[1px_1px_0px_#18181A]">{lotteryReward.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 w-full flex flex-col items-center gap-5">
              <div className="w-full">
                <button 
                  onClick={exchangeLottery}
                  disabled={busy || stamps < lotteryReward.stamps}
                  className={`
                    w-full py-4.5 rounded-xl text-sm font-dela transition-all duration-300 neo-btn
                    ${stamps >= lotteryReward.stamps 
                      ? 'bg-orange text-white' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300 shadow-none translate-y-0 hover:translate-y-0 active:translate-y-0'
                    }
                    ${busy ? 'opacity-50' : ''}
                  `}
                >
                  {busy ? '処理中...' : 'エントリーする'}
                </button>
                
                <div className="flex flex-col items-center mt-3">
                  <p className="text-[9px] font-dot font-black text-slate-500 uppercase tracking-widest">REQUIRED</p>
                  <div className="flex items-baseline gap-1 mt-0.5 font-dot">
                    <span className={`text-xl font-black ${stamps >= lotteryReward.stamps ? 'text-orange' : 'text-slate-400'}`}>
                      {lotteryReward.stamps}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">STAMPS</span>
                  </div>
                </div>
              </div>

              {/* Perforated Divider */}
              <div className="w-full border-t-[2.5px] border-dashed border-charcoal/15 my-1" />

              {entries.length > 0 && (
                <div className="w-full bg-[#FAF7F2] rounded-xl p-4 border-[2px] border-charcoal/10 font-dot font-semibold">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock size={12} /> エントリー履歴
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {entries.map((entry, idx) => {
                      const date = new Date(entry.created_at);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-charcoal/10 shadow-sm text-[10px]">
                          <span className="font-extrabold text-charcoal">抽選券 獲得</span>
                          <span className="text-[9px] font-medium text-slate-400 tabular-nums">
                            {date.toLocaleDateString('ja-JP')} {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other Rewards List */}
      <div className="space-y-4">
        <h3 className="text-white text-base font-dela ml-1 flex items-center gap-2 select-none drop-shadow-[1.5px_1.5px_0px_#18181A]">
          <Gift size={18} /> その他の特典
        </h3>
        <div className="grid gap-3">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-orange" strokeWidth={3} /></div>
          ) : otherRewards.map((reward) => {
            const Icon = reward.icon;
            const available = stamps >= reward.stamps;
            return (
              <div key={reward.id} className={`neo-card p-4 bg-white flex items-center gap-3 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-[2px] border-charcoal shadow-[2px_2px_0px_#18181A] ${
                  available ? 'bg-lime text-charcoal' : 'bg-slate-50 text-slate-300'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-dela text-xs text-charcoal truncate">{reward.title}</h3>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate">{reward.description}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-3 border-l-[2px] border-charcoal/10 font-dot">
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-base font-black ${available ? 'text-orange' : 'text-slate-400'}`}>{reward.stamps}</span>
                    <span className="text-[8px] font-bold text-slate-400">pts</span>
                  </div>
                  <button 
                    onClick={reward.action}
                    disabled={!available}
                    className={`mt-1 text-[9px] px-3.5 py-1 rounded-lg border-[1.5px] border-charcoal shadow-[1.5px_1.5px_0px_#18181A] font-dela transition-all active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#18181A] ${
                      available ? 'bg-lime text-charcoal' : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300 shadow-none'
                    }`}
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
          <h3 className="text-white text-base font-dela ml-1 mb-3 flex items-center gap-2 select-none drop-shadow-[1.5px_1.5px_0px_#18181A]">
            <Award size={18} className="text-lime fill-lime" /> 当選履歴
          </h3>
          <div className="neo-card p-6 bg-lime flex items-center gap-4">
            <div className="bg-charcoal text-lime p-3 rounded-xl border-[2.5px] border-charcoal shadow-[3px_3px_0px_#18181A]">
              <Gift size={28} />
            </div>
            <div className="text-charcoal flex-1 min-w-0">
              <h2 className="text-base font-dela leading-none mb-1">当選しました！</h2>
              <p className="text-[11px] font-dot font-black mt-1 uppercase">{wins[0].month}月度 月間賞</p>
              <p className="text-[9px] text-charcoal/70 font-semibold mt-2">※受取方法はスタッフまでお尋ねください</p>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebrate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowCelebrate(false)} />
          <div className="relative w-full max-w-sm neo-card bg-white p-8 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-lime text-charcoal rounded-full border-[3px] border-charcoal flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#18181A] animate-bounce">
              <Award size={44} />
            </div>
            <h2 className="text-2xl font-dela text-charcoal mb-1 tracking-tight select-none">当選おめでとう！</h2>
            <p className="text-slate-500 font-dot font-black text-xs mb-8 tracking-wider uppercase">JACKPOT WINNER!</p>
            
            <div className="bg-[#FAF7F2] border-[3px] border-charcoal rounded-2xl p-6 mb-8 font-dot">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">賞品</p>
              <p className="text-lg font-black text-orange uppercase tracking-tight">{wins[0].month}月 月間賞</p>
            </div>

            <button 
              onClick={() => setShowCelebrate(false)}
              className="w-full neo-btn bg-charcoal text-white py-3.5"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
