"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

const layouts = {
  date: { top: 0, left: 0, width: 40, height: 20, label: '日付', type: 'num', whitelist: '0123456789.- ', format: /^\d{2}\.[-.\d]{2}\.\d{2}$/, scale: 4, dilate: true },
  id: { top: 0, left: 65, width: 35, height: 20, label: '通し番号', type: 'num', whitelist: '0123456789', format: /^\d{4,8}$/, scale: 4, dilate: true },
  priceLarge: { top: 30, left: 35, width: 60, height: 40, label: '金額(大)', type: 'num', whitelist: '0123456789￥¥', format: /\d{2,4}/, scale: 4, dilate: true },
  priceSmall: { top: 65, left: 75, width: 25, height: 25, label: '金額(小)', type: 'num', whitelist: '0123456789￥¥', format: /\d{2,4}/, scale: 5, dilate: false },
  time: { top: 72, left: 0, width: 20, height: 20, label: '時刻', type: 'num', whitelist: '0123456789:', format: /^\d{1,2}:\d{2}$/, scale: 4, dilate: true },
  location: { top: 77, left: 30, width: 45, height: 23, label: '場所', type: 'text', whitelist: '北九州高専食堂', format: /.{2,}/, scale: 4, dilate: false }
};

const HISTORY_LIMIT = 5;

