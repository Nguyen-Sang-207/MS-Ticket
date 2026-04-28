import React from "react";
import HeroCarousel from "./components/HeroCarousel";
import MovieList from "./components/MovieList";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 bg-[var(--color-background)]">
        <HeroCarousel />
        
        {/* Modern Tech Features Separator */}
        <div className="relative py-10 bg-[#09090b] overflow-hidden border-y border-white/5">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-1 bg-blue-500/20 blur-[40px] rounded-full"></div>
          
          <div className="flex whitespace-nowrap animate-[scroll-left_40s_linear_infinite] items-center">
            {Array.from({ length: 4 }).map((_, i) => (
               <React.Fragment key={i}>
                 <div className="flex items-center gap-20 mx-10 text-zinc-500">
                   <div className="flex items-center gap-3"><span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600">IMAX</span><span className="text-xs font-semibold tracking-widest uppercase">Laser</span></div>
                   <div className="flex items-center gap-3"><span className="text-2xl font-black text-white">DOLBY</span><span className="text-sm border border-zinc-700 px-2 py-0.5 rounded text-zinc-400 tracking-widest">ATMOS</span></div>
                   <div className="flex items-center gap-1 text-xl font-bold tracking-widest"><span className="text-red-500">4D</span>X</div>
                   <div className="flex items-center gap-2"><span className="text-2xl font-black text-zinc-300 tracking-tighter">SCREEN</span><span className="text-xl font-light">X</span></div>
                   <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span className="text-sm font-semibold tracking-widest text-zinc-300">VIP LOUNGE</span><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span></div>
                 </div>
               </React.Fragment>
            ))}
          </div>
        </div>

        <MovieList />
      </div>
    </div>
  );
}
