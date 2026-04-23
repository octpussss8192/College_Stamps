"use client";
import { Home, Camera, Gift, Clock, Utensils } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const isAdminPage = pathname?.startsWith('/admin');
  
  const navItems = [
    { name: 'ホーム', href: isAdminPage ? '/admin?tab=ホーム' : '/', icon: Home },
    { name: 'メニュー', href: isAdminPage ? '/admin?tab=メニュー' : '/menu', icon: Utensils },
    { name: 'スキャン', href: isAdminPage ? '/admin?tab=スキャン' : '/scan', icon: Camera },
    { name: '特典', href: isAdminPage ? '/admin?tab=特典' : '/rewards', icon: Gift },
    { name: '履歴', href: isAdminPage ? '/admin?tab=履歴' : '/history', icon: Clock },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50">
      <div className="max-w-md mx-auto h-full flex justify-between items-center px-2">
        {navItems.map((item) => {
          const isActive = isAdminPage 
            ? (item.name === 'ホーム' ? (!currentTab || currentTab === 'ホーム') : currentTab === item.name)
            : pathname === item.href;
          
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex-1 flex flex-col justify-center items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-blue-600 scale-110' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
