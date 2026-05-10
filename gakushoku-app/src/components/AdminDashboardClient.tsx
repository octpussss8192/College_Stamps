"use client";
import { useState, useEffect, useCallback } from 'react';
import { Users, Hash, Utensils, Award, Clock, Trash2, Plus, Search, RefreshCw, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const DAYS = ['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'];

function getAdminPw() { return typeof window !== 'undefined' ? sessionStorage.getItem('admin_password') || '' : ''; }

async function adminFetch(tab: string) {
  const res = await fetch(`/api/admin?tab=${encodeURIComponent(tab)}`, { headers: { 'x-admin-password': getAdminPw() } });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

async function adminAction(action: string, body: any) {
  const res = await fetch('/api/admin', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': getAdminPw() },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

export default function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'ホーム') as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState(false);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try { setData(await adminFetch(activeTab)); } catch { setData(null); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const doAction = async (action: string, body: any) => {
    setBusy(true);
    try { await adminAction(action, body); await loadTab(); } finally { setBusy(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-slate-400" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 pt-12 rounded-b-[40px] shadow-lg mb-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">管理者デバッグ</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-widest">{activeTab} PANEL</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadTab} className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition" title="Refresh"><RefreshCw size={18} /></button>
            <Link href="/" className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 transition">アプリに戻る</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {(activeTab === 'ホーム' || activeTab === 'スキャン' || activeTab === '特典') && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
        )}

        {activeTab === 'ホーム' && <HomeTab data={data} searchTerm={searchTerm} doAction={doAction} busy={busy} />}
        {activeTab === 'メニュー' && <MenuTab data={data} doAction={doAction} busy={busy} />}
        {activeTab === 'スキャン' && <ScanTab data={data} doAction={doAction} busy={busy} />}
        {activeTab === '特典' && <RewardsTab data={data} searchTerm={searchTerm} doAction={doAction} busy={busy} />}
        {activeTab === '履歴' && <HistoryTab data={data} />}
      </div>
    </div>
  );
}

function DailyProgressChart({ count }: { count: number }) {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(count);
    }, 100);
    return () => clearTimeout(timer);
  }, [count]);

  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedCount % 100 === 0 && animatedCount > 0 ? 100 : animatedCount % 100;
  const offset = circumference - (progress / 100) * circumference;
  const isOver100 = count >= 100;

  let strokeColor = '#EF4444'; // Red
  if (isOver100) {
    strokeColor = '#8B5CF6'; // Purple for 100+
  } else if (count > 70) {
    strokeColor = '#84CC16'; // Light Green
  } else if (count > 50) {
    strokeColor = '#F59E0B'; // Orange
  }

  return (
    <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-20 -mt-20 z-0 opacity-40" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-slate-50 rounded-full -ml-16 -mb-16 z-0 opacity-40" />
      
      <div className="relative z-10 flex items-center justify-center">
        <svg className="w-64 h-64 transform -rotate-90 drop-shadow-md">
          {/* Main Track with subtle styling */}
          <circle
            cx="128"
            cy="128"
            r={radius + 10}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="18"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r={radius - 10}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke={strokeColor}
            strokeWidth="18"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-[2000ms] ease-in-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center animate-in fade-in zoom-in duration-1000 delay-200">
          <span className="text-7xl font-black text-slate-800 tracking-tighter">{count}</span>
          <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-1">SCANS TODAY</span>
        </div>
      </div>
      <div className="mt-12 text-center relative z-10">
        <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-slate-900/30 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          本日、みんなで70食達成で特典UP!!
        </div>
      </div>
    </div>
  );
}

