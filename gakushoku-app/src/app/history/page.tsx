"use client"
import { Clock, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default demo data if no history in DB
  const demoData = [
    { id: 1, date: "2026.04.11", time: "12:30", action: "スタンプ獲得", price: 450, menu: "日替わりA定食" },
    { id: 2, date: "2026.04.10", time: "12:15", action: "スタンプ獲得", price: 500, menu: "カツカレー" },
    { id: 3, date: "2026.04.08", time: "18:00", action: "特典交換", item: "トッピング無料" },
    { id: 4, date: "2026.04.05", time: "12:40", action: "スタンプ獲得 (ボーナス)", price: 800, menu: "スペシャル弁当" },
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const mode = localStorage.getItem('app_mode');
        if (mode === 'demo') {
           const localHist = localStorage.getItem('demo_history');
           if (localHist) {
             setHistoryData(JSON.parse(localHist));
           } else {
             setHistoryData(demoData);
           }
           setLoading(false);
           return;
        }

        const res = await fetch('/api/history');
        if (res.ok) {
          const { history } = await res.json();
          if (history && history.length > 0) {
            setHistoryData(history.map((h: any) => ({
               id: h.id, 
               date: h.date, 
               time: h.time, 
               action: "スタンプ獲得", 
               price: h.price, 
               menu: "食券スキャン"
            })));
          } else {
            setHistoryData([]);
          }
        } else {
          setHistoryData(demoData);
        }
      } catch (err) {
        setHistoryData(demoData);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = historyData.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 min-h-screen bg-cream border-x-[3px] border-charcoal">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-dela tracking-tight text-charcoal leading-none select-none">利用履歴</h1>
        <p className="text-[10px] text-charcoal/70 font-dot font-extrabold uppercase tracking-widest mt-1.5">STAMP & REWARD TRANSACTION LOG</p>
      </div>

      <div className="neo-card p-6 bg-white min-h-[300px] relative overflow-hidden">
        {/* Graph paper pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(to right, #18181A 1px, transparent 1px), linear-gradient(to bottom, #18181A 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }} />
        
        {loading ? (
           <div className="flex justify-center items-center h-full pt-10">
              <Loader2 className="animate-spin text-orange" size={32} strokeWidth={3} />
           </div>
        ) : (
          <div className="relative z-10">
            {/* Total Spent receipt item */}
            <div className="flex items-center gap-2 mb-6 font-dot text-charcoal border-b-[2px] border-charcoal/10 pb-4">
              <TrendingUp className="text-orange" size={20} />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">TOTAL SPENT:</span>
              <span className="text-base font-black text-charcoal">{totalAmount.toLocaleString()}円</span>
            </div>

            {historyData.length === 0 ? (
                <p className="text-center text-slate-400 mt-10 text-xs font-dot font-bold">履歴はありません。</p>
            ) : (
              <div className="relative border-l-[3px] border-dashed border-charcoal/20 ml-2.5 flex flex-col gap-6 pb-4">
                {historyData.map((record) => (
                  <div key={record.id} className="relative pl-6">
                    {/* Timeline dot as tiny ticket grommet */}
                    <div className={`absolute -left-[8px] top-1.5 w-3.5 h-3.5 rounded-full border-[2px] border-charcoal ${
                      record.action.includes('特典') ? 'bg-orange' : 'bg-lime'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-1 font-dot">
                      <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {record.date} {record.time}
                      </span>
                    </div>
                    
                    <div className="bg-[#FAF7F2] p-3 rounded-xl border-[2px] border-charcoal/10 shadow-inner">
                      <p className={`font-dela text-xs ${record.action.includes('特典') ? 'text-orange' : 'text-charcoal'}`}>
                        {record.action}
                      </p>
                      {record.menu && <p className="text-[10px] text-slate-500 font-dot font-extrabold mt-1">{record.menu} {record.price ? `(¥${record.price})` : ''}</p>}
                      {record.item && <p className="text-[10px] text-slate-500 font-dot font-extrabold mt-1">{record.item}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
