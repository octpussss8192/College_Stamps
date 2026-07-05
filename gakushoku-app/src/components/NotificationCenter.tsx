"use client";

import { Bell, X, Info, CheckCircle, AlertTriangle, Gift } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error("Notifications fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId: id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    const base = "w-9 h-9 rounded-xl border-[2px] border-charcoal flex items-center justify-center shadow-[2px_2px_0px_#18181A] shrink-0";
    switch (type) {
      case 'success': return <div className={`${base} bg-lime text-charcoal`}><CheckCircle size={16} strokeWidth={2.5} /></div>;
      case 'warning': return <div className={`${base} bg-red-500 text-white`}><AlertTriangle size={16} strokeWidth={2.5} /></div>;
      case 'lottery': return <div className={`${base} bg-orange text-white`}><Gift size={16} strokeWidth={2.5} /></div>;
      default: return <div className={`${base} bg-yellow text-charcoal`}><Info size={16} strokeWidth={2.5} /></div>;
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowList(true)}
        className="relative h-12 w-12 rounded-xl bg-white border-[3px] border-charcoal flex items-center justify-center shadow-[3px_3px_0px_#18181A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition-all cursor-pointer mr-3"
        title="お知らせ"
      >
        <Bell size={24} className="text-charcoal" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-lg bg-red-500 text-[10px] font-dot font-black text-white border-[2px] border-charcoal shadow-[1px_1px_0px_#18181A] animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </button>

      {showList && (
        <div className="fixed inset-0 z-[150] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowList(false)} />
          
          <div className="relative w-full max-w-md mx-auto mt-20 bg-white border-[4px] border-charcoal rounded-3xl shadow-[8px_8px_0px_#18181A] flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-300 max-h-[75vh]">
            {/* Header */}
            <div className="p-6 border-b-[3px] border-charcoal flex justify-between items-center bg-yellow">
              <h2 className="text-lg font-dela text-charcoal flex items-center gap-2">
                <Bell size={20} className="text-charcoal" strokeWidth={2.5} />
                お知らせセンター
              </h2>
              <button 
                onClick={() => setShowList(false)} 
                className="h-10 w-10 bg-white border-[2.5px] border-charcoal rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#18181A] hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <X size={18} className="text-charcoal" strokeWidth={3} />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#FAF7F2]">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-sm font-dot font-bold uppercase tracking-widest animate-pulse">LOADING...</div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-sm font-dot font-black border-[3px] border-dashed border-charcoal/20 rounded-2xl bg-white/50">
                  お知らせはありません
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-5 rounded-2xl transition-all cursor-pointer border-[3px] ${
                      n.is_read 
                        ? 'bg-white/40 border-charcoal/30 opacity-70 hover:opacity-100 hover:border-charcoal/50 hover:bg-white' 
                        : 'bg-white border-charcoal shadow-[4px_4px_0px_#18181A] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A]'
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-dela text-charcoal mb-2 leading-snug break-words ${n.is_read ? 'text-charcoal/70' : ''}`}>
                          {n.title}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {n.content}
                        </p>
                        <span className="text-[10px] text-slate-400 font-dot font-bold mt-4 block">
                          {new Date(n.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
