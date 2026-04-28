"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Movie } from "@/types";
import { fetchCollection } from "@/lib/dataService";

const ITEMS_PER_PAGE = 15;

function MoviesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");
  const [currentPage, setCurrentPage] = useState(1);

  // Read search term from URL (set by navbar search)
  const urlSearch = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    fetchCollection('movies')
      .then(data => {
        // Lọc theo status trong memory thay vì query DB
        const filtered = data.filter(m => m.status === status);
        setMovies(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  // Filter using URL search param (from navbar)
  const filteredMovies = movies.filter(m =>
    !urlSearch ||
    m.nameVn?.toLowerCase().includes(urlSearch.toLowerCase()) ||
    m.nameEn?.toLowerCase().includes(urlSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginated = filteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [urlSearch]);

  return (
    <div className="min-h-screen bg-[#09090b] pt-28 pb-32 font-sans selection:bg-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Phim Điện Ảnh</h1>
            <p className="text-zinc-500 text-sm">
              {urlSearch
                ? `Kết quả tìm kiếm cho "${urlSearch}" — ${filteredMovies.length} phim`
                : "Khám phá danh mục điện ảnh chọn lọc"
              }
            </p>
          </div>
          {/* Clear search link when filtered */}
          {urlSearch && (
            <button
              onClick={() => router.push('/movies')}
              className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-700 hover:text-white hover:border-white transition-colors pb-1"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex gap-8 border-b border-zinc-800/80 mb-12 pb-px">
          {([
            { key: "NOW_SHOWING", label: "Phim Đang Chiếu" },
            { key: "COMING_SOON", label: "Phim Sắp Chiếu" }
          ] as const).map(tab => {
            const isSelected = status === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`pb-4 border-b-2 text-[13px] tracking-wide uppercase transition-all ${
                  isSelected
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Movie Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-zinc-500 text-sm">Không tìm thấy phim nào{urlSearch ? ` cho "${urlSearch}"` : ''}.</p>
            {urlSearch && (
              <button onClick={() => router.push('/movies')} className="mt-6 text-[10px] uppercase tracking-widest font-bold border-b border-white text-white pb-1">
                Xem tất cả phim
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
            {paginated.map(movie => (
              <Link key={movie.id} href={`/film-detail/${movie.id}`} className="flex flex-col group cursor-pointer">
                <div className="relative aspect-[2/3] w-full overflow-hidden mb-4 bg-zinc-900 shadow-xl border border-zinc-900">
                  <img
                    src={movie.image}
                    alt={movie.nameVn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1000ms]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  {movie.ratings && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10 uppercase">
                      ★ {movie.ratings}
                    </div>
                  )}
                  {/* Highlight search match */}
                  {urlSearch && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 leading-snug mb-1 line-clamp-2 transition-colors">
                  {movie.nameVn}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-widest font-medium mt-auto">
                  <span>{movie.format || '2D'}</span>
                  <span>•</span>
                  <span>{movie.time || 120} Phút</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-16">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-10 h-10 text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                  currentPage === i + 1
                    ? 'bg-white text-black border-white'
                    : 'border-zinc-700 text-zinc-400 hover:border-white hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] pt-28 pb-32 flex items-center justify-center text-zinc-500">Đang tải...</div>}>
      <MoviesContent />
    </Suspense>
  );
}
