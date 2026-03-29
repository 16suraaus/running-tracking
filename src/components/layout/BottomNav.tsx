'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, PlusCircle } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'History',
      href: '/',
      icon: History,
    },
    {
      label: 'Log Run',
      href: '/add',
      icon: PlusCircle,
    },
  ];

  return (
    <nav className="absolute bottom-0 w-full max-w-md bg-[#121212]/90 backdrop-blur-md border-t border-gray-800">
      <div className="flex justify-around items-center h-20 px-4 pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
