"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MoviePopup from "./MoviePopup";
import { useRouter } from "next/navigation";
import { Movie } from "@/types";
import { fetchCollection } from "@/lib/dataService";

export default function MovieList({ lang = "vi" }: { lang?: "vi" | "en" }) {
    const router = useRouter();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [pendingHover, setPendingHover] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [popupPos, setPopupPos] = useState<{ height: number; top: number; left: number; width: number } | null>(null);
    const movieRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const isPopupHoveredRef = useRef(false);
    
    const showTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (showTimerRef.current) clearTimeout(showTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    useEffect(() => {
        fetchCollection('movies')
            .then(data => {
                const nowShowing = data.filter(m => m.status === 'NOW_SHOWING').slice(0, 10);
                setMovies(nowShowing);
            })
            .catch(console.error);
    }, []);

    const getYoutubeId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : "";
    };

    const handleMouseEnter = (id: string) => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        if (hovered && hovered !== id) {
            setHovered(null);
            setPopupPos(null);
        }

        const ref = movieRefs.current[id];
        if (ref) {
            const rect = ref.getBoundingClientRect();
            setPopupPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height });
        }
        
        setPendingHover(id);
        
        showTimerRef.current = setTimeout(() => {
            setHovered(id);
            setPendingHover(null);
            showTimerRef.current = null;
        }, 400);
    };

    const handleMouseLeave = () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        
        hideTimerRef.current = setTimeout(() => {
            if (!isPopupHoveredRef.current) {
                setPendingHover(null);
                setHovered(null);
                setPopupPos(null);
            }
        }, 150);
    };

    return (
        <div className="w-full flex justify-center items-start pt-12 md:pt-20 pb-20 md:pb-32 bg-[#09090b]">
            <div className="max-w-7xl w-full px-4 md:px-12">
                
                <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
                  <div>
                     <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-1">
                        {lang === 'en' ? 'Now Showing' : 'Đang Chiếu Tại Rạp'}
                     </h2>
                     <p className="text-zinc-500 text-sm">Tuyệt tác mở ra tại hệ thống MS Cinema</p>
                  </div>
                  <Link href="/movies" className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white hover:text-zinc-400 hover:border-zinc-400 transition-colors w-max whitespace-nowrap">
                     Xem Tất Cả Phim
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
                    {movies.map((movie) => (
                        <div 
                          key={movie.id} 
                          className="flex flex-col group cursor-pointer" 
                          ref={el => { movieRefs.current[movie.id] = el; }} 
                          onMouseEnter={() => handleMouseEnter(movie.id)} 
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                              if (window.innerWidth < 768) {
                                  setSelectedMovie(movie);
                              } else {
                                  router.push(`/film-detail/${movie.id}`);
                              }
                          }}
                        >
                            {/* Free-standing Poster Layout (Match /movies grid) */}
                            <div className="relative aspect-[2/3] w-full overflow-hidden mb-4 bg-zinc-900 shadow-xl border border-zinc-900">
                                <img src={movie.image} alt={movie.nameVn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1000ms] " />
                                
                                {/* Dark overlay just to make the UI popup obvious */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                
                                {/* Refined rating badge */}
                                {movie.ratings && (
                                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10 uppercase">
                                      ★ {movie.ratings}
                                  </div>
                                )}
                            </div>
                            
                            {/* Editorial Typography */}
                            <h3 className="text-[13px] md:text-sm font-semibold text-zinc-100 leading-snug mb-1 line-clamp-2 transition-colors">
                                {lang === "vi" ? movie.nameVn : movie.nameEn || movie.nameVn}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-widest font-medium mt-auto">
                                <span>{movie.format || '2D'}</span>
                                <span>•</span>
                                <span>{movie.time || 120} Phút</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-12 md:hidden">
                    <Link href="/movies" className="px-10 py-3 text-[11px] font-bold tracking-widest uppercase transition-all bg-white text-black hover:bg-zinc-200 w-full text-center justify-center">
                        {lang === 'en' ? 'View All' : 'Xem Tất Cả'}
                    </Link>
                </div>
            </div>

            {/* Popup Logic stays the same but disabled on mobile via CSS hidden */}
            {(pendingHover || hovered) && popupPos && (
                <div className="hidden md:block absolute z-50 pointer-events-none" style={{ top: popupPos.top + (popupPos.height / 2) - 30, left: popupPos.left + (popupPos.width / 2) - 210, width: 420 }}>
                    <div style={{ pointerEvents: 'auto' }} 
                         onMouseEnter={() => {
                             isPopupHoveredRef.current = true;
                             if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                         }} 
                         onMouseLeave={() => { 
                             isPopupHoveredRef.current = false; 
                             handleMouseLeave(); 
                         }}>
                        <div style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0px) scale(1)' : 'translateY(6px) scale(0.985)', transition: 'opacity 200ms ease, transform 200ms ease' }}>
                            {hovered && <MoviePopup movieId={hovered} lang={lang} onShowTrailer={(url) => setTrailerUrl(url)} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Sheet Popup - Synced with Component Design (Square Corners, Editorial) */}
            {selectedMovie && (
                <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end bg-black/80 backdrop-blur-md transition-all duration-300">
                    <div className="absolute inset-0" onClick={() => setSelectedMovie(null)} />
                    <div className="relative w-full bg-[#09090b] border-t border-zinc-800 p-6 pb-safe animate-[translate-y-0_0.3s_ease-out]">
                        <div className="w-12 h-1 bg-zinc-700 mx-auto mb-6 opacity-50" />
                        <div className="flex gap-4">
                            <img src={selectedMovie.image} alt={selectedMovie.nameVn} className="w-24 h-36 object-cover border border-zinc-800" />
                            <div className="flex flex-col justify-center">
                                <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-3">
                                    {lang === "vi" ? selectedMovie.nameVn : selectedMovie.nameEn || selectedMovie.nameVn}
                                </h3>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-widest font-medium mb-3">
                                    <span>{selectedMovie.format || '2D'}</span>
                                    <span>•</span>
                                    <span>{selectedMovie.time || 120} Phút</span>
                                </div>
                                {selectedMovie.ratings && (
                                    <div className="inline-block px-1.5 py-0.5 bg-white text-[10px] font-bold text-black uppercase w-max mb-2">
                                        ★ {selectedMovie.ratings}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => router.push(`/booking/${selectedMovie.id}`)}
                                className="flex-1 py-3.5 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors justify-center"
                            >
                                Mua Vé Ngay
                            </button>
                            <button 
                                onClick={() => router.push(`/film-detail/${selectedMovie.id}`)}
                                className="flex-1 py-3.5 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors justify-center"
                            >
                                Chi Tiết
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {trailerUrl && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={() => setTrailerUrl(null)}>
                    <div className="bg-[#09090b] border border-zinc-800 overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,1)] w-[90%] max-w-[1240px] aspect-video" onClick={e => e.stopPropagation()}>
                        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(trailerUrl)}?autoplay=1`} title="Trailer" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                        <button className="absolute top-6 right-6 text-white text-lg bg-black/50 border border-white/20 w-10 h-10 flex items-center justify-center hover:bg-white hover:text-black transition-colors" onClick={() => setTrailerUrl(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
