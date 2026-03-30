'use client';

import React from 'react';
import BottomNav from './BottomNav';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex justify-center w-full">
      <div className="w-full max-w-md bg-[#0a0a0a] h-[100dvh] relative shadow-2xl flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar relative relative z-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
