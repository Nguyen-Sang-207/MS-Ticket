"use client";

import React, { useEffect, useState, use } from "react";
import { Movie } from "@/types";
import { Ticket, Play, Clock, Star, X, Film } from "lucide-react";
import Link from "next/link";

export default function FilmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.statusCode === 200) setMovie(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center bg-[#09090b]">
      <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
    </div>
  );
  
  if (!movie) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-sm uppercase tracking-widest">
       Tác phẩm không tồn tại
    </div>
  );

  const getYoutubeId = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };
  const youtubeId = getYoutubeId(movie.trailer || '');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black font-sans pb-32">
      
      {/* Immersive Editorial Hero */}
      <div className="relative w-full h-[85vh] lg:h-[95vh] flex items-end overflow-hidden">
        {/* Background Canvas */}
        <div className="absolute inset-0 bg-[#09090b]">
           <img src={movie.image} alt="" className="w-full h-full object-cover opacity-60 scale-100" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/70 to-transparent" />
        </div>

        {/* Content Block */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-end">
          
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Meta Tags */}
            <div className="flex flex-wrap gap-3">
               <span className={`px-2 py-0.5 uppercase tracking-widest text-[10px] font-bold border border-white ${movie.status === 'NOW_SHOWING' ? 'bg-white text-black' : 'text-white'}`}>
                  {movie.status === 'NOW_SHOWING' ? 'Đang Khởi Chiếu' : 'Sắp Khởi Chiếu'}
               </span>
               <span className="px-2 py-0.5 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  {movie.limitageNameVn || 'P'}
               </span>
               {movie.ratings && (
                 <span className="px-2 py-0.5 border border-white text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                   ★ {movie.ratings} IMDb
                 </span>
               )}
            </div>

            {/* Typography */}
            <div className="mt-2">
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white leading-[1.05] line-clamp-2">
                {movie.nameVn}
              </h1>
              {movie.nameEn && (
                 <h2 className="text-lg md:text-xl font-medium text-zinc-500 mt-2">
                    {movie.nameEn}
                 </h2>
              )}
            </div>

            {/* Format Info */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-4">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {movie.time || 120} Phút</span>
              <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5"/> Định dạng {movie.format || '2D'}</span>
            </div>

            {/* Editorial CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {movie.status === 'NOW_SHOWING' ? (
                <Link
                  href={`/booking/${movie.id}`}
                  className="px-8 py-3.5 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" /> Đặt Vé Ngay
                </Link>
              ) : (
                <button
                  disabled
                  className="px-8 py-3.5 border border-zinc-700 text-zinc-500 bg-zinc-900/50 cursor-not-allowed text-[11px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4 opacity-50" /> Đặt Vé Ngay
                </button>
              )}
              {movie.trailer && (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Xem Trailer
                </a>
              )}
            </div>

          </div>

          {/* Minimalist Poster Slab (Right Side) */}
          <div className="hidden lg:block lg:col-span-4 shrink-0 transform translate-y-24 group px-8">
             <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900 border border-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.9)]">
                <img src={movie.image} alt={movie.nameVn} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out" />
             </div>
          </div>
          
        </div>
      </div>

      {/* Detail Sections */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
         
         <div className="lg:col-span-8">
            <h3 className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase mb-8 flex items-center gap-4">
              <span className="w-12 h-[1px] bg-zinc-700"></span> Nội dung phim
            </h3>
            
            <p className="text-xl md:text-2xl font-medium leading-[1.6] text-zinc-200 indent-8">
              {movie.briefVn || 'Nội dung đang được cập nhật từ nhà phát hành.'}
            </p>
            {movie.briefEn && movie.briefEn !== movie.briefVn && (
              <p className="text-sm text-zinc-500 leading-relaxed mt-8 indent-8 font-mono">
                {movie.briefEn}
              </p>
            )}

            {movie.listGenre && movie.listGenre.length > 0 && (
              <div className="mt-16 flex flex-wrap gap-2">
                {movie.listGenre.map((genre: string, i: number) => (
                  <span key={i} className="px-5 py-2 uppercase tracking-widest text-[10px] font-bold border border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer">
                    {genre}
                  </span>
                ))}
              </div>
            )}
         </div>

         <div className="lg:col-span-4 flex flex-col gap-8 pt-2 border-t lg:border-t-0 lg:border-l border-zinc-800 lg:pl-12">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-1">Đạo diễn</h4>
              <p className="text-base font-semibold text-white">{movie.director || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-1">Diễn viên</h4>
              <p className="text-sm font-medium text-zinc-300 leading-relaxed">{movie.actor || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-1">Quốc gia</h4>
              <p className="text-base font-semibold text-white">{movie.countryVn || movie.countryEn || 'Quốc tế'}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-1">Ngày khởi chiếu</h4>
              <p className="text-base font-semibold text-white">{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Sắp ra mắt'}</p>
            </div>
         </div>

      </div>
    </div>
  );
}
