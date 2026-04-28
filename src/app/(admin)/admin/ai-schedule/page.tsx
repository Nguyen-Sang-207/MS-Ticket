"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Brain, Zap, Clock, CalendarDays, Loader2, Save, Trash2,
  ChevronLeft, ChevronRight, Info, CheckCircle2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Movie {
  id: string; nameVn: string; time: number;
  ratings: string; format?: string; status?: string; releaseDate?: string;
}
interface ScheduleEntry {
  id: string; // unique key for deletion
  movieId: string; movie: string; startTime: string; endTime: string;
  score: number; position: string; formatVn: string; roomId: string; roomName: string;
}
interface ScheduleResult {
  date: string; rawDate: string; isWeekend: boolean; screenings: ScheduleEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
const roundToSlot = (min: number): number => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const next = [0, 15, 30, 45].find(s => s >= m) ?? 60;
  if (next === 60) return (h + 1) * 60;
  return h * 60 + next;
};

// Stable color palette per movie (based on id hash)
const MOVIE_COLORS = [
  'bg-blue-900/60 border-blue-500/50 text-blue-200',
  'bg-purple-900/60 border-purple-500/50 text-purple-200',
  'bg-emerald-900/60 border-emerald-500/50 text-emerald-200',
  'bg-rose-900/60 border-rose-500/50 text-rose-200',
  'bg-amber-900/60 border-amber-500/50 text-amber-200',
  'bg-cyan-900/60 border-cyan-500/50 text-cyan-200',
  'bg-fuchsia-900/60 border-fuchsia-500/50 text-fuchsia-200',
  'bg-teal-900/60 border-teal-500/50 text-teal-200',
  'bg-orange-900/60 border-orange-500/50 text-orange-200',
  'bg-indigo-900/60 border-indigo-500/50 text-indigo-200',
];
const PRIME_COLOR = 'bg-yellow-900/60 border-yellow-400/70 text-yellow-200';

