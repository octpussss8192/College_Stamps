"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Hash, Utensils, Award, Clock, Trash2, Plus, Search, 
  RefreshCw, Loader2, Star, Mail, RotateCcw, AlertTriangle, 
  MessageSquare, BarChart2, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const DAYS = ['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'];

function getAdminPw() { 
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_password') || '' : ''; 
}

async function adminFetch(tab: string) {
  const pw = getAdminPw();
  if (!pw) return { error: 'Unauthorized' };

  const res = await fetch(`/api/admin?tab=${encodeURIComponent(tab)}`, { 
    headers: { 'x-admin-password': pw } 
  });
  if (!res.ok) {
    if (res.status === 401) return { error: 'Unauthorized' };
    throw new Error('Fetch failed');
  }
  return res.json();
}

async function adminAction(action: string, body: any) {
  const res = await fetch('/api/admin', {
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'x-admin-password': getAdminPw() 
    },
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
    try { 
      const res = await adminFetch(activeTab);
      if (res && res.error === 'Unauthorized') {
        alert("管理者認証セッションが切れました。ログインし直してください。");
        window.location.href = "/";
        return;
      }
      setData(res); 
    } catch (e) { 
      console.error(e);
      setData(null); 
    } finally { 
      setLoading(false); 
    }
  }, [activeTab]);

  useEffect(() => { 
    loadTab(); 
  }, [loadTab]);

  const doAction = async (action: string, body: any) => {
    setBusy(true);
    try { 
      const res = await adminAction(action, body); 
      if (res.error) {
        alert(res.error);
      } else if (res.message) {
        alert(res.message);
      }
      await loadTab(); 
    } catch (e) {
      console.error(e);
      alert('アクションの実行に失敗しました。');
    } finally { 
      setBusy(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] gap-4">
      <Loader2 className="animate-spin text-orange" size={48} strokeWidth={3} />
      <p className="font-dot font-black tracking-widest text-sm text-charcoal">LOADING DASHBOARD...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-charcoal font-sans pb-24 border-[6px] border-charcoal">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-12px)]">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-white md:min-h-full border-b-[4px] md:border-b-0 md:border-r-[4px] border-charcoal flex flex-col z-50">
          <div className="p-6 border-b-[3px] border-charcoal bg-lime text-charcoal">
            <h1 className="text-2xl font-dela tracking-tight leading-none select-none">
              学食スタンプ<br/>
              <span className="text-orange text-sm font-dot font-black">管理者デバッグ</span>
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto pb-24 md:pb-6 bg-white">
            {[
              { label: 'ホーム', icon: Users },
              { label: 'メニュー', icon: Utensils },
              { label: '食券管理', icon: Clock, tab: '食券ログ' },
              { label: '通知管理', icon: MessageSquare, tab: '通知' },
              { label: '特典管理', icon: Award, tab: '特典' },
              { label: 'スキャン履歴', icon: Search, tab: '履歴' },
              { label: 'レポート', icon: BarChart2 },
              { label: 'システム', icon: RotateCcw, tab: 'システム' },
            ].map(({ label, icon: Icon, tab }) => {
              const targetTab = tab || label;
              const isSelected = activeTab === targetTab;
              return (
                <Link 
                  key={label}
                  href={`/admin?tab=${targetTab}`}
                  className={`flex items-center gap-3 px-4 py-3 border-[3px] border-charcoal rounded-xl text-sm font-dela transition-all select-none ${
                    isSelected 
                      ? 'bg-orange text-white shadow-[2px_2px_0px_#18181A] translate-x-[2px] translate-y-[2px]' 
                      : 'bg-white hover:bg-[#FAF7F2] text-charcoal shadow-[4px_4px_0px_#18181A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#18181A]'
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {label}
                </Link>
              );
            })}
            
            <div className="pt-6 mt-6 border-t-[3px] border-charcoal">
              <Link href="/" className="flex items-center justify-center gap-3 px-4 py-3 bg-charcoal text-lime border-[3px] border-charcoal rounded-xl text-sm font-dela shadow-[4px_4px_0px_#18181A] hover:bg-slate-800 transition">
                <RefreshCw size={16} strokeWidth={2.5} />
                アプリに戻る
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 bg-[#FAF7F2]">
          <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8 border-b-[3px] border-charcoal pb-4">
              <div>
                <h2 className="text-3xl font-dela text-charcoal select-none">{activeTab}</h2>
                <p className="text-slate-500 text-xs font-dot font-bold uppercase tracking-widest mt-1">Management Panel</p>
              </div>
              <button 
                onClick={loadTab} 
                className="h-12 w-12 bg-white border-[3px] border-charcoal rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#18181A] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[4px_4px_0px_#18181A] active:shadow-[1px_1px_0px_#18181A] transition-all cursor-pointer"
                title="再読み込み"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} strokeWidth={2.5} />
              </button>
            </header>

            {(activeTab === 'ホーム' || activeTab === '特典' || activeTab === '履歴') && (
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/60" size={20} strokeWidth={2.5} />
                <input 
                  type="text" 
                  placeholder="キーワードで検索..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-[3px] border-charcoal rounded-2xl text-base font-bold shadow-[4px_4px_0px_#18181A] focus:outline-none focus:bg-[#FAF7F2] transition-colors" 
                />
              </div>
            )}

            {activeTab === 'ホーム' && <HomeTab data={data} searchTerm={searchTerm} doAction={doAction} busy={busy} />}
            {activeTab === 'メニュー' && <MenuTab data={data} doAction={doAction} busy={busy} />}
            {activeTab === '食券ログ' && <TicketLogTab data={data} doAction={doAction} busy={busy} />}
            {activeTab === '通知' && <NotificationTab data={data} doAction={doAction} busy={busy} />}
            {activeTab === '特典' && <RewardsTab data={data} searchTerm={searchTerm} doAction={doAction} busy={busy} />}
            {activeTab === '履歴' && <HistoryTab data={data} />}
            {activeTab === 'レポート' && <ReportTab data={data} />}
            {activeTab === 'システム' && <SystemTab data={data} doAction={doAction} busy={busy} />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-[4px] border-charcoal px-4 py-3 flex justify-around items-center z-[100]">
        {[
          { label: 'ホーム', icon: Users },
          { label: 'ログ', icon: Clock, tab: '食券ログ' },
          { label: 'レポート', icon: BarChart2 },
        ].map(({ label, icon: Icon, tab }) => {
          const targetTab = tab || label;
          const isSelected = activeTab === targetTab;
          return (
            <Link 
              key={label}
              href={`/admin?tab=${targetTab}`}
              className={`flex flex-col items-center gap-1 transition-colors ${isSelected ? 'text-orange font-bold' : 'text-slate-500 font-medium'}`}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-dot">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ----------------- HOME TAB (USER MANAGEMENT & TRASH) -----------------
function HomeTab({ data, searchTerm, doAction, busy }: any) {
  const [subTab, setSubTab] = useState<'active' | 'trash'>('active');
  const activeUsers = (data?.users || []).filter((u: any) => 
    u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm)
  );
  const trashUsers = (data?.trashUsers || []).filter((u: any) => 
    u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm)
  );
  const c = data?.counts || {};

  const handleDelete = (id: number, nickname: string) => {
    if (window.confirm(`ユーザー「${nickname}」(ID:${id}) をゴミ箱に移動しますか？\n※20日以内であれば復元可能です。`)) {
      doAction('deleteUser', { id });
    }
  };

  const handleRestore = (id: number) => {
    if (window.confirm(`このユーザーを復元しますか？`)) {
      doAction('restoreUser', { id });
    }
  };

  const handleForceDelete = (id: number, nickname: string) => {
    if (window.confirm(`【警告】ユーザー「${nickname}」(ID:${id}) を完全に物理削除しますか？\nこの操作は取り消せず、関連するすべての履歴データも完全に削除されます。`)) {
      doAction('forceDeleteUser', { id });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Counts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '総ユーザー', val: c.users, bg: 'bg-lime' },
          { label: '総スキャン', val: c.hashes, bg: 'bg-yellow' },
          { label: 'メニュー数', val: c.menus, bg: 'bg-orange text-white' },
          { label: 'ゴミ箱', val: c.trashUsers, bg: 'bg-charcoal text-white' }
        ].map(({ label, val, bg }) => (
          <div key={label} className={`neo-card p-5 ${bg} border-[3px] border-charcoal shadow-[3px_3px_0px_#18181A]`}>
            <p className="text-[10px] font-dot font-black uppercase tracking-wider mb-1 opacity-80">{label}</p>
            <p className="text-3xl font-dela leading-none">{val ?? 0}</p>
          </div>
        ))}
      </div>

      {/* User Tabs */}
      <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] overflow-hidden">
        <div className="p-6 border-b-[3px] border-charcoal bg-[#FAF7F2] flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setSubTab('active')}
              className={`px-4 py-2 border-[2px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] transition-all select-none ${
                subTab === 'active' ? 'bg-lime text-charcoal translate-y-[1px]' : 'bg-white text-charcoal'
              }`}
            >
              通常ユーザー ({activeUsers.length})
            </button>
            <button 
              onClick={() => setSubTab('trash')}
              className={`px-4 py-2 border-[2px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] transition-all select-none ${
                subTab === 'trash' ? 'bg-charcoal text-white translate-y-[1px]' : 'bg-white text-charcoal'
              }`}
            >
              ゴミ箱 ({trashUsers.length})
            </button>
          </div>
          <span className="text-[9px] font-dot font-black text-slate-500 tracking-wider">※ゴミ箱のユーザーは20日後に自動消去されます。</span>
        </div>

        {subTab === 'active' ? (
          <div className="divide-y-[2px] divide-charcoal/10 bg-white">
            {activeUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-dot font-bold">該当するユーザーはいません</div>
            ) : (
              activeUsers.map((u: any) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border-[2px] border-charcoal bg-[#FAF7F2] flex items-center justify-center font-dela text-sm shadow-[2px_2px_0px_#18181A]">
                      ID:{u.id}
                    </div>
                    <div>
                      <p className="font-dela text-base">{u.nickname}</p>
                      <p className="text-xs text-slate-500 font-dot font-bold mt-1">
                        {u.email || '未設定'} • {u.stamps} stamps • {new Date(u.created_at).toLocaleDateString('ja-JP')}登録
                      </p>
                    </div>
                  </div>
                  <button 
                    disabled={busy} 
                    onClick={() => handleDelete(u.id, u.nickname)} 
                    className="p-3 bg-red-100 hover:bg-red-200 border-[2px] border-charcoal rounded-xl text-charcoal shadow-[2px_2px_0px_#18181A] transition disabled:opacity-50 cursor-pointer"
                    title="ゴミ箱へ移動"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y-[2px] divide-charcoal/10 bg-white">
            {trashUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-dot font-bold">ゴミ箱は空です</div>
            ) : (
              trashUsers.map((u: any) => {
                const deletedDate = new Date(u.deleted_at);
                const remainingDays = 20 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border-[2px] border-charcoal bg-charcoal text-white flex items-center justify-center font-dela text-sm shadow-[2px_2px_0px_#18181A]">
                        ID:{u.id}
                      </div>
                      <div>
                        <p className="font-dela text-base text-slate-500 line-through">{u.nickname}</p>
                        <p className="text-xs text-red-500 font-dot font-bold mt-1">
                          {new Date(u.deleted_at).toLocaleDateString('ja-JP')} 削除 • 自動削除まであと {remainingDays > 0 ? `${remainingDays} 日` : '即時'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={busy} 
                        onClick={() => handleRestore(u.id)} 
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white border-[2px] border-charcoal rounded-xl text-xs font-dela shadow-[2px_2px_0px_#18181A] transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        title="元に戻す"
                      >
                        <RotateCcw size={14} strokeWidth={2.5} />
                        復元
                      </button>
                      <button 
                        disabled={busy} 
                        onClick={() => handleForceDelete(u.id, u.nickname)} 
                        className="p-2.5 bg-red-600 hover:bg-red-700 text-white border-[2px] border-charcoal rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                        title="完全に物理削除"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- MENU TAB -----------------
function MenuTab({ data, doAction, busy }: any) {
  const menus = data?.menus || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Menu Form */}
      <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
        <h2 className="text-xl font-dela text-charcoal flex items-center gap-2 mb-6 border-b-[2px] border-charcoal pb-2">
          <Utensils size={20} className="text-orange" strokeWidth={2.5} />
          メニュー追加
        </h2>
        <form onSubmit={async (e) => { 
          e.preventDefault(); 
          const fd = new FormData(e.currentTarget);
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
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">メニュー名</label>
            <input required type="text" name="name" placeholder="例: 唐揚げ丼" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">価格 (円)</label>
            <input type="number" name="price" placeholder="例: 450" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">説明</label>
            <input type="text" name="description" placeholder="説明文を入力..." className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">画像パス (images/xxx.jpg)</label>
            <input type="text" name="image_url" placeholder="例: images/udon.jpg" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">曜日指定 (日替わり用)</label>
            <select name="day_of_week" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none">
              <option value="">曜日指定なし（常設）</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl cursor-pointer hover:bg-[#eae6de] transition">
              <input type="checkbox" name="is_today_special" value="true" className="w-4 h-4 accent-orange" />
              <span className="text-sm font-dela text-charcoal">本日限定に指定</span>
            </label>
            <button type="submit" disabled={busy} className="px-6 py-3.5 bg-orange text-white border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-orange/90 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50">
              追加する
            </button>
          </div>
        </form>
      </div>

      {/* Menu List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menus.map((m: any) => (
          <div key={m.id} className="bg-white p-5 rounded-2xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] flex items-center justify-between relative overflow-hidden group">
            {m.is_today_special && <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-orange" />}
            {m.day_of_week && !m.is_today_special && <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-lime" />}
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-dela text-base">{m.name}</p>
                {m.day_of_week && <span className="bg-lime text-charcoal text-[9px] font-dot font-black px-2 py-0.5 border border-charcoal rounded-md">{m.day_of_week}</span>}
                {m.is_today_special && !m.day_of_week && <span className="bg-orange text-white text-[9px] font-dot font-black px-2 py-0.5 border border-charcoal rounded-md">本日限定</span>}
              </div>
              <p className="text-xs text-slate-500 font-dot font-bold">{m.description || '説明なし'} • ¥{m.price || '未設定'}</p>
            </div>
            <button 
              disabled={busy} 
              onClick={() => { if(confirm('このメニューを削除しますか？')) doAction('deleteMenu', { id: m.id }) }} 
              className="p-3 bg-red-100 hover:bg-red-200 border-[2px] border-charcoal rounded-xl text-charcoal transition opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------- TICKET LOG TAB -----------------
function TicketLogTab({ data, doAction, busy }: any) {
  const [csvContent, setCsvContent] = useState('');
  const submissions = data?.submissions || [];
  const users = data?.users || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent) return;
    await doAction('importTicketLogs', { csv: csvContent });
    setCsvContent('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CSV Import */}
        <div className="bg-white rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b-[2px] border-charcoal pb-2">
            <h3 className="font-dela text-charcoal flex items-center gap-2 text-base">
              <Plus size={18} strokeWidth={2.5} />
              食券ログ・インポート
            </h3>
            <span className="text-[10px] font-dot font-black text-slate-500 uppercase tracking-widest bg-[#FAF7F2] border border-charcoal px-2 py-1 rounded">CSV Sync</span>
          </div>

          <div className="flex-1 space-y-6">
            <div className="p-8 border-[3px] border-dashed border-charcoal rounded-2xl text-center bg-[#FAF7F2] hover:bg-[#eae6de] transition-all group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white border-[3px] border-charcoal rounded-full flex items-center justify-center shadow-[2px_2px_0px_#18181A] group-hover:scale-110 transition">
                  <Search size={24} className="text-charcoal" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-dela text-charcoal">{csvContent ? 'ファイル読み込み完了！' : 'CSVファイルを選択'}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-dot leading-relaxed">
                    形式: 機番, 番号, 時刻<br/>
                    (例: 1, 183280, 2026-07-05 12:00:00)
                  </p>
                </div>
              </label>
            </div>
            
            <button 
              disabled={busy || !csvContent} 
              onClick={handleImport}
              className="w-full py-4 bg-lime text-charcoal border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-lime/95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} strokeWidth={2.5} />}
              照合プロセスを実行
            </button>
          </div>
        </div>

        {/* Manual Registry */}
        <div className="bg-white rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
          <div className="flex items-center justify-between mb-6 border-b-[2px] border-charcoal pb-2">
            <h3 className="font-dela text-charcoal flex items-center gap-2 text-base">
              <Hash size={18} strokeWidth={2.5} />
              手動スタンプ登録
            </h3>
            <span className="text-[10px] font-dot font-black text-slate-500 uppercase tracking-widest bg-[#FAF7F2] border border-charcoal px-2 py-1 rounded">Manual</span>
          </div>

          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            const fd = new FormData(e.currentTarget);
            await doAction('addSubmissionManual', { 
              machine_id: fd.get('machine_id'),
              ticket_number: fd.get('ticket_number'), 
              user_id: fd.get('user_id') 
            });
            (e.target as HTMLFormElement).reset();
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-dot font-black text-slate-500 uppercase block ml-1">食券機番号</label>
                <select name="machine_id" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none">
                  <option value="1">1号機</option>
                  <option value="2">2号機</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-dot font-black text-slate-500 uppercase block ml-1">通し番号</label>
                <input required type="number" name="ticket_number" placeholder="183280" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-dot font-black text-slate-500 uppercase block ml-1">対象ユーザー</label>
              <select required name="user_id" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none">
                <option value="">ユーザーを選択してください</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.nickname} (ID:{u.id})</option>)}
              </select>
            </div>

            <button type="submit" disabled={busy} className="w-full py-4 bg-orange text-white border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-orange/90 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} strokeWidth={2.5} />}
              即時登録を実行 (Verified)
            </button>
          </form>
        </div>
      </div>

      {/* Submissions Queue */}
      <div className="bg-white rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] overflow-hidden">
        <div className="p-6 border-b-[2px] border-charcoal bg-[#FAF7F2]">
          <h2 className="font-dela text-lg">ユーザー投稿と照合状況</h2>
          <p className="text-[10px] text-slate-500 font-dot font-bold mt-1 uppercase tracking-widest">Real-time Submission Queue</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2]/50 text-[10px] font-dot font-black text-slate-500 uppercase tracking-widest border-b-[2px] border-charcoal">
                <th className="px-6 py-4">機番 / 食券番号</th>
                <th className="px-6 py-4">投稿ユーザー</th>
                <th className="px-6 py-4">日時</th>
                <th className="px-6 py-4">ステータス</th>
                <th className="px-6 py-4 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-charcoal/10">
              {submissions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-dot font-bold">待機中の投稿はありません</td></tr>
              ) : (
                submissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center text-xs font-dela">{s.machine_id}号機</div>
                        <span className="font-mono font-black text-slate-800 text-lg">#{s.ticket_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-dela text-xs text-charcoal">UID: {s.user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-dot font-bold">
                      {new Date(s.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 border-[2px] border-charcoal rounded-lg text-[9px] font-dela uppercase shadow-[1px_1px_0px_#18181A] ${
                        s.status === 'verified' ? 'bg-lime text-charcoal' : 
                        s.status === 'invalid' ? 'bg-red-500 text-white' : 
                        'bg-yellow text-charcoal'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        disabled={busy} 
                        onClick={() => { if(confirm('この投稿を削除しますか？')) doAction('deleteSubmission', { id: s.id }) }} 
                        className="p-2.5 bg-red-100 hover:bg-red-200 border-[2px] border-charcoal rounded-xl text-charcoal transition disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------- NOTIFICATION TAB -----------------
function NotificationTab({ data, doAction, busy }: any) {
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Create Notification */}
      <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
        <h2 className="text-xl font-dela text-charcoal flex items-center gap-2 mb-6 border-b-[2px] border-charcoal pb-2">
          <MessageSquare size={20} className="text-lime" strokeWidth={2.5} />
          全体お知らせ配信
        </h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await doAction('addNotification', {
            title: fd.get('title'),
            content: fd.get('content'),
            type: fd.get('type')
          });
          (e.target as HTMLFormElement).reset();
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-dot font-bold text-slate-500 ml-1">件名 (タイトル)</label>
              <input required type="text" name="title" placeholder="例: システムアップデートのお知らせ" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-dot font-bold text-slate-500 ml-1">種類</label>
              <select name="type" className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none">
                <option value="info">インフォメーション (青)</option>
                <option value="success">キャンペーン・お祝い (緑)</option>
                <option value="warning">システムメンテナンス・警告 (赤)</option>
                <option value="lottery">抽選関連 (紫)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-dot font-bold text-slate-500 ml-1">配信内容</label>
            <textarea required rows={3} name="content" placeholder="学生へ伝える本文を入力してください..." className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" />
          </div>
          <button type="submit" disabled={busy} className="w-full py-4 bg-lime text-charcoal border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-lime/95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50">
            お知らせを一斉配信する
          </button>
        </form>
      </div>

      {/* Notification Queue */}
      <div className="bg-white rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] overflow-hidden">
        <div className="p-6 border-b-[2px] border-charcoal bg-[#FAF7F2]">
          <h3 className="font-dela text-lg">過去のお知らせ</h3>
          <p className="text-[10px] text-slate-500 font-dot font-bold mt-1 uppercase tracking-widest">Global Broadcast List</p>
        </div>
        
        <div className="divide-y-[2px] divide-charcoal/10 bg-white">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-dot font-bold">配信中のお知らせはありません</div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 border border-charcoal rounded text-[9px] font-dela shadow-[1px_1px_0px_#18181A] ${
                      n.type === 'warning' ? 'bg-red-500 text-white' : 
                      n.type === 'success' ? 'bg-lime text-charcoal' : 
                      n.type === 'lottery' ? 'bg-orange text-white' : 
                      'bg-yellow text-charcoal'
                    }`}>
                      {n.type?.toUpperCase()}
                    </span>
                    <h4 className="font-dela text-base text-charcoal">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 font-dot font-bold ml-2">
                      {new Date(n.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{n.content}</p>
                </div>
                <button 
                  disabled={busy} 
                  onClick={() => { if(confirm('このお知らせを削除しますか？')) doAction('deleteNotification', { id: n.id }) }} 
                  className="p-2.5 bg-red-100 hover:bg-red-200 border-[2px] border-charcoal rounded-xl text-charcoal transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- REWARDS TAB (STAMP MANAGEMENT & LOTTERY) -----------------
function RewardsTab({ data, searchTerm, doAction, busy }: any) {
  const users = (data?.users || []).filter((u: any) => 
    u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toString().includes(searchTerm)
  );

  const [pendingChanges, setPendingChanges] = useState<{ [userId: number]: { stamps: number, tickets: number } }>({});

  const updatePending = (userId: number, type: 'stamps' | 'tickets', step: number) => {
    const originalUser = users.find((u: any) => u.id === userId);
    if (!originalUser) return;

    setPendingChanges(prev => {
      const userChange = prev[userId] || { 
        stamps: originalUser.stamps || 0,
        tickets: originalUser.tickets || 0
      };
      
      const updatedChange = { ...userChange };
      if (type === 'stamps') {
        updatedChange.stamps = Math.max(0, userChange.stamps + step);
      } else {
        updatedChange.tickets = Math.max(0, userChange.tickets + step);
      }

      if (updatedChange.stamps === originalUser.stamps && updatedChange.tickets === (originalUser.tickets || 0)) {
        const next = { ...prev };
        delete next[userId];
        return next;
      }

      return {
        ...prev,
        [userId]: updatedChange
      };
    });
  };

  const getDisplayVal = (userId: number, originalStamps: number, originalTickets: number) => {
    const change = pendingChanges[userId];
    return {
      stamps: change ? change.stamps : originalStamps,
      tickets: change ? change.tickets : originalTickets,
      isModified: !!change
    };
  };

  const handleSaveAll = async () => {
    const changeList = Object.keys(pendingChanges).map(idStr => {
      const userId = Number(idStr);
      return {
        userId,
        stamps: pendingChanges[userId].stamps,
        tickets: pendingChanges[userId].tickets
      };
    });

    if (changeList.length === 0) return;

    if (window.confirm(`${changeList.length}件の変更を保存しますか？`)) {
      await doAction('updateStampsBulk', { changes: changeList });
      setPendingChanges({});
    }
  };

  const handleCancelAll = () => {
    if (window.confirm('すべての未保存の変更を取り消しますか？')) {
      setPendingChanges({});
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Pending changes bar */}
      {pendingCount > 0 && (
        <div className="neo-card bg-yellow p-4 border-[3px] border-charcoal shadow-[3px_3px_0px_#18181A] flex items-center justify-between animate-in slide-in-from-top-2 duration-300 rounded-2xl">
          <div className="flex items-center gap-2 font-dela text-charcoal text-sm">
            <AlertTriangle size={18} strokeWidth={2.5} />
            <span>未保存の変更が {pendingCount} 件あります</span>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={busy} 
              onClick={handleSaveAll}
              className="px-4 py-2 bg-lime hover:bg-lime/90 text-charcoal border-[2.5px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition cursor-pointer"
            >
              変更を保存する
            </button>
            <button 
              disabled={busy} 
              onClick={handleCancelAll}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-charcoal border-[2.5px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition cursor-pointer"
            >
              取り消す
            </button>
          </div>
        </div>
      )}

      {/* Stamp editor */}
      <div className="bg-orange rounded-3xl p-6 border-[3px] border-charcoal text-white shadow-[4px_4px_0px_#18181A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-dela mb-1">ユーザー個別スタンプ直接編集</h2>
              <p className="text-orange-100 text-xs font-dot font-black uppercase tracking-wider">Direct Stamp Modifier</p>
            </div>
            {pendingCount > 0 && (
              <button 
                onClick={handleSaveAll}
                disabled={busy}
                className="px-4 py-2.5 bg-lime text-charcoal border-[2.5px] border-charcoal rounded-xl text-xs font-dela shadow-[2px_2px_0px_#18181A] hover:bg-lime/90 transition cursor-pointer"
              >
                {pendingCount}件の変更を保存
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {users.length === 0 ? (
              <div className="text-center py-10 text-orange-200 font-dot font-bold">ユーザーが見つかりません</div>
            ) : (
              users.map((u: any) => {
                const { stamps, tickets, isModified } = getDisplayVal(u.id, u.stamps, u.tickets || 0);
                return (
                  <div key={u.id} className={`rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-white border-[2px] transition-colors ${
                    isModified 
                      ? 'bg-white/20 border-lime shadow-[inset_0_0_8px_rgba(255,255,255,0.2)]' 
                      : 'bg-white/10 border-white/20'
                  }`}>
                    {/* 1. User Info (col-span-5) */}
                    <div className="flex items-center gap-3 md:col-span-5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border-[2px] border-charcoal text-charcoal flex items-center justify-center font-dela text-base shadow-[2px_2px_0px_#18181A] shrink-0">
                        {u.nickname[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-dela text-base truncate max-w-[10rem] md:max-w-[15rem]" title={u.nickname}>{u.nickname}</p>
                          {isModified && (
                            <span className="bg-lime text-charcoal text-[8px] font-dot font-black px-1.5 py-0.5 border border-charcoal rounded shadow-[1px_1px_0px_#18181A] shrink-0">
                              変更あり
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-orange-100 font-dot">ID: {u.id}</p>
                      </div>
                    </div>

                    {/* 2. Stamps Controls (col-span-3) */}
                    <div className="flex justify-start md:justify-center md:col-span-3">
                      <div className="flex items-center gap-4 bg-charcoal text-white border-[2px] border-charcoal rounded-xl px-3 py-2 shadow-[2px_2px_0px_#18181A] w-full max-w-[12rem] justify-between">
                        <button 
                          onClick={() => updatePending(u.id, 'stamps', -1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/30 flex items-center justify-center font-black transition cursor-pointer"
                        >
                          -
                        </button>
                        <div className="flex flex-col items-center min-w-[3rem]">
                          <span className="text-[9px] font-dot font-black text-slate-400">STAMPS</span>
                          <span className={`font-dela text-lg leading-none mt-1 ${isModified ? 'text-lime' : ''}`}>{stamps}</span>
                        </div>
                        <button 
                          onClick={() => updatePending(u.id, 'stamps', 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/30 flex items-center justify-center font-black transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 3. Tickets Controls (col-span-4) */}
                    <div className="flex justify-start md:justify-end md:col-span-4">
                      <div className="flex items-center gap-4 bg-charcoal text-white border-[2px] border-charcoal rounded-xl px-3 py-2 shadow-[2px_2px_0px_#18181A] w-full max-w-[12rem] justify-between">
                        <div className="flex flex-col items-center min-w-[3.5rem]">
                          <span className="text-[9px] font-dot font-black text-slate-400">TICKETS</span>
                          <span className={`font-dela text-lg leading-none mt-1 ${isModified ? 'text-lime' : ''}`}>{tickets}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => updatePending(u.id, 'tickets', 1)}
                            className="w-7 h-5 rounded bg-white/10 hover:bg-white/30 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => updatePending(u.id, 'tickets', -1)}
                            className="w-7 h-5 rounded bg-white/10 hover:bg-white/30 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Lottery Winners list */}
      <div className="bg-white p-6 rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] relative">
        <button 
          disabled={busy} 
          onClick={() => { if(confirm('今月の抽選を実行しますか？\n（※当選者が選出され、全員の抽選券（TICKETS）はリセットされます）')) doAction('runLottery', {}) }} 
          className="md:absolute md:top-6 md:right-6 bg-lime text-charcoal border-[3px] border-charcoal px-5 py-3.5 rounded-xl text-xs font-dela shadow-[3px_3px_0px_#18181A] hover:bg-lime/90 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 cursor-pointer flex items-center gap-2 mb-6 md:mb-0 justify-center w-full md:w-auto"
        >
          <Award size={16} strokeWidth={2.5} />
          月間抽選を実行
        </button>
        
        <div className="flex items-center gap-3 mb-6 border-b-[2px] border-charcoal pb-2">
          <div className="w-10 h-10 bg-indigo-50 border-[2px] border-charcoal text-indigo-600 rounded-xl flex items-center justify-center">
            <Award size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-dela text-base">月間抽選・当選履歴</h3>
            <p className="text-[10px] text-slate-500 font-dot font-bold">抽選券保有ユーザーからランダム当選</p>
          </div>
        </div>
        
        {(!data?.winners || data.winners.length === 0) ? (
          <div className="bg-[#FAF7F2] rounded-2xl p-12 text-slate-400 text-xs font-dot font-black border-[3px] border-dashed border-charcoal/20 uppercase tracking-widest text-center">
            抽選履歴はありません
          </div>
        ) : (
          <div className="divide-y-[2px] divide-charcoal/10 text-sm">
            {data.winners.map((w: any) => (
              <div key={w.id} className="py-4 flex justify-between items-center hover:bg-slate-50/50 px-2 transition">
                <div>
                  <span className="font-dela text-base text-charcoal">{w.nickname}</span>
                  <span className="text-xs text-slate-400 font-dot font-bold ml-2">ID: {w.user_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-dela text-indigo-700 bg-indigo-50 border-[2px] border-charcoal px-2 py-1 rounded-lg shadow-[1px_1px_0px_#18181A]">
                    {w.month} 当選
                  </span>
                  <p className="text-[10px] text-slate-400 font-dot font-bold mt-2">{new Date(w.created_at).toLocaleDateString('ja-JP')} 決定</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- HISTORY TAB -----------------
function HistoryTab({ data }: any) {
  const history = data?.history || [];
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] overflow-hidden">
        <div className="p-6 border-b-[2px] border-charcoal bg-[#FAF7F2] flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-dela text-lg flex items-center gap-2">
            <Clock size={20} className="text-lime" strokeWidth={2.5} />
            全スキャン履歴 (直近100件)
          </h2>
          <span className="bg-lime text-charcoal text-[10px] font-dot font-black px-3 py-1 border-[2px] border-charcoal rounded-full shadow-[1px_1px_0px_#18181A]">
            {history.length} RECORDS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-slate-500 text-[10px] font-dot font-black uppercase tracking-widest border-b-[2px] border-charcoal">
                <th className="px-6 py-4">日付/時刻</th>
                <th className="px-6 py-4">ユーザー</th>
                <th className="px-6 py-4">価格</th>
                <th className="px-6 py-4">照合ハッシュ</th>
                <th className="px-6 py-4">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-charcoal/10 text-sm bg-white">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-dot font-bold">スキャン履歴はありません</td></tr>
              ) : (
                history.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-slate-700">
                      <span className="font-dela text-sm">{item.date}</span>
                      <br/>
                      <span className="text-[10px] text-slate-400 font-dot font-bold">{item.time}</span>
                    </td>
                    <td className="px-6 py-4 font-dela text-xs text-charcoal">UID: {item.user_id}</td>
                    <td className="px-6 py-4 font-dela text-sm text-charcoal">¥{item.price}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500 select-all">{item.hash}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 border-[2px] border-charcoal rounded-lg text-[9px] font-dela shadow-[1px_1px_0px_#18181A] ${
                        item.status === 'success' ? 'bg-lime text-charcoal' : 'bg-red-500 text-white'
                      }`}>
                        {item.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------- REPORT TAB (CUSTOM GRAPH RENDERING) -----------------
function ReportTab({ data }: any) {
  const [range, setRange] = useState<'day' | 'month'>('day');

  // SVGグラフを描画するためのデータを整形
  const logs = range === 'day' ? (data?.dayLogs || []) : (data?.monthLogs || []);
  const subs = range === 'day' ? (data?.daySubmissions || []) : (data?.monthSubmissions || []);

  // 全ての日程/月一覧をマージしてソート
  const keysSet = new Set<string>();
  logs.forEach((l: any) => keysSet.add(range === 'day' ? l.date : l.month));
  subs.forEach((s: any) => keysSet.add(range === 'day' ? s.date : s.month));
  const sortedKeys = Array.from(keysSet).sort();

  // キーごとのログ数・登録数をマージ
  const chartData = sortedKeys.map(key => {
    const logItem = logs.find((l: any) => (range === 'day' ? l.date : l.month) === key);
    const subItem = subs.find((s: any) => (range === 'day' ? s.date : s.month) === key);
    const logCount = Number(logItem?.count || 0);
    const subCount = Number(subItem?.count || 0);
    const rate = logCount > 0 ? Math.round((subCount / logCount) * 100) : 0;
    return {
      key,
      logCount,
      subCount,
      rate
    };
  });

  // グラフ描画に必要なパラメーター
  const maxVal = Math.max(...chartData.map(d => Math.max(d.logCount, d.subCount)), 10);
  const chartHeight = 250;
  const paddingBottom = 40;
  const paddingLeft = 50;
  const paddingTop = 20;
  const paddingRight = 20;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = range === 'day' ? 24 : 40;
  const gap = range === 'day' ? 20 : 35;
  const chartWidth = paddingLeft + paddingRight + chartData.length * (barWidth + gap);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Range switch */}
      <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-dela text-lg">食券機ログ vs アプリ登録カバー率</h3>
          <p className="text-[10px] text-slate-500 font-dot font-bold mt-1">
            背景: 食券機からインポートされた総ログ数 / 手前: アプリで照合完了したスタンプ数
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setRange('day')}
            className={`px-4 py-2 border-[2px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] transition-all cursor-pointer ${
              range === 'day' ? 'bg-orange text-white translate-y-[1px]' : 'bg-white text-charcoal'
            }`}
          >
            日別 (30日間)
          </button>
          <button 
            onClick={() => setRange('month')}
            className={`px-4 py-2 border-[2px] border-charcoal rounded-lg font-dela text-xs shadow-[2px_2px_0px_#18181A] transition-all cursor-pointer ${
              range === 'month' ? 'bg-orange text-white translate-y-[1px]' : 'bg-white text-charcoal'
            }`}
          >
            月別 (12ヶ月間)
          </button>
        </div>
      </div>

      {/* SVG Graph container */}
      <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
        {chartData.length === 0 ? (
          <div className="p-24 text-center font-dot font-black text-slate-400 border-[3px] border-dashed border-charcoal/10 rounded-2xl">
            データがありません。先にCSVインポート等を行ってください。
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto pb-4">
              <div style={{ width: chartWidth }} className="h-[270px] relative">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const y = paddingTop + innerHeight * (1 - p);
                    const value = Math.round(maxVal * p);
                    return (
                      <g key={idx}>
                        <line 
                          x1={paddingLeft} 
                          y1={y} 
                          x2={chartWidth - paddingRight} 
                          y2={y} 
                          stroke="#18181A" 
                          strokeWidth="1.5"
                          strokeDasharray="4 6"
                          opacity="0.15"
                        />
                        <text 
                          x={paddingLeft - 10} 
                          y={y + 4} 
                          textAnchor="end" 
                          className="font-dot font-black text-[10px] fill-slate-500"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  {/* Left border line */}
                  <line 
                    x1={paddingLeft} 
                    y1={paddingTop} 
                    x2={paddingLeft} 
                    y2={chartHeight - paddingBottom} 
                    stroke="#18181A" 
                    strokeWidth="3"
                  />
                  {/* Bottom axis line */}
                  <line 
                    x1={paddingLeft} 
                    y1={chartHeight - paddingBottom} 
                    x2={chartWidth - paddingRight} 
                    y2={chartHeight - paddingBottom} 
                    stroke="#18181A" 
                    strokeWidth="3"
                  />

                  {/* Bars rendering */}
                  {chartData.map((d, idx) => {
                    const x = paddingLeft + idx * (barWidth + gap) + gap / 2;
                    
                    // Log Total Bar (Background / Wide)
                    const logBarHeight = (d.logCount / maxVal) * innerHeight;
                    const logY = chartHeight - paddingBottom - logBarHeight;

                    // Verified Stamp Bar (Foreground / Slim)
                    const subBarHeight = (d.subCount / maxVal) * innerHeight;
                    const subY = chartHeight - paddingBottom - subBarHeight;
                    const subBarWidth = barWidth * 0.65;
                    const subX = x + (barWidth - subXWidthOffsetHelper(barWidth, subBarWidth)) / 2;

                    // Label Formatting
                    const label = range === 'day' 
                      ? d.key.substring(5) // MM-DD
                      : d.key; // YYYY-MM

                    return (
                      <g key={d.key} className="group">
                        {/* Tooltip hint on hover (can be SVG title) */}
                        <title>
                          {`日付: ${d.key}\n食券機ログ: ${d.logCount}件\nアプリ照合: ${d.subCount}件\nカバー率: ${d.rate}%`}
                        </title>

                        {/* Total Log Bar (Wide / Grayish border + Pattern) */}
                        {d.logCount > 0 && (
                          <rect 
                            x={x}
                            y={logY}
                            width={barWidth}
                            height={logBarHeight}
                            fill="#E2E8F0"
                            stroke="#18181A"
                            strokeWidth="2.5"
                            rx="4"
                          />
                        )}

                        {/* Verified Stamp Bar (Narrow / Bright Lime or Orange) */}
                        {d.subCount > 0 && (
                          <rect 
                            x={x + (barWidth - subBarWidth) / 2}
                            y={subY}
                            width={subBarWidth}
                            height={subBarHeight}
                            fill="#00F5A0"
                            stroke="#18181A"
                            strokeWidth="2.5"
                            rx="2"
                            className="transition-all group-hover:fill-lime"
                          />
                        )}

                        {/* Rate Badge text above the bar */}
                        {d.logCount > 0 && (
                          <text 
                            x={x + barWidth / 2} 
                            y={Math.min(logY, subY) - 6} 
                            textAnchor="middle" 
                            className="font-dot font-black text-[9px] fill-charcoal bg-white"
                          >
                            {d.rate}%
                          </text>
                        )}

                        {/* Date Label on X Axis */}
                        <text 
                          x={x + barWidth / 2} 
                          y={chartHeight - paddingBottom + 18} 
                          textAnchor="middle" 
                          className="font-dot font-black text-[10px] fill-charcoal"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Legend & Summary Info */}
            <div className="flex flex-wrap justify-between items-center gap-6 pt-4 border-t-[3px] border-charcoal bg-[#FAF7F2] p-4 rounded-xl">
              <div className="flex gap-4 flex-wrap text-xs font-dela">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#E2E8F0] border-[2px] border-charcoal rounded" />
                  <span>食券機ログ総数 (全体)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00F5A0] border-[2px] border-charcoal rounded" />
                  <span>アプリ照合完了スタンプ数 (Verified)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-dot font-black text-slate-500 uppercase tracking-widest block">合計カバー率</span>
                <span className="text-3xl font-dela text-orange">
                  {chartData.reduce((acc, curr) => acc + curr.logCount, 0) > 0
                    ? Math.round(
                        (chartData.reduce((acc, curr) => acc + curr.subCount, 0) / 
                         chartData.reduce((acc, curr) => acc + curr.logCount, 0)) * 100
                      )
                    : 0}%
                </span>
                <span className="text-xs font-dot font-black text-slate-400 block mt-1">
                  ({chartData.reduce((acc, curr) => acc + curr.subCount, 0)} / {chartData.reduce((acc, curr) => acc + curr.logCount, 0)} 件中)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function subXWidthOffsetHelper(totalWidth: number, targetWidth: number) {
  return targetWidth;
}

// ----------------- SYSTEM / DEBUG TAB -----------------
function SystemTab({ data, doAction, busy }: any) {
  const [testEmail, setTestEmail] = useState('');
  const smtpConfigured = data?.smtpConfigured;
  const smtpUser = data?.smtpUser;

  const handleSendTestMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    await doAction('sendTestEmail', { to: testEmail });
  };

  const handleSeed = () => {
    if (window.confirm('データベースにテスト用のダミーデータ（メニュー、ユーザー、30日分の食券機ログ等）を流し込みますか？')) {
      doAction('seedDummyData', {});
    }
  };

  const handleReset = () => {
    if (window.confirm('【警告】データベースを完全に初期化（全データをリセット）しますか？\n登録済みの全ユーザー、全メニュー、全スキャン履歴が消去されます。')) {
      doAction('resetDatabase', {});
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Email Send Test */}
        <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
          <div className="flex items-center gap-3 mb-6 border-b-[2px] border-charcoal pb-2">
            <div className="w-10 h-10 bg-orange/10 border-[2px] border-charcoal text-orange rounded-xl flex items-center justify-center">
              <Mail size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-dela text-base">メール送信テスト</h3>
              <p className="text-[10px] text-slate-500 font-dot font-bold">SMTP / Resend / Gmail 接続疎通確認</p>
            </div>
          </div>

          {/* SMTP Status indicators */}
          <div className="mb-6 p-4 border-[3px] border-charcoal rounded-2xl text-xs font-bold font-dot flex items-center gap-2 bg-[#FAF7F2] shadow-[2px_2px_0px_#18181A]">
            <span className="text-slate-500">接続ステータス:</span>
            {smtpConfigured ? (
              <span className="bg-lime text-charcoal px-2 py-1 border-[2px] border-charcoal rounded-lg flex items-center gap-1 font-dela text-[9px] shadow-[1px_1px_0px_#18181A]">
                <Check size={12} strokeWidth={3} /> 有効 ({smtpUser})
              </span>
            ) : (
              <span className="bg-red-500 text-white px-2 py-1 border-[2px] border-charcoal rounded-lg flex items-center gap-1 font-dela text-[9px] shadow-[1px_1px_0px_#18181A]">
                <X size={12} strokeWidth={3} /> 無効 (ログ出力モード)
              </span>
            )}
          </div>

          <form onSubmit={handleSendTestMail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-dot font-black text-slate-500 block uppercase ml-1">宛先メールアドレス</label>
              <input 
                required 
                type="email" 
                placeholder="test@example.com" 
                value={testEmail} 
                onChange={e => setTestEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-charcoal rounded-xl text-sm font-bold focus:bg-white focus:outline-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={busy} 
              className="w-full py-4 bg-orange text-white border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-orange/95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} strokeWidth={2.5} />}
              テストメールを送信
            </button>
          </form>
        </div>

        {/* Database debug operations */}
        <div className="neo-card bg-white border-[3px] border-charcoal shadow-[4px_4px_0px_#18181A] p-6">
          <div className="flex items-center gap-3 mb-6 border-b-[2px] border-charcoal pb-2">
            <div className="w-10 h-10 bg-yellow/20 border-[2px] border-charcoal text-charcoal rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-dela text-base">データベース操作 (デバッグ)</h3>
              <p className="text-[10px] text-slate-500 font-dot font-bold">テーブルリセット / シード実行</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleSeed}
              disabled={busy}
              className="w-full py-4 bg-yellow text-charcoal border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-yellow/90 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              テスト用ダミーデータを注入 (Seed)
            </button>

            <button 
              onClick={handleReset}
              disabled={busy}
              className="w-full py-4 bg-red-500 text-white border-[3px] border-charcoal rounded-xl font-dela shadow-[3px_3px_0px_#18181A] hover:bg-red-600 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              データベースを完全初期化 (Reset)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
