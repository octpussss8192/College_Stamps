"use client";
import { Utensils, Star, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MenuPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.menus) setMenus(data.menus);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 pt-12 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center border border-white/30">
          <Utensils size={24} />
        </div>
        <div className="text-white">
          <h1 className="text-2xl font-bold tracking-tight">メニュー</h1>
          <p className="text-sm text-blue-100">学食の提供メニュー</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {menus.length === 0 ? (
            <div className="text-center text-slate-400 bg-white rounded-3xl p-12 shadow-sm border border-slate-100">
              メニューがまだ登録されていません
            </div>
          ) : (
            menus.map((menu) => {
              const DAY_NAMES = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
              const todayName = DAY_NAMES[new Date().getDay()];
              const isTodaySpecial = menu.day_of_week === todayName || (menu.is_today_special && !menu.day_of_week);
              return (
              <div key={menu.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                {isTodaySpecial && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                )}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-800">{menu.name}</h2>
                      {isTodaySpecial && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star size={10} /> 本日の日替わり
                        </span>
                      )}
                      {menu.day_of_week && !isTodaySpecial && (
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {menu.day_of_week}
                        </span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{menu.description}</p>
                    )}
                  </div>
                  {menu.price && (
                    <div className="shrink-0 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      <p className="text-xs text-slate-500 font-bold mb-0.5">価格</p>
                      <p className="text-lg font-bold text-slate-800">¥{menu.price}</p>
                    </div>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
