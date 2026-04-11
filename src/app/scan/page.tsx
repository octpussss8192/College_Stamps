"use client";
import { useState, useRef } from "react";
import { Camera, RefreshCcw, Check, Loader2, Upload, Receipt, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  const [parsedData, setParsedData] = useState<any>(null); // Draft data from OCR
  const [result, setResult] = useState<any>(null); // Final success
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setParsedData(null);
      setResult(null);
      setError(null);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setParsedData(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "スキャン処理に失敗しました。");
      }

      setParsedData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!parsedData) return;
    
    setRegistering(true);
    setError(null);
    
    try {
      const response = await fetch("/api/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "スタンプ登録に失敗しました。");
      }

      setResult(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParsedData((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 pt-12 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="text-white mb-2">
        <h1 className="text-2xl font-bold tracking-tight">食券をスキャン</h1>
        <p className="text-blue-100 mt-1 text-sm">食券全体が写るように撮影してください</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col gap-6">
        {/* Preview Area */}
        <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-black" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Camera size={48} className="opacity-50" />
              <p className="text-sm font-medium">カメラで食券を撮影</p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={loading || registering || result}
          />
        </div>

        {/* Action Button 1: Analyze */}
        {previewUrl && !parsedData && !result && (
          <div className="flex gap-3">
            <button 
              onClick={resetSelection}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition"
            >
              <RefreshCcw size={18} /> 撮り直す
            </button>
            <button 
              onClick={handleScan}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {loading ? "解析中..." : "解析する"}
            </button>
          </div>
        )}

        {/* User Review Section */}
        {parsedData && !result && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium flex items-start gap-2">
              <Pencil size={18} className="shrink-0 mt-0.5" />
              <p>読み取った内容を確認してください。間違っている場合は直接修正できます。</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">日付</label>
                <input 
                  type="text" 
                  name="date"
                  value={parsedData.date} 
                  onChange={handleInputChange}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">時間</label>
                <input 
                  type="text" 
                  name="time"
                  value={parsedData.time} 
                  onChange={handleInputChange}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">価格</label>
                <input 
                  type="number" 
                  name="price"
                  value={parsedData.price} 
                  onChange={handleInputChange}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">食券ID</label>
                <input 
                  type="text" 
                  name="hash"
                  value={parsedData.hash} 
                  onChange={handleInputChange}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={resetSelection}
                disabled={registering}
                className="flex-[0.5] py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition"
              >
                キャンセル
              </button>
              <button 
                onClick={handleRegister}
                disabled={registering}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
              >
                {registering ? <Loader2 size={18} className="animate-spin" /> : <Receipt size={18} />}
                {registering ? "登録中..." : "この内容でスタンプ獲得"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Final Result Success Area */}
        {result && (
          <div className="p-5 flex flex-col items-center justify-center text-center gap-4 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Check size={32} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">スタンプ獲得完了！</h2>
              <p className="text-sm text-slate-500 mt-1">食券の登録が完了し、スタンプを獲得しました。</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 w-full py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 transition"
            >
              ホームに戻る
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
