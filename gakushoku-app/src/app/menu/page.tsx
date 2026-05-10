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
        <div className="grid grid-cols-2 gap-4">
          {menus.length === 0 ? (
            <div className="col-span-2 text-center text-slate-400 bg-white rounded-3xl p-12 shadow-sm border border-slate-100">
              メニューがまだ登録されていません
            </div>
          ) : (
            menus.map((menu) => {
              const DAY_NAMES = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
              const todayName = DAY_NAMES[new Date().getDay()];
              const isTodaySpecial = menu.day_of_week === todayName || (menu.is_today_special && !menu.day_of_week);
              return (
              <div key={menu.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col">
                {isTodaySpecial && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 z-10"></div>
                )}
                
                {/* Menu Image */}
                <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                  {menu.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={`/${menu.image_url}`} 
                      alt={menu.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Utensils size={32} />
                    </div>
                  )}
                  {isTodaySpecial && (
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> 日替わり
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{menu.name}</h2>
                    </div>
                    {menu.day_of_week && !isTodaySpecial && (
                      <p className="text-[10px] font-bold text-blue-500 mb-1">{menu.day_of_week}</p>
                    )}
                    {menu.description && (
                      <p className="text-[11px] text-slate-500 leading-tight mb-2 line-clamp-2">{menu.description}</p>
                    )}
                  </div>
                  
                  {menu.price && (
                    <div className="mt-2 pt-2 border-t border-slate-50">
                      <p className="text-xs font-black text-slate-800">¥{menu.price}</p>
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
