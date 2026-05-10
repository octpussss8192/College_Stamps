"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Fingerprint, Info, LogIn, UserPlus, Lock } from "lucide-react";

export default function InitGuard({ children }: { children: React.ReactNode }) {
  const [appMode, setAppMode] = useState<'demo' | 'release' | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  const [showAuth, setShowAuth] = useState<'login' | 'register' | 'reset' | null>(null);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

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

    let endpoint = '';
    let body = {};

    if (showAuth === 'login') {
      endpoint = '/api/auth/login';
      body = { nickname, password };
    } else if (showAuth === 'register') {
      endpoint = '/api/auth/register';
      body = { nickname, password, secretWord };
    } else if (showAuth === 'reset') {
      endpoint = '/api/auth/reset-password';
      body = { nickname, secretWord, newPassword };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '処理に失敗しました');
      }

      if (showAuth === 'reset') {
        alert('パスワードを更新しました。新しいパスワードでログインしてください。');
        setShowAuth('login');
        setPassword('');
        setNewPassword('');
        setSecretWord('');
      } else {
        setShowAuth(null);
        router.push('/');
        router.refresh();
      }
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
            onClick={() => setShowAdminAuth(true)}
            className="w-full mt-4 bg-slate-800/50 border border-pink-500/30 hover:bg-pink-500/10 transition rounded-2xl p-4 flex gap-4 items-center justify-center text-center group"
          >
            <div className="text-pink-400">
              <Lock size={20} />
            </div>
            <h2 className="text-sm font-bold text-pink-400">管理者デバッグモード (Admin)</h2>
          </button>
        </div>

        {/* Admin Password Overlay */}
        {showAdminAuth && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-pink-400" />
                </div>
                <h2 className="text-xl font-bold text-white">管理者認証</h2>
                <p className="text-slate-400 text-xs mt-1">管理パスワードを入力してください</p>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAdminAuthLoading(true);
                setAdminAuthError('');
                try {
                  const res = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
                    body: JSON.stringify({ action: 'verifyPassword', password: adminPassword }),
                  });
                  const data = await res.json();
                  if (data.valid) {
                    sessionStorage.setItem('admin_password', adminPassword);
                    localStorage.setItem('app_mode', 'admin');
                    router.push('/admin');
                  } else {
                    setAdminAuthError('パスワードが正しくありません');
                  }
                } catch (err) {
                  setAdminAuthError('認証中にエラーが発生しました');
                } finally {
                  setAdminAuthLoading(false);
                }
              }} className="flex flex-col gap-4">
                <input 
                  type="password"
                  required
                  autoFocus
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-pink-500 outline-none transition placeholder:text-slate-500"
                />
                
                {adminAuthError && (
                  <p className="text-red-400 text-xs font-semibold text-center">{adminAuthError}</p>
                )}
                
                <button 
                  type="submit"
                  disabled={adminAuthLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 transition shadow-lg shadow-pink-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adminAuthLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                  認証する
                </button>
              </form>
              
              <button
                type="button"
                onClick={() => { setShowAdminAuth(false); setAdminPassword(''); setAdminAuthError(''); }}
                className="w-full mt-3 text-slate-500 text-xs hover:text-slate-300 transition text-center"
              >
                ← 戻る
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Auth Screen (Release mode only)
  if (appMode === 'release' && showAuth) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col p-6 items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto max-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {showAuth === 'login' ? 'ログイン' : showAuth === 'register' ? 'ユーザー登録' : 'パスワード再設定'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {showAuth === 'reset' ? '秘密の言葉を入力してリセットしてください' : 'リリース版を利用するには認証が必要です'}
            </p>
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
            
            {(showAuth === 'login' || showAuth === 'register') && (
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
            )}

            {showAuth === 'register' && (
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">秘密の言葉（再設定に使用）</label>
                <input 
                  type="text" 
                  required
                  value={secretWord}
                  onChange={e => setSecretWord(e.target.value)}
                  placeholder="例：好きな食べ物、出身小学校など"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            )}

            {showAuth === 'reset' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">秘密の言葉</label>
                  <input 
                    type="text" 
                    required
                    value={secretWord}
                    onChange={e => setSecretWord(e.target.value)}
                    placeholder="登録した秘密の言葉"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">新しいパスワード</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-xs font-semibold text-center">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (showAuth === 'login' ? <LogIn size={18} /> : showAuth === 'register' ? <UserPlus size={18} /> : <Lock size={18} />)}
              {showAuth === 'login' ? 'ログイン' : showAuth === 'register' ? '登録する' : '再設定する'}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center mt-2">
            {showAuth === 'login' && (
              <button 
                type="button"
                onClick={() => { setShowAuth('reset'); setError(''); }}
                className="text-slate-400 text-xs hover:underline"
              >
                パスワードを忘れましたか？
              </button>
            )}

            <button 
              type="button"
              onClick={() => {
                setShowAuth(showAuth === 'login' ? 'register' : 'login');
                setError('');
              }}
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
              setError('');
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