export default function CameraScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<any>(null);
  const loopRef = useRef<boolean>(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('エンジン起動中...');
  const [results, setResults] = useState<Record<string, string>>({});
  const [activeBox, setActiveBox] = useState<string | null>(null);
  const [status, setStatus] = useState('準備中...');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const resultHistory = useRef<Record<string, string[]>>({
    date: [], id: [], priceLarge: [], priceSmall: [], time: [], location: []
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingText("エンジンの準備を開始します...");
        
        let worker;
        try {
          // Fix "x.map is not a function": Pass language as an ARRAY ['jpn_custom']
          // This signature calls loadLanguage and initialize automatically in v5
          worker = await createWorker(['jpn_custom'], 1, {
            langPath: window.location.origin + '/tessdata',
          });
        } catch (e) {
          console.warn("jpn_custom failed, falling back to jpn", e);
          setLoadingText("標準モデルで起動中...");
          worker = await createWorker(['jpn'], 1);
        }

        workerRef.current = worker;
        setLoading(false);
        setStatus('スキャン中...');
        
        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setLoadingText('エラー：起動に失敗しました。カメラの使用を許可してください。');
        console.error(err);
      }
    };
    init();

    return () => {
      loopRef.current = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handleVideoLoad = useCallback(() => {
    loopRef.current = true;
    startProcessing();
  }, []);

  const startProcessing = async () => {
    const keys = Object.keys(layouts);
    let currentKeyIndex = 0;
    
    while (loopRef.current) {
      if (!workerRef.current || !videoRef.current || !canvasRef.current) {
        await new Promise(r => requestAnimationFrame(r));
        continue;
      }
      
      const key = keys[currentKeyIndex];
      const config = layouts[key as keyof typeof layouts];
      await processRegion(key, config);
      
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      await new Promise(r => setTimeout(r, 60)); 
    }
  };

  const processRegion = async (key: string, config: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const vRect = video.getBoundingClientRect();
    
    // UI Frame geometry calculations - Optimized for Mobile
    const frameW = Math.min(window.innerWidth * 0.8, 600); 
    const frameH = frameW * 860 / 1700;
    
    const fRectLeft = window.innerWidth / 2 - frameW / 2;
    const fRectTop = window.innerHeight * 0.45 - frameH / 2; 

    const scaleX = vw / vRect.width;
    const scaleY = vh / vRect.height;
    
    const cropX = (fRectLeft - vRect.left) * scaleX;
    const cropY = (fRectTop - vRect.top) * scaleY;
    const cropW = frameW * scaleX;
    const cropH = frameH * scaleY;

    const regionX = cropX + (config.left / 100) * cropW;
    const regionY = cropY + (config.top / 100) * cropH;
    const regionW = (config.width / 100) * cropW;
    const regionH = (config.height / 100) * cropH;

    const s = config.scale || 3; 
    const padding = 15;
    canvas.width = regionW * s + padding * 2;
    canvas.height = regionH * s + padding * 2;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'contrast(1.6) grayscale(1) brightness(1.1)'; 
    ctx.drawImage(video, regionX, regionY, regionW, regionH, padding, padding, regionW * s, regionH * s);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let sum = 0;
    for(let i=0; i<data.length; i+=4) sum += data[i];
    const avgThreshold = sum / (data.length / 4) * 0.82;

    const temp = new Uint8Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4) temp[i/4] = data[i] > avgThreshold ? 255 : 0;

    if (config.dilate) {
      const width = canvas.width, height = canvas.height;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (temp[idx] === 0) {
            for(let dy=-1; dy<=1; dy++) {
              for(let dx=-1; dx<=1; dx++) {
                const nIdx = ((y+dy) * width + (x+dx)) * 4;
                data[nIdx] = data[nIdx+1] = data[nIdx+2] = 0;
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i < temp.length; i++) {
        const v = temp[i];
        data[i*4] = data[i*4+1] = data[i*4+2] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    try {
      await workerRef.current.setParameters({
        tessedit_pageseg_mode: 7, // SINGLE_LINE
        tessedit_char_whitelist: config.whitelist || ''
      });
      const { data: { text } } = await workerRef.current.recognize(canvas.toDataURL('image/png'));
      let cleaned = text.trim().replace(/\s+/g, '');
      
      if (config.type === 'num' && (key.includes('price'))) {
        cleaned = cleaned.replace(/[^\d]/g, '');
      }

      if (cleaned && (config.format ? config.format.test(cleaned) : true)) {
        updateResultWithStability(key, cleaned, config);
      }
    } catch (e) {
      // Ignore
    }
  };

  const updateResultWithStability = (key: string, value: string, config: any) => {
    const history = resultHistory.current[key];
    history.push(value);
    if (history.length > HISTORY_LIMIT) history.shift();
    
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let mostFrequent = null;
    
    for (const val of history) {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) { maxCount = counts[val]; mostFrequent = val; }
    }
    
    if (maxCount >= 3 && mostFrequent) {
      setResults(prev => {
        if (prev[key] !== mostFrequent) {
          setActiveBox(key);
          setTimeout(() => setActiveBox(null), 500);
          return { ...prev, [key]: mostFrequent };
        }
        return prev;
      });
    }
  };

  const handleRegister = async () => {
    const { id, date, time, priceLarge, priceSmall } = results;
    if (!id || !date || !time || (!priceLarge && !priceSmall)) {
      setError("情報が不十分です。");
      return;
    }
    
    setRegistering(true);
    setError(null);
    try {
      const price = priceLarge || priceSmall;
      const res = await fetch("/api/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: id, date, time, price: parseInt(price.replace(/[^\d]/g, ''), 10) })
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        alert("スタンプを登録しました！");
        router.push("/");
      } else {
        setError(data.error || "登録に失敗しました。");
      }
    } catch (err) {
      setError("通信エラーが発生しました。");
    } finally {
      setRegistering(false);
    }
  };

  const isReady = results.id && results.date && results.time && (results.priceLarge || results.priceSmall);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-bold text-slate-300 leading-relaxed">{loadingText}</p>
        </div>
      )}

      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleVideoLoad}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Overlay Mask */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* Ticket Frame - Optimized for Mobile Screen */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none border-2 border-white/50 rounded-lg shadow-2xl"
        style={{
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: 'min(80vw, 400px)', 
          aspectRatio: '1700 / 860',
          boxShadow: '0 0 0 5000px rgba(0,0,0,0.65)'
        }}
      >
        {Object.entries(layouts).map(([key, box]) => (
          <div
            key={key}
            className={`absolute border rounded-[1px] transition-all duration-300 ${activeBox === key ? 'border-green-500 bg-green-500/40' : 'border-rose-500/20 bg-rose-500/5'}`}
            style={{
              top: `${box.top}%`,
              left: `${box.left}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <span className="absolute -top-2.5 left-0 text-[6px] bg-rose-500/90 text-white px-0.5 rounded-sm scale-90">
              {box.label}
            </span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* UI Layer */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="flex justify-between items-center mb-3">
          <Link href="/" className="p-2.5 bg-white/10 backdrop-blur-lg rounded-full text-white border border-white/10">
            <ArrowLeft size={16} />
          </Link>
          <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">{status}</p>
          <div className="w-8" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 mb-0.5 font-bold">DATE</span>
            <span className="font-mono text-[11px] text-green-400 bg-black/50 px-2 py-2 rounded min-h-[30px] flex items-center border border-white/5">{results.date || '--.--.--'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 mb-0.5 font-bold">ID</span>
            <span className="font-mono text-[11px] text-green-400 bg-black/50 px-2 py-2 rounded min-h-[30px] flex items-center border border-white/5">{results.id || '------'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 mb-0.5 font-bold">PRICE</span>
            <span className="font-mono text-[11px] text-green-400 bg-black/50 px-2 py-2 rounded min-h-[30px] flex items-center border border-white/5">{results.priceLarge ? `￥${results.priceLarge}` : '￥---'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 mb-0.5 font-bold">TIME</span>
            <span className="font-mono text-[11px] text-green-400 bg-black/50 px-2 py-2 rounded min-h-[30px] flex items-center border border-white/5">{results.time || '--:--'}</span>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-red-400 text-[9px] text-center font-bold">{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={!isReady || registering}
          className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-500 ${isReady ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 text-slate-600'}`}
        >
          {registering ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {registering ? '登録中...' : isReady ? 'スタンプを登録' : 'スキャンを継続してください'}
        </button>
      </div>
    </div>
  );
}
