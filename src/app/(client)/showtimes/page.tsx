"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Movie, Theater } from '@/types';

export default function ShowtimesPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [allShowtimes, setAllShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTheater, setSelectedTheater] = useState<string>('ALL');

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      value: `${year}-${month}-${day}`,
      day: day,
      name: d.toLocaleDateString('vi', { weekday: 'long' }),
      month: month
    };
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/movies?status=NOW_SHOWING').then(res => res.json()),
      fetch('/api/theaters').then(res => res.json())
    ]).then(([moviesData, theatersData]) => {
      setMovies(moviesData.data || []);
      setTheaters(theatersData.data || []);
      setSelectedDate(dates[0].value);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/showtimes?date=${selectedDate}`)
      .then(res => res.json())
      .then(async data => {
        const { sandboxMerge } = await import('@/lib/sandboxStore');
        setAllShowtimes(sandboxMerge('showtimes', data.data || []));
      })
      .catch(console.error);
  }, [selectedDate]);

  const filteredTheaters = selectedTheater === 'ALL' 
    ? theaters 
    : theaters.filter(t => t.id === selectedTheater);

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center bg-[#09090b]">
      <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] pt-28 pb-32 text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Refined Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Lịch chiếu phim</h1>
            <p className="text-zinc-500 text-sm">Cập nhật lịch chiếu chi tiết toàn hệ thống</p>
          </div>
          
          {/* Subtle Select Picker */}
          <div className="relative">
             <select 
                value={selectedTheater}
                onChange={(e) => setSelectedTheater(e.target.value)}
                className="w-full md:w-64 bg-transparent border-b border-zinc-700 text-white text-sm pb-2 pt-1 appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer rounded-none"
             >
                <option value="ALL" className="bg-zinc-900">Tất cả cụm rạp</option>
                {theaters.map(t => (
                  <option key={t.id} value={t.id} className="bg-zinc-900">{t.nameVn || t.name || 'MS Cinema'}</option>
                ))}
             </select>
             <div className="absolute right-0 top-1.5 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </div>
          </div>
        </div>

        {/* Minimalist Tab Bar Scrubber */}
        <div className="flex gap-8 overflow-x-auto custom-scrollbar border-b border-zinc-800/80 mb-12 pb-px">
          {dates.map(date => {
            const isSelected = selectedDate === date.value;
            // Handle today/tomorrow labels
            const today = dates[0].value;
            const isToday = date.value === today;
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

        {/* Cinematic List Layout */}
        <div className="space-y-0">
          {movies.length === 0 ? (
             <div className="py-20 text-zinc-600 text-sm">Chưa có phim nào đang chiếu trong hôm nay.</div>
          ) : (
            movies.map(movie => (
              <div key={movie.id} className="py-10 border-b border-zinc-800/50 last:border-0 flex flex-col md:flex-row gap-8 md:gap-12">
                
                {/* Poster */}
                <div className="w-full md:w-[160px] lg:w-[200px] shrink-0">
                  <div className="aspect-[2/3] w-full relative">
                    <img src={movie.image} alt={movie.nameVn} className="w-full h-full object-cover rounded shadow-sm" />
                  </div>
                </div>

                {/* Information & Times */}
                <div className="flex-1 min-w-0">
                   <h2 className="text-2xl font-semibold tracking-tight text-white mb-1.5">{movie.nameVn}</h2>
                   <div className="text-xs text-zinc-500 flex items-center gap-2 mb-8">
                     <span>{movie.format || '2D'}</span>
                     <span>•</span>
                     <span>{movie.time || 120} phút</span>
                     <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded-sm text-[10px] uppercase">{movie.limitageNameVn || 'P'}</span>
                   </div>

                   {/* Theaters List for this movie */}
                   <div className="space-y-8">
                      {filteredTheaters.length === 0 ? (
                         <div className="text-sm text-zinc-600">Không có lịch chiếu tại rạp này.</div>
                      ) : (
                         filteredTheaters.map((theater, tIdx) => {
                           const theaterShowtimes = allShowtimes.filter(s => s.movieId === movie.id && s.theaterId === theater.id);
                           if (theaterShowtimes.length === 0) return null;
                           
                           // Extract unique start times and sort
                           const availableTimes = [...Array.from(new Set(theaterShowtimes.map(s => s.startTime)))].sort();

                           return (
                             <div key={theater.id}>
                               <h3 className="text-sm font-medium text-zinc-300 mb-3">{theater.nameVn || theater.name || 'MS Cinema'}</h3>
                               <div className="flex flex-wrap gap-2.5">
                                  {availableTimes.map((time: any, idx) => (
                                     <Link 
                                       key={idx} 
                                       href={`/booking/${movie.id}?showtime=${time}&theater=${theater.id}&date=${selectedDate}`}
                                       className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded hover:bg-white hover:text-black hover:border-white transition-colors"
                                     >
                                       {time}
                                     </Link>
                                  ))}
                               </div>
                             </div>
                           )
                         })
                      )}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
