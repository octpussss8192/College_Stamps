"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Fingerprint, Info, LogIn, UserPlus, Lock } from "lucide-react";

export default function InitGuard({ children }: { children: React.ReactNode }) {
  const [appMode, setAppMode] = useState<'demo' | 'release' | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  const [showAuth, setShowAuth] = useState<'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password' | null>(null);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [devCode, setDevCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Countdown timer for resending verification code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

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

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'コードの再送信に失敗しました。');
      }
      setResendCountdown(60);
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      alert('認証コードをメール送信しました。');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      body = { nickname, email, password, secretWord };
    } else if (showAuth === 'verify-email') {
      endpoint = '/api/auth/verify-email';
      body = { userId, code: verificationCode };
    } else if (showAuth === 'forgot-password') {
      endpoint = '/api/auth/forgot-password';
      body = { email };
    } else if (showAuth === 'reset-password') {
      endpoint = '/api/auth/reset-password';
      body = { email, code: verificationCode, newPassword };
    }

    try {
      if (showAuth === 'register' && password !== confirmPassword) {
        setError('パスワードが一致しません');
        setLoading(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // If login failed due to email not verified
        if (res.status === 403 && data.emailNotVerified) {
          setUserId(data.userId);
          setEmail(data.email);
          if (data.devCode) {
            setDevCode(data.devCode);
          }
          setShowAuth('verify-email');
          setVerificationCode('');
          setResendCountdown(60);
          setError('メールアドレスの認証が完了していません。認証コードを入力してください。');
          return;
        }
        throw new Error(data.error || '処理に失敗しました');
      }

      if (showAuth === 'register') {
        setUserId(data.userId);
        setEmail(data.email);
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setShowAuth('verify-email');
        setVerificationCode('');
        setResendCountdown(60);
        setNickname('');
        setPassword('');
        setConfirmPassword('');
      } else if (showAuth === 'verify-email') {
        setShowAuth(null);
        router.push('/');
        router.refresh();
      } else if (showAuth === 'forgot-password') {
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setShowAuth('reset-password');
        setVerificationCode('');
      } else if (showAuth === 'reset-password') {
        alert('パスワードを更新しました。新しいパスワードでログインしてください。');
        setShowAuth('login');
        setPassword('');
        setNewPassword('');
        setSecretWord('');
        setEmail('');
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
      <div className="fixed inset-0 z-[100] bg-cream flex flex-col items-center justify-center border-[6px] border-charcoal">
        <div className="neo-card p-8 flex flex-col items-center justify-center gap-4 bg-white">
          <Loader2 className="animate-spin text-orange" size={48} strokeWidth={3} />
          <p className="font-dot font-black tracking-widest text-sm text-charcoal">SYSTEM INITIALIZING...</p>
        </div>
      </div>
    );
  }

  // Selection Screen
  if (!appMode && !showAuth) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex flex-col p-6 items-center justify-center text-charcoal border-[6px] border-charcoal overflow-y-auto">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(#18181A 2px, transparent 2px)',
          backgroundSize: '16px 16px'
        }} />
        
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center gap-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500 py-8">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-dela tracking-tight mb-2 text-charcoal leading-none select-none">
              工クオン<br/>
              <span className="text-orange">学食スタンプ</span>
            </h1>
            <p className="text-slate-500 font-dot font-bold text-xs tracking-wider uppercase">SELECT STARTING MODE</p>
          </div>

          <button 
            onClick={() => selectMode('demo')}
            className="w-full neo-card neo-card-hover p-6 flex items-center gap-4 text-left group cursor-pointer bg-white"
          >
            <div className="w-12 h-12 rounded-xl border-[2px] border-charcoal bg-lime flex items-center justify-center text-charcoal shadow-[2px_2px_0px_#18181A] shrink-0">
              <Info size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-dela text-charcoal group-hover:text-orange transition-colors">デモ版 (Demo)</h2>
              <p className="text-slate-500 font-dot font-bold text-xs mt-0.5">登録不要 • データは端末に保存</p>
            </div>
          </button>

          <button 
            onClick={() => selectMode('release')}
            className="w-full neo-card neo-card-hover p-6 flex items-center gap-4 text-left group cursor-pointer bg-white"
          >
            <div className="w-12 h-12 rounded-xl border-[2px] border-charcoal bg-orange flex items-center justify-center text-white shadow-[2px_2px_0px_#18181A] shrink-0">
              <Fingerprint size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-dela text-charcoal group-hover:text-orange transition-colors">リリース版 (Release)</h2>
              <p className="text-slate-500 font-dot font-bold text-xs mt-0.5">要ユーザー登録 • クラウドDB連携</p>
            </div>
          </button>

          <button 
            onClick={() => setShowAdminAuth(true)}
            className="w-full neo-card neo-card-hover p-4 flex gap-4 items-center justify-center text-center cursor-pointer bg-charcoal text-white hover:bg-slate-800"
          >
            <div className="text-lime">
              <Lock size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-dela text-lime">管理者デバッグモード (Admin)</h2>
          </button>
        </div>

        {/* Admin Password Overlay */}
        {showAdminAuth && (
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm neo-card bg-white p-8 animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full border-[3px] border-charcoal bg-lime flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#18181A]">
                  <Lock size={28} className="text-charcoal" />
                </div>
                <h2 className="text-xl font-dela text-charcoal">管理者認証</h2>
                <p className="text-slate-500 font-dot font-bold text-xs mt-1 uppercase">Enter admin credentials</p>
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
                  className="w-full px-4 py-3 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-semibold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
                
                {adminAuthError && (
                  <p className="text-red-500 font-dot font-bold text-xs text-center">{adminAuthError}</p>
                )}
                
                <button 
                  type="submit"
                  disabled={adminAuthLoading}
                  className="w-full neo-btn bg-lime text-charcoal py-3.5"
                >
                  {adminAuthLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                  認証する
                </button>
              </form>
              
              <button
                type="button"
                onClick={() => { setShowAdminAuth(false); setAdminPassword(''); setAdminAuthError(''); }}
                className="w-full mt-4 text-slate-500 font-dot font-extrabold text-xs hover:text-charcoal transition-colors text-center"
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
      <div className="fixed inset-0 z-[100] bg-cream flex flex-col p-6 items-center justify-center border-[6px] border-charcoal overflow-y-auto">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(#18181A 2px, transparent 2px)',
          backgroundSize: '16px 16px'
        }} />

        <div className="relative z-10 w-full max-w-sm neo-card bg-white p-8 flex flex-col gap-6 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <h2 className="text-xl font-dela text-charcoal leading-none">
              {showAuth === 'login' && 'ログイン'}
              {showAuth === 'register' && 'ユーザー登録'}
              {showAuth === 'verify-email' && 'メール認証'}
              {showAuth === 'forgot-password' && 'パスワード再設定'}
              {showAuth === 'reset-password' && 'パスワード再設定'}
            </h2>
            <p className="text-slate-500 font-dot font-bold text-[10px] mt-2 uppercase tracking-wide">
              {showAuth === 'login' && 'Authentication Required'}
              {showAuth === 'register' && 'Create Your Account'}
              {showAuth === 'verify-email' && `Code sent to ${email}`}
              {showAuth === 'forgot-password' && 'Enter your email'}
              {showAuth === 'reset-password' && 'Enter reset code & new password'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {(showAuth === 'login' || showAuth === 'register') && (
              <div>
                <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">
                  {showAuth === 'login' ? 'ニックネーム または メールアドレス' : 'ニックネーム'}
                </label>
                <input 
                  type="text" 
                  required
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={showAuth === 'login' ? "学生太郎 または user@example.com" : "学生太郎"}
                  className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}

            {(showAuth === 'register' || showAuth === 'forgot-password') && (
              <div>
                <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">メールアドレス</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}
            
            {(showAuth === 'login' || showAuth === 'register') && (
              <div>
                <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">パスワード</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}

            {showAuth === 'register' && (
              <>
                <div>
                  <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">パスワード（確認）</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">秘密の言葉（予備・再設定に使用）</label>
                  <input 
                    type="text" 
                    required
                    value={secretWord}
                    onChange={e => setSecretWord(e.target.value)}
                    placeholder="例：好きな食べ物など"
                    className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </>
            )}

            {(showAuth === 'verify-email' || showAuth === 'reset-password') && (
              <div>
                <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">
                  {showAuth === 'verify-email' ? '認証コード (6桁)' : '再設定コード (6桁)'}
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}

            {showAuth === 'reset-password' && (
              <div>
                <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase block mb-1">新しいパスワード</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border-[3px] border-charcoal bg-slate-50 rounded-xl text-sm font-bold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}

            {process.env.NODE_ENV !== 'production' && devCode && (showAuth === 'verify-email' || showAuth === 'reset-password') && (
              <div className="bg-amber-50 border-[2px] border-charcoal text-charcoal rounded-xl p-3 text-xs text-center font-bold font-dot">
                [DEV CODE] <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">{devCode}</span>
              </div>
            )}

            {error && (
              <p className="text-red-500 font-dot font-bold text-xs text-center whitespace-pre-wrap">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full neo-btn bg-orange text-white py-3.5"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (showAuth === 'login' ? <LogIn size={18} /> : showAuth === 'register' ? <UserPlus size={18} /> : <Lock size={18} />)}
              {showAuth === 'login' && 'ログイン'}
              {showAuth === 'register' && '登録する'}
              {showAuth === 'verify-email' && '認証する'}
              {showAuth === 'forgot-password' && 'コードを送信'}
              {showAuth === 'reset-password' && 'パスワードを再設定'}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center mt-2">
            {showAuth === 'login' && (
              <>
                <button 
                  type="button"
                  onClick={() => { setShowAuth('forgot-password'); setError(''); }}
                  className="text-slate-500 font-dot font-bold text-xs hover:underline"
                >
                  パスワードを忘れましたか？
                </button>
                <button 
                  type="button"
                  onClick={() => { setShowAuth('register'); setError(''); }}
                  className="text-orange font-dot font-black text-sm hover:underline"
                >
                  新規アカウント作成
                </button>
              </>
            )}

            {showAuth === 'register' && (
              <button 
                type="button"
                onClick={() => { setShowAuth('login'); setError(''); }}
                className="text-orange font-dot font-black text-sm hover:underline"
              >
                ログインはこちら
              </button>
            )}

            {showAuth === 'verify-email' && (
              <div className="flex flex-col gap-2 items-center">
                <button
                  type="button"
                  disabled={resendCountdown > 0 || loading}
                  onClick={handleResendCode}
                  className="text-orange font-dot font-black text-xs hover:underline disabled:text-slate-400"
                >
                  {resendCountdown > 0 ? `再送信 (${resendCountdown}秒)` : 'コードを再送信'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setShowAuth('register'); setError(''); }}
                  className="text-slate-500 font-dot font-bold text-xs hover:underline"
                >
                  やり直す（登録画面へ戻る）
                </button>
              </div>
            )}

            {(showAuth === 'forgot-password' || showAuth === 'reset-password') && (
              <button 
                type="button"
                onClick={() => { setShowAuth('login'); setError(''); }}
                className="text-orange font-dot font-black text-sm hover:underline"
              >
                ログイン画面に戻る
              </button>
            )}
          </div>
          
          <button 
            type="button"
            onClick={() => {
              localStorage.removeItem('app_mode');
              setAppMode(null);
              setShowAuth(null);
              setError('');
              setEmail('');
            }}
            className="text-slate-500 font-dot font-bold text-xs mt-2 pt-4 border-t border-charcoal/20 hover:text-charcoal"
          >
            ← モード選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
