'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, PlusCircle, BarChart2, Tag } from 'lucide-react';

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
    {
      label: 'Stats',
      href: '/stats',
      icon: BarChart2,
    },
    {
      label: 'Gear',
      href: '/shoes',
      icon: Tag,
    },
  ];

  return (
    <nav className="w-full bg-[#121212]/90 backdrop-blur-md border-t border-gray-800 z-50">
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
