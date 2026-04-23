"use client";

export default function VersionBadge() {
  const resetMode = () => {
    if (confirm("モード選択画面に戻りますか？")) {
      localStorage.removeItem('app_mode');
      // For a demo mode, we might also want to log out the user from release mode,
      // but simply returning to the selection screen gives them the option to login again or use demo.
      window.location.reload();
    }
  };

  return (
    <button
      onClick={resetMode}
      className="absolute top-4 right-5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-[10px] font-bold text-white shadow-sm z-40 hover:bg-white/30 transition cursor-pointer"
    >
      v0.0.6 (Alpha)
    </button>
  );
}
