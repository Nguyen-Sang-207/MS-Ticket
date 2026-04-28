"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, RefreshCw, X, CalendarDays, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Showtime } from "@/types";
import { useSandboxApi } from "@/hooks/useSandboxApi";

// ===================== SHOWTIME FORM =====================
function ShowtimeForm({ showtime, onClose, onSave }: { showtime: Showtime | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [form, setForm] = useState({
    movieId: showtime?.movieId || '',
    theaterId: showtime?.theaterId || '',
    roomId: showtime?.roomId || '',
    date: showtime?.date || new Date().toISOString().split('T')[0],
    startTime: showtime?.startTime || '10:00',
    endTime: showtime?.endTime || '12:00',
    languageVn: showtime?.languageVn || 'Phụ đề Việt',
    formatVn: showtime?.formatVn || '2D',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/movies?limit=100').then(r => r.json()),
      fetch('/api/theaters').then(r => r.json()),
    ]).then(([moviesData, theatersData]) => {
      setMovies(moviesData.data || []);
      setTheaters(theatersData.data || []);
    });
  }, []);

  useEffect(() => {
    if (!form.theaterId) return;
    fetch(`/api/rooms?theaterId=${form.theaterId}`).then(r => r.json()).then(d => setRooms(d.data || []));
  }, [form.theaterId]);

  const { create, update } = useSandboxApi('showtimes');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const selectedMovie = movies.find(m => m.id === form.movieId);
      const selectedTheater = theaters.find(t => t.id === form.theaterId);
      const selectedRoom = rooms.find(r => r.id === form.roomId);
      
      const fullData = {
        ...form,
        movieNameVn: selectedMovie?.nameVn || '',
        movieNameEn: selectedMovie?.nameEn || '',
        movieImage: selectedMovie?.image || '',
        theaterName: selectedTheater?.nameVn || selectedTheater?.name || '',
        roomName: selectedRoom?.name || '',
        totalSeats: selectedRoom?.totalSeats || 0,
        availableSeats: selectedRoom?.totalSeats || 0,
        bookedSeats: 0,
        isAvailable: true,
      };

      let res;
      if (showtime?.id) {
        res = await update(showtime.id, fullData, `/api/showtimes/${showtime.id}`);
      } else {
        res = await create(fullData, '/api/showtimes');
      }

      if (res.success) { onSave(); onClose(); }
      else setError(res.message || 'Lỗi');
    } catch { setError('Lỗi kết nối'); }
    setSaving(false);
  };

  const sel = (label: string, key: keyof typeof form, options: any[]) => (
    <div key={key}>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors">
        <option value="">-- Chọn --</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const inp = (label: string, key: keyof typeof form, type = 'text') => (
    <div key={key}>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{showtime ? 'Chỉnh sửa Suất Chiếu' : 'Tạo Suất Chiếu Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {sel('Phim', 'movieId', movies.map(m => ({ value: m.id, label: m.nameVn })))}
          {sel('Rạp chiếu', 'theaterId', theaters.map(t => ({ value: t.id, label: t.nameVn })))}
          {sel('Phòng chiếu', 'roomId', rooms.map(r => ({ value: r.id, label: r.name })))}
          {inp('Ngày chiếu', 'date', 'date')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Giờ bắt đầu', 'startTime', 'time')}
            {inp('Giờ kết thúc', 'endTime', 'time')}
          </div>
          {sel('Ngôn ngữ', 'languageVn', [
            { value: 'Phụ đề Việt', label: 'Phụ đề Việt' },
            { value: 'Lồng tiếng Việt', label: 'Lồng tiếng Việt' },
            { value: 'Tiếng Anh', label: 'Tiếng Anh' },
          ])}
          {sel('Định dạng', 'formatVn', [
            { value: '2D', label: '2D' },
            { value: '3D', label: '3D' },
            { value: 'IMAX 2D', label: 'IMAX 2D' },
            { value: 'IMAX 3D', label: 'IMAX 3D' },
            { value: '4DX', label: '4DX' },
          ])}
          {error && <p className="text-red-400 text-xs border border-red-900 px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu suất chiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function AdminShowtimes() {
  const { firebaseUser } = useAuth();
  const { remove } = useSandboxApi('showtimes');
  const [allShowtimes, setAllShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [collapsedMovies, setCollapsedMovies] = useState<Set<string>>(new Set());

  const toggleMovie = (movieName: string) => {
    setCollapsedMovies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieName)) newSet.delete(movieName);
      else newSet.add(movieName);
      return newSet;
    });
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/showtimes?adminMode=1&limit=1000`)
      .then(r => r.json())
      .then(async d => {
        const { sandboxMerge } = await import('@/lib/sandboxStore');
        const merged = sandboxMerge('showtimes', d.data || []);
        // Dedup: after rolling schedule shift, multiple seed weeks can map to same current date.
        // Keep the LATEST version (by createdAt) for each unique slot.
        const seen = new Map<string, any>();
        for (const s of merged) {
          const key = `${s.movieId}|${s.theaterId}|${s.roomId}|${s.date}|${s.startTime}`;
          const existing = seen.get(key);
          if (!existing || (s.createdAt && (!existing.createdAt || s.createdAt > existing.createdAt))) {
            seen.set(key, s);
          }
        }
        const deduped = Array.from(seen.values());
        setAllShowtimes(deduped);
        // Default all movies to collapsed on initial load
        const movieNames = new Set<string>(deduped.map((s: any) => s.movieNameVn || 'Phim Không Tên'));
        setCollapsedMovies(movieNames);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa suất chiếu này?')) return;
    setDeleting(id);
    const res = await remove(id);
    if (res.success) setAllShowtimes(prev => prev.filter(s => s.id !== id));
    else alert(res.message);
    setDeleting(null);
  };

  const filteredByDate = dateFilter ? allShowtimes.filter(s => s.date === dateFilter) : allShowtimes;
  const filtered = filteredByDate.filter(s =>
    !search || s.movieNameVn?.toLowerCase().includes(search.toLowerCase()) || s.theaterName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Suất Chiếu</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{filtered.length} suất chiếu</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditShowtime(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Tạo Suất Chiếu
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Controls: Date Tabs & Search */}
        <div className="flex flex-col xl:flex-row gap-8 xl:items-end justify-between border-b border-zinc-800 pb-2">
          <div className="flex-1 min-w-0 flex gap-8 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setDateFilter('')}
              className={`flex-shrink-0 flex flex-col pb-4 border-b-2 transition-all ${
                !dateFilter 
                ? 'border-white text-white' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-[10px] font-medium tracking-wide uppercase mb-1">Tổng hợp</span>
              <span className={`text-xl ${!dateFilter ? 'font-semibold' : 'font-normal'}`}>Tất cả</span>
            </button>
            
            {(() => {
              const getLocalDateStr = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              
              const today = new Date();
              const next7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() + i);
                return getLocalDateStr(d);
              });
              
              const displaySet = new Set([...next7Days]);
              if (dateFilter && !displaySet.has(dateFilter)) {
                displaySet.add(dateFilter);
              }
              
              return Array.from(displaySet).sort().map(d => {
                // Parse YYYY-MM-DD directly to avoid UTC offset (new Date('2026-04-29') = midnight UTC = shifts to Apr 28 in UTC+7)
                const [yr, mo, dy] = d.split('-').map(Number);
                const localDate = new Date(yr, mo - 1, dy);
                const day = String(dy).padStart(2, '0');
                const month = String(mo).padStart(2, '0');
                const dayName = localDate.toLocaleDateString('vi-VN', { weekday: 'long' });
                const isSelected = dateFilter === d;
                
                return (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`flex-shrink-0 flex flex-col pb-4 border-b-2 transition-all ${
                    isSelected 
                    ? 'border-white text-white' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="text-[10px] font-medium tracking-wide uppercase mb-1">{dayName}</span>
                  <span className={`text-xl ${isSelected ? 'font-semibold' : 'font-normal'}`}>{day}/{month}</span>
                </button>
              )})}
            )()}
            
            <div className="flex-shrink-0 flex flex-col justify-end pb-4 border-b-2 border-transparent pl-4 border-l border-zinc-800/50">
              <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase mb-1">Chọn ngày khác</span>
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-[#09090b] text-white border border-zinc-800 px-3 py-1.5 text-sm rounded focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div className="relative w-full xl:w-72 flex-shrink-0 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm phim, rạp..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0f] border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 appearance-none" />
          </div>
        </div>

        {/* Grouped Content */}
        {loading ? (
          <div className="text-center py-16 text-zinc-500 text-sm">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm border border-dashed border-zinc-800">Không tìm thấy suất chiếu nào phù hợp.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(
              filtered.reduce((acc, st) => {
                const dateKey = dateFilter ? 'showtimes' : st.date; // if no filter, group by date first
                if (!acc[dateKey]) acc[dateKey] = {};
                const m = st.movieNameVn || 'Phim Không Tên';
                if (!acc[dateKey][m]) acc[dateKey][m] = { movieNameEn: st.movieNameEn, theaters: {} };
                
                const tr = `${st.theaterName || 'Chưa định rạp'} - ${st.roomName || '?'}`;
                if (!acc[dateKey][m].theaters[tr]) acc[dateKey][m].theaters[tr] = [];
                acc[dateKey][m].theaters[tr].push(st);
                
                return acc;
              }, {} as any)
            ).map(([groupKey, moviesObj]: any) => (
              <div key={groupKey} className="space-y-6">
                {!dateFilter && (() => {
                  // Parse directly from YYYY-MM-DD to avoid UTC offset issues (new Date('2026-04-29') = midnight UTC = Apr 28 in some timezones)
                  const [yr, mo, dy] = groupKey.split('-');
                  const localDate = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                  const label = localDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                  const count = Object.values(moviesObj as any).reduce((sum: number, md: any) =>
                    sum + Object.values(md.theaters).flat().length, 0
                  );
                  return (
                    <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-[11px] font-normal text-zinc-500">{count as number} suất chiếu</span>
                    </h2>
                  );
                })()}
                
                {Object.entries(moviesObj).map(([movieName, movieData]: any) => {
                  const isCollapsed = collapsedMovies.has(movieName);
                  const totalShowtimes = Object.values(movieData.theaters).flat().length;
                  return (
                  <div key={movieName} className="border border-zinc-800 bg-[#09090b]">
                    <div 
                      className="bg-zinc-900/40 px-5 py-4 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition-colors"
                      onClick={() => toggleMovie(movieName)}
                    >
                      <div>
                        <h3 className="text-base font-bold text-white">{movieName}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{movieData.movieNameEn || 'Unknown Title'} • {totalShowtimes} suất chiếu</p>
                      </div>
                      <div className="text-zinc-500">
                        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                      </div>
                    </div>

                    {!isCollapsed && (
                    <div className="p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {Object.entries(movieData.theaters).map(([theaterRoom, stList]: any) => (
                        <div key={theaterRoom}>
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pb-3 mb-3 border-b border-zinc-800/50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {theaterRoom}
                          </h4>
                          
                          <div className="flex flex-wrap gap-3">
                            {stList.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)).map((st: any) => (
                              <div key={st.id} className="relative group border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 transition-colors p-3 w-40">
                                <div className="text-lg font-mono font-bold text-white text-center mb-1">{st.startTime}</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500 text-center flex justify-between px-2">
                                  <span>{st.formatVn || '2D'}</span>
                                  <span>Ghế: {st.availableSeats ?? '-'}</span>
                                </div>
                                
                                {/* Hover Actions Overlay */}
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditShowtime(st); setShowForm(true); }} className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(st.id)} disabled={deleting === st.id} className="w-8 h-8 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )})}
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && <ShowtimeForm showtime={editShowtime} onClose={() => setShowForm(false)} onSave={load} />}
    </div>
  );
}
