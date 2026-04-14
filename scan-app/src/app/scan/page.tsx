"use client";
import { useState, useRef } from "react";
import { Camera, RefreshCcw, Check, Loader2, Upload, Receipt, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any>(null); // Draft data from OCR
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoCaptureTimer, setAutoCaptureTimer] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // カメラ起動時の自動シャッター制御
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCameraActive && !loading && !parsedData) {
      // 3秒後に自動撮影
      timer = setTimeout(() => {
        capturePhoto();
      }, 3000);
      setAutoCaptureTimer(3);
      
      // 秒読みカウントダウン（演出用）
      const countdown = setInterval(() => {
        setAutoCaptureTimer(prev => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(countdown);
        setAutoCaptureTimer(null);
      };
    }
  }, [isCameraActive, loading, parsedData]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("カメラの起動に失敗しました。ブラウザの権限設定を確認してください。");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "captured-ticket.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            setParsedData(null);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setParsedData(null);
      setError(null);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 5));
    }, 200);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "解析に失敗しました。");
      }

      setParsedData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24 max-w-lg mx-auto">
      
      <div className="flex items-center gap-4 text-white mb-2">
        <Link href="/" className="p-2 bg-slate-800 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">食券スキャナー</h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Custom Guard & Anti-Fraud</p>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-slate-700/50 flex flex-col gap-6">
        {/* Camera / Preview Area */}
        <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-[2rem] overflow-hidden border-2 border-slate-700 flex items-center justify-center shadow-inner">
          {isCameraActive ? (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {/* Semi-transparent Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Dark Mask with Cutout */}
                <div className="absolute inset-0 bg-slate-950/70 shadow-[inset_0_0_120px_rgba(0,0,0,0.8)]"></div>
                
                {/* Rectangular Gray Guide */}
                <div className="relative w-[85%] aspect-[2/1] border-2 border-slate-400/60 rounded-2xl bg-transparent z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  {/* Gray Corners */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-slate-300 rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-slate-300 rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-slate-300 rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-slate-300 rounded-br-xl"></div>
                  
                  {/* Countdown Text */}
                  {autoCaptureTimer !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-400/10 backdrop-blur-[2px] rounded-2xl animate-pulse">
                      <div className="text-4xl font-black text-white drop-shadow-lg">{autoCaptureTimer}</div>
                      <div className="text-[10px] text-slate-200 font-bold uppercase tracking-[0.2em] mt-2">Auto Scanning...</div>
                    </div>
                  )}

                  <div className="absolute -bottom-12 left-0 right-0 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest py-1.5 bg-slate-900/60 backdrop-blur-md rounded-full border border-slate-700/50">
                    枠内に食券を合わせてください
                  </div>
                </div>
              </div>
              
              {/* Camera Controls */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8 z-20">
                <button 
                  onClick={stopCamera}
                  className="p-4 bg-slate-800/80 backdrop-blur-md rounded-full text-white border border-slate-600 shadow-lg"
                >
                  <ArrowLeft size={24} />
                </button>
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-[6px] border-slate-300 shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-slate-800"></div>
                </button>
                <div className="w-14"></div> {/* Spacer */}
              </div>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <div 
                onClick={startCamera}
                className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-blue-500 hover:bg-slate-700 transition cursor-pointer group"
              >
                <Camera size={36} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm font-bold text-slate-300">スキャンを開始</p>
                <p className="text-[10px] text-slate-500 mt-1">カメラ権限が必要です</p>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden File Input Fallback */}
          {!isCameraActive && !previewUrl && (
            <div className="absolute bottom-4 right-4 group">
              <label className="p-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 text-slate-400 cursor-pointer hover:bg-slate-700 transition flex items-center gap-2">
                <Upload size={16} />
                <span className="text-[10px] font-bold uppercase">📂</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>

        {/* Action Button: Analyze */}
        {previewUrl && !parsedData && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <button 
                onClick={() => { resetSelection(); startCamera(); }}
                disabled={loading}
                className="flex-1 py-4 px-4 rounded-2xl border border-slate-600 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition"
              >
                <RefreshCcw size={18} /> 再撮影
              </button>
              <button 
                onClick={handleScan}
                disabled={loading}
                className="flex-[1.5] py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-900/40 transition active:scale-95"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {loading ? "解析中..." : "解析を実行"}
              </button>
            </div>
            
            {loading && (
              <div className="w-full mt-2 flex flex-col gap-1">
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Review Section (After successful OCR) */}
        {parsedData && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 rounded-xl bg-blue-900/30 border border-blue-800 text-blue-200 text-sm font-medium flex items-start gap-2">
              <Pencil size={18} className="shrink-0 mt-0.5" />
              <p>読み取った内容を確認してください。</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">店舗情報</label>
                <div className="px-3 py-2 bg-blue-900/40 border border-blue-700/50 rounded-lg text-sm font-bold text-blue-100 italic">
                  {parsedData.shopInfo || "解析中..."}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">日付</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold">{parsedData.date}</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">時間</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold">{parsedData.time}</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">価格</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold">¥{parsedData.price}</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">食券ID</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold">{parsedData.hash}</div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={resetSelection}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 font-semibold"
              >
                キャンセル
              </button>
              <button 
                className="flex-[2] py-3 px-4 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-900/40"
              >
                 解析成功 (合体時に登録)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-900/30 text-red-400 text-sm font-medium border border-red-900">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
