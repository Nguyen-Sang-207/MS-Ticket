"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Movie } from "@/types";

export default function HeroCarousel() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/movies?status=NOW_SHOWING&limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.statusCode === 200) setMovies(data.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (movies.length === 0) return;
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % movies.length);
    }, 8000); // Slower, more cinematic transition
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, movies.length]);

  if (movies.length === 0) return <div className="h-[90vh] bg-[#09090b]"></div>;

  return (
    <div className="relative w-full h-[55vh] md:h-[95vh] bg-[#09090b] flex items-end pb-6 md:pb-24 overflow-hidden selection:bg-white selection:text-black">
      
      {/* Immersive Cinematic Background */}
      {movies.map((m, idx) => (
        <div 
          key={m.id} 
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${active === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Base Image with low contrast */}
          <div 
             className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-[10000ms] ease-out"
             style={{ backgroundImage: `url(${m.image})`, transform: active === idx ? 'scale(1)' : 'scale(1.05)', opacity: 0.6 }}
          />
          {/* Grandient masks for Editorial Text overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent w-[80%]" />
        </div>
      ))}

      {/* Grid Layout overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 mix-blend-overlay"></div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
        
        {/* Left: Huge Editorial Content */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center">
             <span className="px-2.5 py-0.5 border border-white text-white text-[10px] uppercase font-bold tracking-[0.2em]">Tại Rạp</span>
             <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Kiệt Tác Nghệ Thuật Chiếu Bóng</span>
          </div>
          
          <div className="relative min-h-[140px] md:h-[200px] w-full">
            {movies.map((m, idx) => (
               <div key={m.id} className={`absolute inset-0 flex flex-col justify-end transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${active === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
                 <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight md:leading-[1.05] tracking-tighter line-clamp-3 md:line-clamp-2">
                   {m.nameVn}
                 </h1>
               </div>
            ))}
          </div>

          <div className="relative h-[60px] md:h-[80px] w-full max-w-xl hidden md:block">
            {movies.map((m, idx) => (
               <div key={m.id} className={`absolute inset-0 transition-all duration-[1200ms] delay-100 ease-[cubic-bezier(0.25,1,0.5,1)] ${active === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                 <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                   {m.briefVn}
                 </p>
               </div>
            ))}
          </div>

          <div className="flex flex-row gap-3 md:gap-4 mt-6 md:mt-6 relative z-20">
             <button 
                onClick={() => router.push(`/booking/${movies[active]?.id}`)}
                className="flex-1 md:flex-none px-4 md:px-8 py-3.5 md:py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors text-center justify-center"
             >
                Mua Vé Ngay
             </button>
             <button 
                onClick={() => router.push(`/film-detail/${movies[active]?.id}`)}
                className="flex-1 md:flex-none px-4 md:px-8 py-3.5 md:py-3 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-center justify-center"
             >
                Chi Tiết
             </button>
          </div>
          
          {/* Mobile Pagination Indicator - Editorial Style */}
          <div className="flex lg:hidden gap-1.5 mt-6 items-center">
             {movies.map((_, idx) => (
                <div 
                   key={idx} 
                   className={`h-0.5 transition-all duration-500 ${active === idx ? 'w-8 bg-white' : 'w-4 bg-white/30'}`}
                />
             ))}
          </div>
        </div>

        {/* Right: Apple UI Thumbnail Deck */}
        <div className="hidden lg:flex flex-col items-end justify-end h-full">
           <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 mr-2">Tác phẩm đang chiếu</div>
           <div className="flex gap-4 items-end">
              {movies.map((m, idx) => (
                 <div 
                    key={m.id} 
                    onClick={() => {
                        setActive(idx);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                    }}
                    className={`relative overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${active === idx ? 'w-[100px] h-[150px] ring-2 ring-white scale-105' : 'w-[70px] h-[105px] opacity-40 hover:opacity-100 hover:scale-100'}`}
                 >
                    <img src={m.image} className="w-full h-full object-cover" />
                    {/* Dark gradient for inactive thumbnails */}
                    <div className={`absolute inset-0 transition-colors ${active === idx ? 'bg-transparent' : 'bg-black/40'}`}></div>
                 </div>
              ))}
           </div>
        </div>

      </div>
      
      {/* Decorative Progress Bar Line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900">
         <div className="h-full bg-white relative animate-[scroll-left_8s_linear_infinite]" style={{ width: '10%' }}></div>
      </div>
    </div>
  );
}
