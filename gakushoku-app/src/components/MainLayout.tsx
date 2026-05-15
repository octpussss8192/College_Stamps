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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <VersionBadge />
        <main className="w-full h-full min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white relative max-w-md mx-auto min-h-screen shadow-2xl overflow-x-hidden pb-20">
      {/* Mobile Header decoration */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[40px] z-0" />
      
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
