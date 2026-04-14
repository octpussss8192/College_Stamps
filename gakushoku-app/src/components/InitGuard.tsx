"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Fingerprint, Info, LogIn, UserPlus } from "lucide-react";

export default function InitGuard({ children }: { children: React.ReactNode }) {
  const [appMode, setAppMode] = useState<'demo' | 'release' | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndMode = async () => {
      const mode = localStorage.getItem('app_mode') as 'demo' | 'release' | null;
      if (mode === 'demo') {
        setAppMode('demo');
        setIsChecking(false);
        return;
      }

      if (mode === 'release') {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated) {
              setAppMode('release');
              setIsChecking(false);
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
        setAppMode('release');
        setShowAuth('login');
      }
      setIsChecking(false);
    };

    checkAuthAndMode();
  }, [pathname]);

  const selectMode = (mode: 'demo' | 'release') => {
    localStorage.setItem('app_mode', mode);
    setAppMode(mode);
    if (mode === 'release') {
      setShowAuth('login');
    } else {
      router.push('/');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = showAuth === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '認証に失敗しました');
      }

      setShowAuth(null);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Selection Screen
  if (!appMode && !showAuth) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col p-6 items-center justify-center text-white">
        <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">工クオン_学食スタンプ</h1>
            <p className="text-slate-400 text-sm">起動モードを選択してください</p>
          </div>

          <button 
            onClick={() => selectMode('demo')}
            className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition rounded-2xl p-5 flex flex-col gap-2 items-center justify-center text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-slate-300 mb-1 transition">
              <Info size={24} />
            </div>
            <h2 className="text-lg font-bold">デモ版 (Demo)</h2>
            <p className="text-slate-400 text-xs text-balance">登録不要・データは端末に保存</p>
          </button>

          <button 
            onClick={() => selectMode('release')}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 transition rounded-2xl p-5 flex flex-col gap-2 items-center justify-center text-center shadow-lg shadow-blue-500/30 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-1 transform group-hover:scale-110 transition">
              <Fingerprint size={24} />
            </div>
            <h2 className="text-lg font-bold">リリース版 (Release)</h2>
            <p className="text-blue-100 text-xs text-balance">要ユーザー登録・クラウドDB連携</p>
          </button>

          <button 
            onClick={() => {
              localStorage.setItem('app_mode', 'admin');
              router.push('/admin');
            }}
            className="w-full mt-4 bg-slate-800/50 border border-pink-500/30 hover:bg-pink-500/10 transition rounded-2xl p-4 flex gap-4 items-center justify-center text-center group"
          >
            <div className="text-pink-400">
              <Info size={20} />
            </div>
            <h2 className="text-sm font-bold text-pink-400">管理者デバッグモード (Admin)</h2>
          </button>
        </div>
      </div>
    );
  }

  // Auth Screen (Release mode only)
  if (appMode === 'release' && showAuth) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col p-6 items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {showAuth === 'login' ? 'ログイン' : 'ユーザー登録'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">リリース版を利用するには認証が必要です</p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">ニックネーム</label>
              <input 
                type="text" 
                required
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="学生太郎"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">パスワード</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-semibold text-center">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (showAuth === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />)}
              {showAuth === 'login' ? 'ログイン' : '登録する'}
            </button>
          </form>

          <div className="text-center mt-2">
            <button 
              type="button"
              onClick={() => setShowAuth(showAuth === 'login' ? 'register' : 'login')}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              {showAuth === 'login' ? 'アカウントを作成する' : 'すでにアカウントをお持ちの場合はログイン'}
            </button>
          </div>
          
          <button 
            type="button"
            onClick={() => {
              localStorage.removeItem('app_mode');
              setAppMode(null);
              setShowAuth(null);
            }}
            className="text-slate-400 text-xs mt-4 pt-4 border-t border-slate-100"
          >
            ← モード選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
