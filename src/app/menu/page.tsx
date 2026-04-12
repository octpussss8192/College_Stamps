import { Utensils, Star, Info } from 'lucide-react';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  let menus: any[] = [];
  try {
    const { rows } = await sql`SELECT * FROM menu_items ORDER BY is_today_special DESC, id DESC`;
    menus = rows;
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="p-6 pt-12 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
          <Utensils size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">メニュー</h1>
          <p className="text-sm text-slate-500">学食の提供メニュー</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {menus.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            メニューがまだ登録されていません
          </div>
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
              {menu.is_today_special && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              )}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-slate-800">{menu.name}</h2>
                    {menu.is_today_special && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={10} /> 日替わり
                      </span>
                    )}
                  </div>
                  {menu.description && (
                    <p className="text-sm text-slate-500 text-balance mb-3">{menu.description}</p>
                  )}
                </div>
                {menu.price && (
                  <div className="shrink-0 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <p className="text-xs text-slate-400 font-bold mb-0.5">価格</p>
                    <p className="text-lg font-bold text-slate-700">¥{menu.price}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
