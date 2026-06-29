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
    const mode = localStorage.getItem('app_mode');
    if (mode === 'demo') {
      const savedLast = localStorage.getItem('demo_last_numbers');
      if (savedLast) {
        setLastNumbers(JSON.parse(savedLast));
      } else {
        const initial = { 1: 102450, 2: 201840 };
        setLastNumbers(initial);
        localStorage.setItem('demo_last_numbers', JSON.stringify(initial));
      }
      return;
    }

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

    const mode = localStorage.getItem('app_mode');
    if (mode === 'demo') {
      // Simulate API call lag
      await new Promise(resolve => setTimeout(resolve, 800));

      const ticketNum = parseInt(ticketNumber);
      const machineId = ticketNumber.startsWith('1') ? 1 : ticketNumber.startsWith('2') ? 2 : null;
      if (!machineId) {
        setError('無効な食券番号です。1または2から始まる番号を入力してください。');
        setRegistering(false);
        return;
      }

      // Check duplicates in demo history
      const demoHistory = JSON.parse(localStorage.getItem('demo_history') || '[]');
      const isDuplicate = demoHistory.some((h: any) => h.ticket_number === ticketNum && h.machine_id === machineId);
      if (isDuplicate) {
        setError('この食券番号は既に登録されています。');
        setRegistering(false);
        return;
      }

      // Check jump
      const currentLast = lastNumbers[machineId] || 0;
      const MAX_JUMP = 1000;
      if (!force && currentLast > 0 && (ticketNum > currentLast + MAX_JUMP || ticketNum < currentLast)) {
        if (ticketNum > currentLast + MAX_JUMP) {
          setWarning(`${machineId}号機の前回の番号(${currentLast})から大きく離れています。本当によろしいですか？`);
          setRegistering(false);
          return;
        }
      }

      // Add stamps (1 normally, 2 if price >= 500)
      const priceVal = parseInt(ticketPrice) || 0;
      const stampReward = priceVal >= 500 ? 2 : 1;
      const currentStamps = parseInt(localStorage.getItem('user_stamps') || '0');
      localStorage.setItem('user_stamps', (currentStamps + stampReward).toString());

      // Add to demo history
      const finalDate = ticketDate || new Date().toISOString().split('T')[0];
      const finalTime = ticketTime || new Date().toTimeString().split(' ')[0].substring(0, 5);
      
      const newRecord = {
        id: Date.now(),
        date: finalDate,
        time: finalTime,
        action: stampReward === 2 ? "スタンプ獲得 (ボーナス)" : "スタンプ獲得",
        price: priceVal,
        menu: "食券スキャン",
        ticket_number: ticketNum,
        machine_id: machineId
      };
      localStorage.setItem('demo_history', JSON.stringify([newRecord, ...demoHistory]));

      // Update last numbers
      const updatedLast = { ...lastNumbers, [machineId]: ticketNum };
      setLastNumbers(updatedLast);
      localStorage.setItem('demo_last_numbers', JSON.stringify(updatedLast));

      // Pop confetti & redirect
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      alert(`${machineId}号機として登録しました！スタンプを ${stampReward} 個獲得しました！`);
      router.push('/');
      setRegistering(false);
      return;
    }

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
    <div className="min-h-screen bg-cream pb-24 border-x-[3px] border-charcoal">
      {/* Premium Header */}
      <div className="bg-orange text-charcoal p-6 pt-12 border-b-[3px] border-charcoal shadow-none mb-8 relative">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(#18181A 2px, transparent 2px)',
          backgroundSize: '12px 12px'
        }} />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="h-10 w-10 border-[2.5px] border-charcoal rounded-xl bg-white flex items-center justify-center shadow-[2px_2px_0px_#18181A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition-all">
            <ArrowLeft size={18} className="text-charcoal" />
          </Link>
          <h1 className="text-lg font-dela tracking-tight text-charcoal">食券スキャナー</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Machine Status Card */}
        <div className="neo-card p-4 flex gap-3 bg-white">
          {[1, 2].map(id => {
            const isActive = detectedMachine === id;
            return (
              <div key={id} className={`flex-1 p-3 rounded-xl border-[2.5px] transition-all text-center ${
                isActive 
                  ? 'bg-lime border-charcoal shadow-[2px_2px_0px_#18181A]' 
                  : 'bg-slate-50 border-slate-200/60 opacity-55'
              }`}>
                <div className="flex justify-center items-center gap-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full border border-charcoal ${isActive ? 'bg-[#FF3E3E] animate-pulse' : 'bg-slate-300'}`} />
                  <p className={`text-[10px] font-dot font-black uppercase ${isActive ? 'text-charcoal' : 'text-slate-400'}`}>{id}号機</p>
                </div>
                <p className={`text-[11px] font-mono font-bold ${isActive ? 'text-charcoal' : 'text-slate-400'}`}>LATEST: #{lastNumbers[id] || '---'}</p>
              </div>
            );
          })}
        </div>

        {/* Main Input Form */}
        <div className="neo-card bg-white p-6 space-y-6">
          {/* Serial Number - The most important input */}
          <div className="space-y-2">
            <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase tracking-widest flex items-center gap-1.5">
              <Hash size={14} className="text-[#FF5E36]" /> 通し番号 (6桁必須)
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
              className={`w-full bg-slate-50 border-[3px] border-charcoal rounded-xl py-3 px-6 text-3xl font-mono font-extrabold text-center focus:outline-none transition-colors ${
                ticketNumber.length === 6 ? 'bg-lime focus:bg-lime' : 'focus:bg-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase tracking-widest flex items-center gap-1.5">
                <Banknote size={14} className="text-[#00F5A0]" /> 金額
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50 font-extrabold text-sm">¥</span>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full bg-slate-50 border-[3px] border-charcoal rounded-xl py-2.5 pl-8 pr-4 text-base font-dot font-extrabold text-charcoal focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" /> 時刻
              </label>
              <input
                type="text"
                value={ticketTime}
                onChange={(e) => setTicketTime(e.target.value)}
                className="w-full bg-slate-50 border-[3px] border-charcoal rounded-xl py-2.5 px-4 text-base font-dot font-extrabold text-charcoal text-center focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-dot font-black text-charcoal/60 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-500" /> 年月日
            </label>
            <input
              type="text"
              value={ticketDate}
              onChange={(e) => setTicketDate(e.target.value)}
              className="w-full bg-slate-50 border-[3px] border-charcoal rounded-xl py-2.5 px-6 text-base font-dot font-extrabold text-charcoal text-center focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Validation Messages */}
          <div className="pt-2">
            {error && (
              <div className="bg-red-50 border-[2px] border-[#FF3E3E] text-charcoal p-4 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0 text-[#FF3E3E]" /> {error}
              </div>
            )}
            {warning && (
              <div className="bg-amber-50 border-[2px] border-amber-500 text-charcoal p-4 rounded-xl text-xs font-bold space-y-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-500" /> {warning}
                </div>
                <button onClick={() => handleRegister(true)} className="w-full py-2 bg-amber-500 text-white rounded-lg border-[2px] border-charcoal font-black shadow-[2px_2px_0px_#18181A] hover:bg-amber-600 transition-colors">このまま登録</button>
              </div>
            )}
            {!detectedMachine && ticketNumber.length > 0 && (
              <p className="text-[10px] font-dot text-[#FF3E3E] font-black text-center mt-1">※ 先頭は1(1号機)か2(2号機)である必要があります</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleRegister(false)}
          disabled={!isValid || registering || !!warning}
          className={`w-full py-4.5 rounded-2xl neo-btn font-dela text-base text-charcoal flex items-center justify-center gap-2 ${
            isValid && !registering && !warning
              ? 'bg-lime'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300 translate-y-0 hover:translate-y-0 active:translate-y-0'
          }`}
        >
          {registering ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
          {registering ? '登録中...' : 'スタンプを登録'}
        </button>

        <p className="text-center text-[10px] text-slate-500 font-dot font-bold leading-normal px-4">
          入力された情報は管理システムにより自動照合されます。<br/>
          正しい内容を入力してください。
        </p>
      </div>
    </div>
  );
}
