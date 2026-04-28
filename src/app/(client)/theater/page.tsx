"use client";

import React, { useState, useEffect } from "react";
import { Theater, Movie } from "@/types";
import { MapPin, Clock, Film } from "lucide-react";
import Link from "next/link";



export default function TheaterPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [selected, setSelected] = useState<Theater | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allShowtimes, setAllShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/theaters').then(r => r.json()),
      fetch('/api/movies?status=NOW_SHOWING&limit=6').then(r => r.json()),
    ]).then(([theatersData, moviesData]) => {
      if (theatersData.statusCode === 200) {
        setTheaters(theatersData.data || []);
        if (theatersData.data && theatersData.data.length > 0) setSelected(theatersData.data[0]);
      }
      if (moviesData.statusCode === 200) setMovies(moviesData.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected || !selectedDate) return;
    fetch(`/api/showtimes?theaterId=${selected.id}&date=${selectedDate}`)
      .then(res => res.json())
      .then(async data => {
        const { sandboxMerge } = await import('@/lib/sandboxStore');
        setAllShowtimes(sandboxMerge('showtimes', data.data || []));
      })
      .catch(console.error);
  }, [selected, selectedDate]);

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center bg-[#09090b]">
      <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  // Generate dates (next 7 days)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { 
      value: `${year}-${month}-${day}`, 
      day: day,
      name: d.toLocaleDateString('vi-VN', { weekday: 'long' }),
      month: month
    };
  });

  return (
    <div className="min-h-screen bg-[#09090b] pt-28 pb-32 text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header & Minimalist Select Picker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Hệ thống Rạp</h1>
            <p className="text-zinc-500 text-sm">Trải nghiệm không gian điện ảnh đẳng cấp</p>
          </div>
          
          <div className="relative">
             <select 
                value={selected?.id || ''}
                onChange={(e) => {
                  const t = theaters.find(th => th.id === e.target.value);
                  if (t) setSelected(t);
                }}
                className="w-full md:w-64 bg-transparent border-b border-zinc-700 text-white text-sm pb-2 pt-1 appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer rounded-none"
             >
                {theaters.map(t => (
                  <option key={t.id} value={t.id} className="bg-zinc-900">{t.nameVn || t.name || 'MS Cinema'}</option>
                ))}
             </select>
             <div className="absolute right-0 top-1.5 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </div>
          </div>
        </div>

        {selected && (
          <div className="animate-in fade-in duration-500">
            {/* Elegant Typography Information */}
             <div className="py-10 border-b border-zinc-800">
               <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight mb-1.5">
                 {selected.nameVn || selected.name || 'MS Cinema'}
               </h2>
               <p className="text-zinc-500 text-sm max-w-2xl flex items-center gap-2">
                 <MapPin className="w-3.5 h-3.5" /> {selected.nameEn || selected.nameVn || selected.name || 'MS Cinema'}
               </p>
               
               <div className="mt-8 flex flex-wrap gap-4 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                  <span className="flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full"></span> IMAX LASER 4K</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full"></span> Dolby Atmos 7.1</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full"></span> Phòng chờ Thương gia</span>
                  <span className="flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full"></span> Ghế Đôi Sweetbox</span>
               </div>
            </div>

            {/* Minimalist Date Scrubber */}
            <div className="flex gap-8 overflow-x-auto custom-scrollbar border-b border-zinc-800/80 mb-10 pb-px mt-12">
              {dates.map(date => {
                const isSelected = selectedDate === date.value;
                const isToday = date.value === dates[0].value;
                const displayDayName = isToday ? "Hôm nay" : date.name;

                return (
                  <button 
                    key={date.value} 
                    onClick={() => setSelectedDate(date.value)}
                    className={`flex-shrink-0 flex flex-col pb-4 border-b-2 transition-all ${
                      isSelected 
                      ? 'border-white text-white' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-medium tracking-wide uppercase mb-1">{displayDayName}</span>
                    <span className={`text-xl ${isSelected ? 'font-semibold' : 'font-normal'}`}>{date.day}/{date.month}</span>
                  </button>
                );
              })}
            </div>

            {/* Free-standing Movie List Layout */}
            <div className="space-y-0">
              {movies.length === 0 ? (
                 <div className="py-20 text-zinc-600 text-sm">Chưa có lịch chiếu tại rạp này.</div>
              ) : (
                movies.map((movie, mIdx) => {
                  const movieShowtimes = allShowtimes.filter(s => s.movieId === movie.id);
                  if (movieShowtimes.length === 0) return null;
                  
                  const movieTimes = [...Array.from(new Set(movieShowtimes.map(s => s.startTime)))].sort();

                  return (
                    <div key={movie.id} className="py-10 border-b border-zinc-800/50 last:border-0 flex flex-col md:flex-row gap-8 md:gap-12">
                      {/* Poster */}
                      <div className="w-full md:w-[160px] lg:w-[200px] shrink-0">
                        <div className="aspect-[2/3] w-full relative">
                          <img src={movie.image} alt={movie.nameVn} className="w-full h-full object-cover rounded shadow-sm" />
                        </div>
                      </div>

                      {/* Information & Times */}
                      <div className="flex-1 min-w-0">
                         <h3 className="text-2xl font-semibold tracking-tight text-white mb-1.5">{movie.nameVn}</h3>
                         <div className="text-xs text-zinc-500 flex items-center gap-2 mb-8">
                           <span>{movie.format || '2D'}</span>
                           <span>•</span>
                           <span>{movie.time || 120} phút</span>
                           <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded-sm text-[10px] uppercase">
                             {movie.limitageNameVn || 'P'}
                           </span>
                         </div>

                         <div>
                           <h4 className="text-[10px] tracking-widest uppercase text-zinc-500 mb-4 inline-block">Khung Giờ Chiếu</h4>
                           <div className="flex flex-wrap gap-2.5">
                              {movieTimes.map((time, idx) => (
                                 <Link 
                                   key={idx} 
                                   href={`/booking/${movie.id}?showtime=${time}&theater=${selected.id}&date=${selectedDate}`}
                                   className="px-4 py-2 bg-[#09090b] border border-zinc-700 text-zinc-300 text-sm rounded hover:bg-white hover:text-black hover:border-white transition-colors"
                                 >
                                   {time}
                                 </Link>
                              ))}
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
