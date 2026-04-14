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

    // Simulate progress
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
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        throw new Error(data.error || "解析に失敗しました。");
      }

      setParsedData(data.data);
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4 text-white mb-2">
        <Link href="/" className="p-2 bg-slate-800 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">食券スキャナー</h1>
          <p className="text-slate-400 text-xs mt-0.5">精度向上・偽造防止開発中</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 flex flex-col gap-6">
        {/* Preview Area */}
        <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Camera size={48} className="opacity-50" />
              <p className="text-sm font-medium">カメラで撮影</p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={loading}
          />
        </div>

        {/* Action Button: Analyze */}
        {previewUrl && !parsedData && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                onClick={resetSelection}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition"
              >
                <RefreshCcw size={18} /> 撮り直す
              </button>
              <button 
                onClick={handleScan}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/40"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {loading ? "解析中..." : "解析する"}
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
