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
    <div className="p-6 pt-12 pb-24 max-w-lg mx-auto min-h-screen bg-cream border-x-[3px] border-charcoal">
      {/* Menu Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-white border-[2.5px] border-charcoal rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#18181A] shrink-0 text-charcoal">
          <Utensils size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-dela tracking-tight text-charcoal leading-none">メニュー</h1>
          <p className="text-[10px] text-charcoal/70 font-dot font-extrabold uppercase tracking-widest mt-1.5">TODAY'S SPECIAL & CLASSICS</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-orange" size={36} strokeWidth={3} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {menus.length === 0 ? (
            <div className="col-span-2 text-center neo-card p-12 bg-white text-slate-400 font-dot font-bold">
              メニューがまだ登録されていません
            </div>
          ) : (
            menus.map((menu) => {
              const DAY_NAMES = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
              const todayName = DAY_NAMES[new Date().getDay()];
              const isTodaySpecial = menu.day_of_week === todayName || (menu.is_today_special && !menu.day_of_week);
              return (
              <div key={menu.id} className="neo-card bg-white flex flex-col hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181A] transition-all duration-200 overflow-hidden">
                {isTodaySpecial && (
                  <div className="h-1.5 w-full bg-orange"></div>
                )}
                
                {/* Menu Image */}
                <div className="aspect-[4/3] w-full bg-[#FAF7F2] relative overflow-hidden border-b-[2px] border-charcoal/15">
                  {menu.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={`/${menu.image_url}`} 
                      alt={menu.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Utensils size={32} />
                    </div>
                  )}
                  {isTodaySpecial && (
                    <div className="absolute top-2 left-2 bg-lime text-charcoal text-[9px] font-dela px-2.5 py-1 rounded-lg border-[1.5px] border-charcoal shadow-[1px_1px_0px_#18181A] flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> 日替わり
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h2 className="text-xs font-dela text-charcoal line-clamp-1 mb-1">{menu.name}</h2>
                    {menu.day_of_week && !isTodaySpecial && (
                      <p className="text-[9px] font-dot font-extrabold text-blue-600 uppercase tracking-wider mb-1">{menu.day_of_week}</p>
                    )}
                    {menu.description && (
                      <p className="text-[10px] text-slate-500 leading-tight mb-2 line-clamp-2 font-semibold">{menu.description}</p>
                    )}
                  </div>
                  
                  {menu.price && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center font-dot">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase">PRICE</span>
                      <p className="text-xs font-black text-charcoal">¥{menu.price}</p>
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
