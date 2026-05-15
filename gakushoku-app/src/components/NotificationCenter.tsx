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
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={18} />;
      case 'lottery': return <Gift className="text-pink-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowList(true)}
        className="relative h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 hover:bg-white/30 transition shadow-sm mr-2"
      >
        <Bell size={26} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </button>

      {showList && (
        <div className="fixed inset-0 z-[150] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowList(false)} />
          <div className="relative w-full max-w-sm mx-auto mt-20 bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-300 max-h-[70vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Bell size={20} className="text-blue-600" />
                お知らせ
              </h2>
              <button onClick={() => setShowList(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="p-10 text-center text-slate-400 text-sm font-bold">読み込み中...</div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm font-bold">お知らせはありません</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold ${n.is_read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.content}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(n.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
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
