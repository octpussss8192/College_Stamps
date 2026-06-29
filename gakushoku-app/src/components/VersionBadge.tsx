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
      className="absolute top-4 right-5 bg-lime border-[2px] border-charcoal px-3 py-1 rounded-md text-[10px] font-bold font-dot text-charcoal shadow-[2px_2px_0px_#18181A] z-40 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181A] active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181A] transition-all cursor-pointer rotate-[3deg]"
    >
      v0.1.0 (β)
    </button>
  );
}
