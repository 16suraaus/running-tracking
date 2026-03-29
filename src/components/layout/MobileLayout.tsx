'use client';

import React from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex justify-center w-full">
      <div className="w-full max-w-md bg-[#0a0a0a] min-h-screen relative shadow-2xl flex flex-col">
        <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