function HomeTab({ data, searchTerm, doAction, busy }: any) {
  const users = (data?.users || []).filter((u: any) => u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm));
  const c = data?.counts || {};
  return (
    <div className="space-y-6">
      <DailyProgressChart count={c.today_hashes || 0} />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['総ユーザー', c.users],['総スキャン', c.hashes],['メニュー数', c.menus],['総履歴', c.history]].map(([l, v]) => (
          <div key={l as string} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{l}</p>
            <p className="text-3xl font-black text-slate-800">{v ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-500" />ユーザー管理</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {users.length === 0 ? <div className="p-12 text-center text-slate-400">該当するユーザーはいません</div> :
            users.map((u: any) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">ID:{u.id}</div>
                  <div>
                    <p className="font-bold text-slate-800">{u.nickname}</p>
                    <p className="text-xs text-slate-500 font-medium">{u.stamps} stamps • {new Date(u.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
                <button disabled={busy} onClick={() => doAction('deleteUser', { id: u.id })} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"><Trash2 size={18} /></button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function MenuTab({ data, doAction, busy }: any) {
  const menus = data?.menus || [];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden p-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Utensils size={20} className="text-amber-500" />メニュー追加</h2>
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget);
          await doAction('addMenu', { 
            name: fd.get('name'), 
            description: fd.get('description'), 
            price: fd.get('price'), 
            isSpecial: fd.get('is_today_special') === 'true', 
            dayOfWeek: fd.get('day_of_week') || null,
            imageUrl: fd.get('image_url') || null
          });
          (e.target as HTMLFormElement).reset();
        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">メニュー名</label>
            <input required type="text" name="name" placeholder="例: 牛丼" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">価格 (円)</label>
            <input type="number" name="price" placeholder="例: 450" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">説明</label>
            <input type="text" name="description" placeholder="説明文を入力..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">画像パス (images/xxx.jpg)</label>
            <input type="text" name="image_url" placeholder="例: images/curry.jpg" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">曜日指定 (日替わり)</label>
            <select name="day_of_week" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none">
              <option value="">曜日指定なし（常設）</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input type="checkbox" name="is_today_special" value="true" className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-bold text-slate-700">日替わり</span>
            </label>
            <button type="submit" disabled={busy} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 disabled:opacity-50">追加</button>
          </div>
        </form>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {menus.map((m: any) => (
          <div key={m.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
            {(m.is_today_special || m.day_of_week) && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />}
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-bold text-slate-800">{m.name}</p>
                {m.day_of_week && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">{m.day_of_week}</span>}
                {m.is_today_special && !m.day_of_week && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">日替わり</span>}
              </div>
              <p className="text-xs text-slate-500 font-medium">{m.description || '説明なし'} • ¥{m.price || '未設定'}</p>
            </div>
            <button disabled={busy} onClick={() => doAction('deleteMenu', { id: m.id })} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100 disabled:opacity-50"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScanTab({ data, doAction, busy }: any) {
  const hashes = data?.hashes || []; const users = data?.users || [];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden p-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Hash size={20} className="text-pink-500" />手動使用済み設定</h2>
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget);
          await doAction('addHash', { hash: fd.get('hash'), userId: fd.get('user_id') });
          (e.target as HTMLFormElement).reset();
        }} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">食券ハッシュ</label>
            <input required type="text" name="hash" placeholder="例: 987654321" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none" />
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">対象ユーザー</label>
            <select required name="user_id" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none">
              <option value="">選択</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.nickname} (ID:{u.id})</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="w-full md:w-auto px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition shadow-lg shadow-pink-500/20 disabled:opacity-50">使用済みにする</button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">使用済みハッシュ一覧</p></div>
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {hashes.map((h: any) => (
            <div key={h.hash} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="font-mono font-bold text-slate-700 text-sm">{h.hash}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">USER ID: {h.user_id} • {new Date(h.created_at).toLocaleString('ja-JP')}</p>
              </div>
              <button disabled={busy} onClick={() => doAction('deleteHash', { hash: h.hash })} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ data, searchTerm, doAction, busy }: any) {
  const users = (data?.users || []).filter((u: any) => u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm));
  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-black mb-2">スタンプ管理</h2>
          <p className="text-indigo-100 text-sm font-medium mb-6">ユーザーのスタンプ数を直接編集</p>
          <div className="grid grid-cols-1 gap-4">
            {users.length === 0 ? <div className="text-center py-10 text-indigo-300 font-bold">ユーザーなし</div> :
              users.map((u: any) => (
                <div key={u.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">{u.nickname[0]}</div>
                    <div><p className="font-bold">{u.nickname}</p><p className="text-xs text-indigo-200">ID: {u.id}</p></div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-xl px-2 py-1.5 border border-white/5">
                    <button disabled={busy} onClick={() => doAction('updateStamps', { userId: u.id, stamps: Math.max(0, u.stamps - 1) })}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/30 flex items-center justify-center font-bold transition disabled:opacity-50">-</button>
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="text-xs font-bold text-indigo-200">STAMPS</span>
                      <span className="font-black text-xl">{u.stamps}</span>
                    </div>
                    <button disabled={busy} onClick={() => doAction('updateStamps', { userId: u.id, stamps: u.stamps + 1 })}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/30 flex items-center justify-center font-bold transition disabled:opacity-50">+</button>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-2 py-1.5 border border-white/5 ml-2">
                    <div className="flex flex-col items-center min-w-[2.5rem]">
                      <span className="text-[10px] font-bold text-indigo-200">TICKETS</span>
                      <span className="font-black text-lg">{u.tickets || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button disabled={busy} onClick={() => doAction('updateStamps', { userId: u.id, stamps: u.stamps, tickets: (u.tickets || 0) + 1 })}
                        className="w-6 h-4 rounded bg-white/10 hover:bg-white/30 flex items-center justify-center text-xs font-bold transition disabled:opacity-50">+</button>
                      <button disabled={busy} onClick={() => doAction('updateStamps', { userId: u.id, stamps: u.stamps, tickets: Math.max(0, (u.tickets || 0) - 1) })}
                        className="w-6 h-4 rounded bg-white/10 hover:bg-white/30 flex items-center justify-center text-xs font-bold transition disabled:opacity-50">-</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-center relative">
        <button disabled={busy} onClick={() => { if(confirm('今月の抽選を実行しますか？（※チケットはリセットされます）')) doAction('runLottery', {}) }} className="absolute top-8 right-8 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition disabled:opacity-50">
          月間抽選を実行
        </button>
        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><Award size={32} /></div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">月間抽選・当選履歴</h3>
        <p className="text-sm text-slate-500 mb-6">スタンプ満了による特典交換の記録</p>
        
        {(!data?.winners || data.winners.length === 0) ? (
          <div className="bg-slate-50 rounded-2xl p-12 text-slate-400 text-xs font-bold border border-dashed border-slate-200 uppercase tracking-widest">NO RECORDS</div>
        ) : (
          <div className="text-left divide-y divide-slate-100">
            {data.winners.map((w: any) => (
              <div key={w.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{w.nickname}</span>
                  <span className="text-xs text-slate-400 ml-2">ID: {w.user_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{w.month} 当選</span>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(w.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ data }: any) {
  const history = data?.history || [];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-emerald-500" />全スキャン履歴</h2>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full">{history.length} RECORDS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">日付/時刻</th><th className="px-6 py-4">ユーザー</th><th className="px-6 py-4">価格</th><th className="px-6 py-4">ハッシュ</th><th className="px-6 py-4">ステータス</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">履歴なし</td></tr> :
                history.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-700"><span className="font-bold">{item.date}</span><br/><span className="text-[10px] text-slate-400">{item.time}</span></td>
                    <td className="px-6 py-4 font-bold text-slate-800">UID: {item.user_id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">¥{item.price}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{item.hash}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status?.toUpperCase()}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
