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
           setHistoryData(demoData);
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
  }, []);

  const totalAmount = historyData.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 min-h-screen bg-slate-900 pb-24">
      <div className="text-white mb-2">
        <h1 className="text-2xl font-bold tracking-tight">利用履歴</h1>
        <p className="text-blue-100 mt-1 text-sm">これまでのスタンプ獲得と利用の記録</p>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/10 min-h-[300px]">
        {loading ? (
           <div className="flex justify-center items-center h-full pt-10">
              <Loader2 className="animate-spin text-blue-500" size={32} />
           </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6 text-slate-200 font-bold">
              <TrendingUp className="text-blue-400" size={20} /> 今月の累計利用額: <span className="text-white">{totalAmount.toLocaleString()}円</span>
            </div>

            {historyData.length === 0 ? (
               <p className="text-center text-slate-500 mt-10 text-sm">履歴はありません。</p>
            ) : (
              <div className="relative border-l-2 border-white/5 ml-3 flex flex-col gap-8 pb-4">
                {historyData.map((record) => (
                  <div key={record.id} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-slate-900 ${
                      record.action.includes('特典') ? 'bg-orange-400' : 'bg-blue-500'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {record.date} {record.time}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm">
                      <p className={`font-bold text-sm ${record.action.includes('特典') ? 'text-orange-400' : 'text-blue-400'}`}>
                        {record.action}
                      </p>
                      {record.menu && <p className="text-xs text-slate-200 mt-1">{record.menu} {record.price ? `(¥${record.price})` : ''}</p>}
                      {record.item && <p className="text-xs text-slate-200 mt-1">{record.item}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
