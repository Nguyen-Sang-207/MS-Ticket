"use client";

import React from "react";

export default function PolicyLayout({
  children,
  title,
  subtitle
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">{title}</h1>
          <p className="text-zinc-500 text-lg italic">{subtitle}</p>
        </header>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
