"use client";
import { usePathname } from 'next/navigation';
import BottomNavigation from "@/components/BottomNavigation";
import InitGuard from "@/components/InitGuard";
import VersionBadge from "@/components/VersionBadge";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-charcoal">
        <VersionBadge />
        <main className="w-full h-full min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-cream relative max-w-md mx-auto min-h-screen border-x-[3px] border-charcoal shadow-[0_0_24px_rgba(24,24,26,0.15)] overflow-x-hidden pb-20">
      {/* Retro Header solid banner */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-orange border-b-[3px] border-charcoal z-0 flex items-end p-6">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(#18181A 2px, transparent 2px)',
          backgroundSize: '12px 12px'
        }} />
      </div>
      
      <VersionBadge />
      
      <InitGuard>
        <main className="relative z-10 w-full h-full min-h-screen">
          {children}
        </main>
        <BottomNavigation />
      </InitGuard>
    </div>
  );
}
