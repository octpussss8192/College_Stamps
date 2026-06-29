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
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-[3px] border-charcoal z-50">
      <div className="max-w-md mx-auto h-full flex justify-between items-stretch">
        {navItems.map((item) => {
          const isActive = isAdminPage 
            ? (item.name === 'ホーム' ? (!currentTab || currentTab === 'ホーム') : currentTab === item.name)
            : pathname === item.href;
          
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex-1 flex flex-col justify-center items-center gap-1 transition-all duration-150 border-r-[2px] border-charcoal/20 last:border-r-0 ${
                isActive 
                  ? 'bg-lime text-charcoal font-black' 
                  : 'text-slate-500 hover:text-charcoal bg-[#FAF7F2]/50 hover:bg-[#FAF7F2]'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-charcoal text-lime scale-105 border-[2px] border-charcoal' : ''}`}>
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className="text-[9px] font-dot font-extrabold whitespace-nowrap mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
