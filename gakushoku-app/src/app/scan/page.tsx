"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, AlertCircle, Hash, Calendar, Clock, Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function TicketInput() {
  const router = useRouter();
  
  // States for the fields
  const [ticketDate, setTicketDate] = useState('');
  const [ticketTime, setTicketTime] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketPrice, setTicketPrice] = useState('500'); // Default to 500
  
  const [lastNumbers, setLastNumbers] = useState<Record<number, number>>({ 1: 0, 2: 0 });
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    // Auto-fill Date and Time
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    
    setTicketDate(`${yy}.-${m}.${d}`);
    setTicketTime(`${hh}:${mm}`);
    
    fetchLastNumbers();
  }, []);

  const fetchLastNumbers = async () => {
    try {
      const res = await fetch('/api/stamp');
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setLastNumbers(data);
      }
    } catch (err) {
      console.error("Failed to fetch last numbers", err);
    }
  };

  const handleRegister = async (force = false) => {
    if (ticketNumber.length !== 6) {
      setError('通し番号は必ず6桁で入力してください。');
      return;
    }
    if (!ticketPrice) {
      setError('金額を入力してください。');
      return;
    }

    setRegistering(true);
    setError(null);
    if (!force) setWarning(null);

    try {
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticket_number: parseInt(ticketNumber),
          date: ticketDate,
          time: ticketTime,
          price: parseInt(ticketPrice),
          force 
        }),
      });
      const json = await res.json();

      if (json.warning) {
        setWarning(json.error);
        setRegistering(false);
        return;
      }

      if (json.success) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        alert(json.message || 'スタンプを登録しました！');
        router.push('/');
      } else {
        setError(json.error || '登録に失敗しました。');
      }
    } catch { 
      setError('通信エラーが発生しました。'); 
    } finally { 
      setRegistering(false); 
    }
  };

  const detectedMachine = ticketNumber.startsWith('1') ? 1 : ticketNumber.startsWith('2') ? 2 : null;
  const isValid = ticketNumber.length === 6 && ticketPrice && detectedMachine;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Premium Header - Matching Admin/Home style */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 pt-12 rounded-b-[40px] shadow-lg mb-8">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">食券情報の入力</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-6">
        {/* Machine Status Card */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex gap-3">
          {[1, 2].map(id => (
            <div key={id} className={`flex-1 p-3 rounded-2xl border transition-all text-center ${detectedMachine === id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
              <p className={`text-[10px] font-black uppercase mb-1 ${detectedMachine === id ? 'text-indigo-600' : 'text-slate-400'}`}>{id}号機</p>
              <p className={`text-xs font-mono font-bold ${detectedMachine === id ? 'text-indigo-900' : 'text-slate-500'}`}>最新: #{lastNumbers[id] || '---'}</p>
            </div>
          ))}
        </div>

        {/* Main Input Form */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-6">
          
          {/* Serial Number - The most important input */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-indigo-500" /> 通し番号 (6桁必須)
            </label>
            <input
              type="number"
              pattern="\d*"
              inputMode="numeric"
              maxLength={6}
              value={ticketNumber}
              onChange={(e) => {
                if (e.target.value.length <= 6) setTicketNumber(e.target.value);
                setError(null);
                setWarning(null);
              }}
              placeholder="183280"
              className={`w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 text-3xl font-mono text-center focus:outline-none transition-all ${
                ticketNumber.length === 6 ? 'border-indigo-500 bg-white' : 'border-slate-100'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={14} className="text-emerald-500" /> 金額
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-8 pr-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-amber-500" /> 時刻
              </label>
              <input
                type="text"
                value={ticketTime}
                onChange={(e) => setTicketTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-lg font-bold text-slate-800 focus:outline-none focus:border-amber-500 text-center"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" /> 年月日
            </label>
            <input
              type="text"
              value={ticketDate}
              onChange={(e) => setTicketDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>

          {/* Validation Messages */}
          <div className="pt-2">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
            {warning && (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl text-xs font-bold space-y-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {warning}
                </div>
                <button onClick={() => handleRegister(true)} className="w-full py-2 bg-amber-500 text-white rounded-xl shadow-md">このまま登録</button>
              </div>
            )}
            {!detectedMachine && ticketNumber.length > 0 && (
              <p className="text-[10px] text-red-500 font-bold text-center">※ 先頭は1(1号機)か2(2号機)である必要があります</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleRegister(false)}
          disabled={!isValid || registering || !!warning}
          className={`w-full py-5 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
            isValid && !registering && !warning
              ? 'bg-indigo-600 text-white shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {registering ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
          {registering ? '登録中...' : 'スタンプを登録'}
        </button>

        <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed px-4">
          入力された情報は管理システムにより自動照合されます。<br/>
          正しい内容を入力してください。
        </p>
      </div>
    </div>
  );
}
