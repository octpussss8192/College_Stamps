"use client"
import { Gift, Coffee, Utensils, Ticket } from "lucide-react";

export default function RewardsPage() {
  const rewards = [
    { id: 1, title: "無料ドリンク券", description: "コーヒー、お茶などから1杯無料", stamps: 15, icon: Coffee, available: false },
    { id: 2, title: "学食割引クーポン", description: "お好きなお食事を100円割引", stamps: 20, icon: Ticket, available: false },
    { id: 3, title: "トッピング無料", description: "カレーやラーメンに温泉卵などを追加", stamps: 5, icon: Utensils, available: true },
    { id: 4, title: "スペシャルランチ", description: "月間MVP限定豪華ランチセット", stamps: 50, icon: Gift, available: false },
  ];

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 min-h-screen bg-slate-900 pb-24">
      <div className="text-white mb-2">
        <h1 className="text-2xl font-bold tracking-tight">特典と交換</h1>
        <p className="text-blue-100 mt-1 text-sm">貯まったスタンプをお得なクーポンに交換しよう</p>
      </div>

      <div className="grid gap-4">
        {rewards.map((reward) => {
          const Icon = reward.icon;
          return (
            <div key={reward.id} className={`bg-white/5 backdrop-blur-lg rounded-2xl p-4 shadow-sm border ${reward.available ? 'border-blue-500/50 shadow-blue-500/10' : 'border-white/5'} flex items-center gap-4`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${reward.available ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-white/10 text-slate-500'}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{reward.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2 border-l border-white/10">
                <span className="text-[10px] text-slate-500 font-medium">必要数</span>
                <span className={`text-xl font-black ${reward.available ? 'text-blue-400' : 'text-slate-600'}`}>{reward.stamps}</span>
                {reward.available ? (
                  <button className="mt-2 text-[10px] bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-bold hover:bg-blue-500/30 transition">交換する</button>
                ) : (
                  <span className="mt-2 text-[10px] bg-white/5 text-slate-600 px-3 py-1 rounded-full font-medium">不足</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
