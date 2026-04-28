"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Play, Info } from "lucide-react";
import { fetchCollection } from "@/lib/dataService";

const movieDetailCache = new Map<string, any>();

if (typeof window !== "undefined" && !document.getElementById("bloom-up-keyframes")) {
    const style = document.createElement("style");
    style.id = "bloom-up-keyframes";
    style.innerHTML = `
    @keyframes bloom-up {
        0% { opacity: 0; transform: scale(0.9) translateY(10px); } 
        100% { opacity: 1; transform: scale(1) translateY(0); } 
    }
    .bloom-up-normal { 
        animation: bloom-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
    }
    `;
    document.head.appendChild(style);
}

export default function MoviePopup({ 
    movieId, 
    lang = "vi", 
    onShowTrailer 
}: { 
    movieId: string; 
    lang?: "vi" | "en"; 
    onShowTrailer: (url: string) => void;
}) {
    const [detail, setDetail] = useState<any>(null);

    useEffect(() => {
        if (movieDetailCache.has(movieId)) {
            setDetail(movieDetailCache.get(movieId));
            return;
        }

        fetchCollection('movies')
            .then(data => {
                const match = data.find(m => m.id === movieId);
                if (match) {
                    setDetail(match);
                    movieDetailCache.set(movieId, match);
                }
            })
            .catch(console.error);
    }, [movieId]);

    if (!detail) return (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
            <div className="w-[320px] aspect-[16/10] bg-[#09090b] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-800 rounded flex items-center justify-center bloom-up-normal">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
            </div>
        </div>
    );

    const name = lang === "en" && detail.nameEn ? detail.nameEn : detail.nameVn;
    const brief = lang === "en" ? (detail.briefEn && detail.briefEn.trim() !== "" ? detail.briefEn : detail.briefVn) : detail.briefVn;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            {/* Cinematic Netflix-style expanded card */}
            <div className="w-[340px] pointer-events-auto bg-[#09090b] text-white shadow-[0_30px_60px_rgba(0,0,0,0.9)] border border-white/10 rounded bloom-up-normal overflow-hidden group">
                
                {/* Top Image / Backdrop */}
                <div className="relative w-full aspect-[16/9] bg-black">
                    <img src={detail.image} alt={name} className="w-full h-full object-cover object-top opacity-80" />
                    
                    {/* Dark gradient to blend into content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent"></div>
                    
                    {/* Age Rating Badge if exists */}
                    {detail.limitageNameVn && (
                        <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-white/10 uppercase">
                            {detail.limitageNameVn}
                        </div>
                    )}
                </div>

                {/* Content Block */}
                <div className="p-5 flex flex-col gap-3">
                    
                    {/* Quick Info Row */}
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                        {detail.ratings && (
                            <span className="text-white flex items-center gap-1 border border-white/20 px-1.5 py-0.5 rounded-sm">
                               ★ {detail.ratings}
                            </span>
                        )}
                        <span>{detail.format || '2D'}</span>
                        <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                        <span>{detail.time || 120} Phút</span>
                    </div>

                    {/* Titles */}
                    <div>
                        <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-1">{name}</h3>
                        {(lang === "vi" && detail.nameEn) || (lang === "en" && detail.nameVn) ? (
                            <div className="text-xs text-zinc-500 line-clamp-1">
                                {lang === "vi" ? detail.nameEn : detail.nameVn}
                            </div>
                        ) : null}
                    </div>

                    {/* Brief */}
                    {brief && (
                        <div className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                            {brief}
                        </div>
                    )}

                    {/* Action Buttons (Minimalist style) */}
                    <div className="flex gap-2 mt-2 pt-4 border-t border-zinc-800">
                        {detail.trailer && (
                            <button 
                                onClick={() => onShowTrailer(detail.trailer)}
                                className="w-10 h-10 shrink-0 border border-zinc-700 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                            >
                                <Play className="w-4 h-4 ml-0.5" />
                            </button>
                        )}
                        
                        {detail?.status === 'NOW_SHOWING' ? (
                            <Link 
                                href={`/booking/${movieId}`} 
                                className="flex-1 bg-white text-black font-bold text-[11px] uppercase tracking-widest flex items-center justify-center rounded-sm hover:bg-zinc-200 transition-colors"
                            >
                                Mua Vé Ngay
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-500 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center rounded-sm cursor-not-allowed"
                            >
                                Chưa Mở Bán
                            </button>
                        )}
                        
                        <Link 
                            href={`/film-detail/${movieId}`} 
                            className="w-10 h-10 shrink-0 border border-zinc-700 text-zinc-400 flex items-center justify-center rounded-full hover:border-white hover:text-white transition-colors"
                        >
                            <Info className="w-4 h-4" />
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