const getMovieColor = (movieId: string, position: string) => {
  if (position === 'prime') return PRIME_COLOR;
  let hash = 0;
  for (let i = 0; i < movieId.length; i++) hash = movieId.charCodeAt(i) + ((hash << 5) - hash);
  return MOVIE_COLORS[Math.abs(hash) % MOVIE_COLORS.length];
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AISchedulePage() {
  const { firebaseUser } = useAuth();

  // Data
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Config
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedTheater, setSelectedTheater] = useState<string>("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("23:30");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<ScheduleResult[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  // ── Fetch movies & theaters ──
  useEffect(() => {
    Promise.all([
      fetch('/api/movies?limit=100').then(r => r.json()),
      fetch('/api/theaters').then(r => r.json()),
    ]).then(([m, t]) => {
      const nowShowing = (m.data || []).filter((mv: Movie) => mv.status === 'NOW_SHOWING' || !mv.status);
      setMovies(nowShowing);
      setTheaters(t.data || []);
      if (t.data?.length > 0) setSelectedTheater(t.data[0].id);
    });
  }, []);

  // ── Fetch rooms when theater changes ──
  useEffect(() => {
    if (!selectedTheater) return;
    fetch(`/api/rooms?theaterId=${selectedTheater}`)
      .then(r => r.json()).then(d => setRooms(d.data || []));
  }, [selectedTheater]);

  const toggleMovie = (id: string) =>
    setSelectedMovies(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  // ── Delete a single screening from the draft ──
  const deleteScreening = useCallback((dayRawDate: string, screeningId: string) => {
    setResults(prev => prev.map(day => {
      if (day.rawDate !== dayRawDate) return day;
      return { ...day, screenings: day.screenings.filter(s => s.id !== screeningId) };
    }).filter(day => day.screenings.length > 0));
  }, []);

  // ─────────────────────────────── AI ALGORITHM ───────────────────────────────
  const runAISchedule = async () => {
    if (selectedMovies.length === 0 || rooms.length === 0) return;
    setIsGenerating(true); setProgress(0); setResults([]); setSavedCount(null);

    // Animate progress
    const interval = setInterval(() => {
      setProgress(prev => { if (prev >= 88) { clearInterval(interval); return 88; } return prev + Math.random() * 9; });
    }, 300);
    await new Promise(res => setTimeout(res, 1800));
    clearInterval(interval); setProgress(100);

    const selectedMovieData = movies.filter(m => selectedMovies.includes(m.id));
    const today = new Date();

    const getFreshness = (releaseDate?: string): number => {
      if (!releaseDate) return 0;
      const diff = (today.getTime() - new Date(releaseDate).getTime()) / 86400000;
      if (diff <= 14) return 3;
      if (diff <= 30) return 2;
      if (diff <= 60) return 1;
      return 0;
    };

    const getDayType = (d: Date) => {
      const dow = d.getDay();
      return (dow === 0 || dow === 6) ? 'peak' : (dow === 5) ? 'high' : 'normal';
    };

    // Whether a movie should appear on a given day
    const shouldShowOnDay = (movie: Movie, dayType: string, dayIdx: number): boolean => {
      const r = parseFloat(movie.ratings || '5');
      const fresh = getFreshness(movie.releaseDate);
      const offset = movie.id.charCodeAt(0) || 0;
      const hash = offset + dayIdx;
      if (dayType === 'normal') {
        if (r < 6.0 && fresh === 0) return hash % 2 === 0;
        if (r < 7.0 && fresh <= 1) return hash % 3 !== 0;
      }
      return true;
    };

    // Score a movie (higher = more desirable)
    const movieScore = (m: Movie) => parseFloat(m.ratings || '5') * 2 + getFreshness(m.releaseDate) * 3;

    const OPEN = roundToSlot(toMin(openTime));
    const CLOSE = toMin(closeTime);
    const STAGGER = 15;    // stagger between room starts (CGV-style)
    const BUFFER_STD = 15; // ads + cleanup for standard rooms
    const BUFFER_VIP = 30; // premium spacing for VIP
    const PRIME_S = 18 * 60;
    const PRIME_E = 22 * 60;

    const mockResults: ScheduleResult[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let dayIdx = 0;
    let entrySeq = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), dayIdx++) {
      const rawDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const dayType = getDayType(d);
      const isWeekend = dayType === 'peak';
      const allScreenings: ScheduleEntry[] = [];

      // ─── Step 1: Today's movies sorted by desirability ───
      const dayMovies = selectedMovieData
        .filter(m => shouldShowOnDay(m, dayType, dayIdx))
        .sort((a, b) => movieScore(b) - movieScore(a));

      if (dayMovies.length === 0) continue;

      // ─── Step 2: Assign 2-3 films per room (CGV pattern) ───
      // Top films appear in multiple rooms; weaker films in fewer
      for (let rIdx = 0; rIdx < rooms.length; rIdx++) {
        const room = rooms[rIdx];
        const isVipRoom = room.name?.toLowerCase().includes('vip');
        const eligible = isVipRoom
          ? dayMovies.filter(m => parseFloat(m.ratings || '0') >= 7.0)
          : dayMovies;

        if (eligible.length === 0) continue;

        // Assign 2-3 rotating films, offset per room for variety
        const filmsPerRoom = Math.min(eligible.length, isVipRoom ? 2 : 3);
        const assigned: Movie[] = [];
        for (let f = 0; f < filmsPerRoom; f++) {
          // Rotate film assignment per day using dayIdx offset
          const pick = eligible[(rIdx + f + dayIdx) % eligible.length];
          if (!assigned.find(a => a.id === pick.id)) assigned.push(pick);
        }
        // Fill if short
        for (const m of eligible) {
          if (assigned.length >= filmsPerRoom) break;
          if (!assigned.find(a => a.id === m.id)) assigned.push(m);
        }
        if (assigned.length === 0) assigned.push(eligible[0]);

        // ─── Step 3: Fill room by cycling assigned films ───
        const buffer = isVipRoom ? BUFFER_VIP : BUFFER_STD;
        // CGV staggers: Room 1 @ 09:00, Room 2 @ 09:15, Room 3 @ 09:30
        let cur = roundToSlot(OPEN + rIdx * STAGGER);
        let filmIdx = 0;

        while (cur < CLOSE) {
          const candidate = assigned[filmIdx % assigned.length];
          filmIdx++;

          const dur = candidate.time || 120;
          const rawEnd = cur + dur;
          if (rawEnd > CLOSE) break;

          const position = cur >= PRIME_S && cur < PRIME_E ? 'prime'
            : cur >= 12 * 60 && cur < PRIME_S ? 'chieu'
            : cur >= PRIME_E ? 'khuya' : 'sang';

          const rating = parseFloat(candidate.ratings || '5');
          const fresh = getFreshness(candidate.releaseDate);
          const score = Math.min(99, Math.round(
            rating * 3.5
            + (position === 'prime' ? 25 : position === 'chieu' ? 12 : position === 'khuya' ? 8 : 5)
            + fresh * 3 + (isWeekend ? 8 : 0)
          ));

          allScreenings.push({
            id: `${rawDate}-${room.id}-${entrySeq++}`,
            movieId: candidate.id, movie: candidate.nameVn,
            formatVn: candidate.format || '2D',
            startTime: fromMin(cur), endTime: fromMin(rawEnd),
            score, position, roomId: room.id, roomName: room.name || room.id,
          });

          cur = roundToSlot(rawEnd + buffer);
        }
      }

      // Sort all screenings for this day
      const valid = [...allScreenings];

      valid.sort((a, b) => {
        const t = toMin(a.startTime) - toMin(b.startTime);
        return t !== 0 ? t : a.roomName.localeCompare(b.roomName);
      });

      if (valid.length > 0) {
        mockResults.push({ rawDate, date: dateLabel, isWeekend, screenings: valid });
      }
    }

    setResults(mockResults);
    setDayIndex(0);
    setIsGenerating(false);
  };

  // ─── Save to DB ──────────────────────────────────────────────────────────────
  const handleSaveToDB = async () => {
    if (!firebaseUser || !selectedTheater || results.length === 0) return;
    setSaving(true); setSavedCount(null);

    const existingKeys = new Set<string>();
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/showtimes?theaterId=${selectedTheater}&limit=500`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      for (const s of (data.data || [])) existingKeys.add(`${s.roomId}_${s.date}_${s.startTime}_${s.movieId}`);
    } catch {}

    try {
      const token = await firebaseUser.getIdToken();
      let count = 0;
      let skipped = 0;
      for (const day of results) {
        for (const s of day.screenings) {
          const key = `${s.roomId}_${day.rawDate}_${s.startTime}_${s.movieId}`;
          if (existingKeys.has(key)) {
            skipped++;
            continue;
          }
          await fetch('/api/showtimes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              movieId: s.movieId, theaterId: selectedTheater, roomId: s.roomId,
              date: day.rawDate, startTime: s.startTime, endTime: s.endTime,
              languageVn: 'Phụ đề Việt', formatVn: s.formatVn,
            }),
          });
          count++;
        }
      }
      setSavedCount(count);
      setSkippedCount(skipped);
      setResults([]);
      setSelectedMovies([]);
    } catch {
      alert('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived display ─────────────────────────────────────────────────────────
  const currentDay = results[dayIndex] || null;
  const roomList = rooms.length > 0 ? rooms : [];

  const totalScreenings = results.reduce((s, d) => s + d.screenings.length, 0);

  // Build movie color legend
  const movieLegend = selectedMovies.map(id => {
    const m = movies.find(mv => mv.id === id);
    if (!m) return null;
    // find first screening for this movie in results to get color
    const ex = results.flatMap(d => d.screenings).find(s => s.movieId === id);
    const color = ex ? getMovieColor(id, ex.position !== 'prime' ? ex.position : 'chieu') : getMovieColor(id, 'chieu');
    return { id, name: m.nameVn, color };
  }).filter(Boolean);

  const posLabel: Record<string, string> = {
    sang: 'Sáng', chieu: 'Chiều', prime: 'Giờ vàng', khuya: 'Khuya',
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-white" /> AI Lập Lịch Chiếu
          </h1>
          <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold mt-0.5">
            AI tạo bản nháp — bạn chỉnh sửa — sau đó mới lưu xuống database
          </p>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-bold text-white">{totalScreenings}</span> suất chiếu trong bản nháp
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

        {/* ── LEFT: Config panel ─────────────────────── */}
        <div className="bg-[#0d0d0f] border border-zinc-800 p-5 space-y-5 sticky top-4">
          {/* Theater */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Rạp chiếu</label>
            <select
              value={selectedTheater}
              onChange={e => setSelectedTheater(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-700 text-white text-sm pb-2 appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer"
            >
              <option value="" className="bg-zinc-900">-- Chọn rạp --</option>
              {theaters.map(t => <option key={t.id} value={t.id} className="bg-zinc-900">{t.nameVn}</option>)}
            </select>
            {roomList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roomList.map(r => (
                  <span key={r.id} className="text-[10px] px-2 py-0.5 border border-zinc-700 text-zinc-400 font-mono">
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Mở cửa</label>
              <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white text-sm pb-2 focus:outline-none focus:border-white transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Đóng cửa</label>
              <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white text-sm pb-2 focus:outline-none focus:border-white transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Ngày bắt đầu</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white text-sm pb-2 focus:outline-none focus:border-white transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Ngày kết thúc</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 text-white text-sm pb-2 focus:outline-none focus:border-white transition-colors" />
            </div>
          </div>

          {/* Golden time note */}
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-3 flex gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-yellow-400 font-bold">Giờ vàng 18:00–22:00:</span> Phim rating cao + mới nhất tự động được ưu tiên vào khung này. Suất chiếu màu vàng trong timeline là giờ vàng.
            </p>
          </div>

          {/* Movie selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Phim — {selectedMovies.length}/{movies.length} đã chọn
              </label>
              <div className="flex gap-2 text-[10px] uppercase tracking-widest font-bold">
                <button onClick={() => setSelectedMovies(movies.map(m => m.id))} className="text-white hover:text-zinc-300 transition-colors">Tất cả</button>
                <span className="text-zinc-700">|</span>
                <button onClick={() => setSelectedMovies([])} className="text-zinc-500 hover:text-zinc-300 transition-colors">Bỏ hết</button>
              </div>
            </div>
            <div className="space-y-px max-h-56 overflow-y-auto custom-scrollbar">
              {movies.map(m => {
                const r = parseFloat(m.ratings || '0');
                const tag = r >= 8 ? 'Blockbuster' : r >= 7 ? 'Phim hay' : r >= 6 ? 'Trung bình' : 'Thấp';
                const tagColor = r >= 8 ? 'text-yellow-400' : r >= 7 ? 'text-green-400' : r >= 6 ? 'text-zinc-400' : 'text-red-400';
                return (
                  <label key={m.id} className={`flex items-start gap-2.5 p-2.5 cursor-pointer transition-all border-b border-zinc-800/30 hover:bg-zinc-900/40 ${selectedMovies.includes(m.id) ? 'bg-zinc-900/60' : ''}`}>
                    <input type="checkbox" checked={selectedMovies.includes(m.id)} onChange={() => toggleMovie(m.id)} className="accent-white mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${selectedMovies.includes(m.id) ? 'text-white' : 'text-zinc-400'}`}>{m.nameVn}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-zinc-600 text-[10px]">{m.time || 120}p</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-500 text-[10px]">{m.ratings} IMDb</span>
                        <span className="text-zinc-700">·</span>
                        <span className={`text-[10px] font-bold ${tagColor}`}>{tag}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
              {movies.length === 0 && <p className="text-zinc-600 text-xs p-3">Chưa có phim Đang Chiếu nào.</p>}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={runAISchedule}
            disabled={selectedMovies.length === 0 || rooms.length === 0 || isGenerating}
            className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold py-3 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo... {Math.round(progress)}%</>
            ) : (
              <><Brain className="w-4 h-4" /> Tạo bản nháp bằng AI</>
            )}
          </button>

          {isGenerating && (
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div className="bg-white h-1 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Timeline draft editor ───────────── */}
        <div className="space-y-4">

          {/* Success banner */}
          {savedCount !== null && (
            <div className="flex items-center gap-3 border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-bold text-sm">
                  Đã lưu thành công {savedCount} suất chiếu mới!
                  {skippedCount > 0 && <span className="text-emerald-500 font-normal ml-2">(Bỏ qua {skippedCount} suất đã tồn tại trước đó)</span>}
                </div>
                <div className="text-xs text-emerald-600 mt-0.5">Trang lịch chiếu và trang đặt vé đã được cập nhật.</div>
              </div>
            </div>
          )}

          {results.length === 0 && !isGenerating && (
            <div className="border border-dashed border-zinc-700 p-16 text-center">
              <Brain className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Chọn phim và nhấn <span className="text-white font-semibold">"Tạo bản nháp bằng AI"</span> để bắt đầu</p>
              <p className="text-zinc-700 text-xs mt-2">AI sẽ tạo lịch gợi ý — bạn xem, chỉnh sửa rồi mới lưu xuống database</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Day navigator */}
              <div className="flex items-center gap-3">
                <button onClick={() => setDayIndex(i => Math.max(0, i - 1))} disabled={dayIndex === 0}
                  className="p-1.5 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex overflow-x-auto gap-2 custom-scrollbar">
                  {results.map((day, i) => (
                    <button key={i} onClick={() => setDayIndex(i)}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold tracking-wide border transition-colors ${i === dayIndex
                        ? (day.isWeekend ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' : 'border-white text-white bg-zinc-800')
                        : (day.isWeekend ? 'border-yellow-500/30 text-yellow-600 hover:border-yellow-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500')
                      }`}
                    >
                      {day.date}
                      {day.isWeekend && <span className="ml-1 text-[9px]">★</span>}
                    </button>
                  ))}
                </div>
                <button onClick={() => setDayIndex(i => Math.min(results.length - 1, i + 1))} disabled={dayIndex === results.length - 1}
                  className="p-1.5 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {currentDay && (
                <>
                  {/* Day header */}
                  <div className={`flex items-center gap-3 px-4 py-3 border ${currentDay.isWeekend ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                    <CalendarDays className={`w-4 h-4 ${currentDay.isWeekend ? 'text-yellow-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-white">{currentDay.date}</span>
                    {currentDay.isWeekend && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 border border-yellow-500/40 px-1.5 py-0.5">Cuối tuần</span>
                    )}
                    <span className="ml-auto text-xs text-zinc-500">{currentDay.screenings.length} suất · Bấm <Trash2 className="inline w-3 h-3" /> để xóa trước khi lưu</span>
                  </div>

                  {/* Timeline: columns per room */}
                  <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.max(1, roomList.length)}, minmax(0, 1fr))` }}>
                    {roomList.map(room => {
                      const roomScreenings = currentDay.screenings.filter(s => s.roomId === room.id);
                      const isVip = room.name?.toLowerCase().includes('vip');
                      return (
                        <div key={room.id} className="space-y-1.5">
                          {/* Room header */}
                          <div className={`text-center py-1.5 text-[10px] font-bold uppercase tracking-widest border ${isVip ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/5' : 'border-zinc-700 text-zinc-400 bg-zinc-900/40'}`}>
                            {room.name}
                          </div>

                          {/* Screenings */}
                          {roomScreenings.length === 0 ? (
                            <div className="border border-dashed border-zinc-800 py-8 text-center text-zinc-700 text-[11px]">Không có suất</div>
                          ) : (
                            roomScreenings.map(s => {
                              const colorClass = getMovieColor(s.movieId, s.position);
                              return (
                                <div key={s.id} className={`relative border p-2.5 group transition-opacity ${colorClass}`}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-[10px] font-bold mb-0.5 opacity-80">
                                        {s.startTime} – {s.endTime}
                                      </div>
                                      <div className="text-xs font-semibold leading-tight line-clamp-2">{s.movie}</div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        {s.position === 'prime' && (
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-0.5">
                                            <Zap className="w-2.5 h-2.5" /> Giờ vàng
                                          </span>
                                        )}
                                        {s.position !== 'prime' && (
                                          <span className="text-[9px] opacity-60">{posLabel[s.position]}</span>
                                        )}
                                        <span className="text-[9px] opacity-50 font-mono">{s.formatVn}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteScreening(currentDay.rawDate, s.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 flex-shrink-0 mt-0.5"
                                      title="Xóa suất này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Info note */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    Di chuyển chuột vào suất chiếu để xuất hiện nút xóa. Sau khi chỉnh xong tất cả các ngày, nhấn Lưu bên dưới.
                  </div>
                </>
              )}

              {/* Save button */}
              <button
                onClick={handleSaveToDB}
                disabled={saving}
                className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-3.5 flex items-center justify-center gap-2 transition-colors"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu {totalScreenings} suất chiếu...</>
                  : <><Save className="w-4 h-4" /> Lưu {totalScreenings} suất chiếu xuống Database</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
