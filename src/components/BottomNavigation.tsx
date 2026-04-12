"use client";
import { Home, Camera, Gift, Clock, Utensils } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'ホーム', href: '/', icon: Home },
    { name: 'メニュー', href: '/menu', icon: Utensils },
    { name: 'スキャン', href: '/scan', icon: Camera },
    { name: '特典', href: '/rewards', icon: Gift },
    { name: '履歴', href: '/history', icon: Clock },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50">
      <div className="max-w-md mx-auto h-full flex justify-between items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex-1 flex flex-col justify-center items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
