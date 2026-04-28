"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, Trash2, Edit2, Plus, DownloadCloud, RefreshCw, Star, Clock, Check, X } from "lucide-react";
import { Movie } from "@/types";
import { useAuth } from "@/context/AuthContext";

// ===================== TYPES =====================
interface TmdbMovie {
  tmdbId: number;
  nameVn: string;
  nameEn: string;
  image: string;
  briefVn: string;
  ratings: string;
  time: number;
  releaseDate: string;
  status: string;
  listGenre: string[];
  trailer: string;
}

// ===================== MOVIE FORM MODAL =====================
function MovieFormModal({ movie, onClose, onSave }: { movie: Movie | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    nameVn: movie?.nameVn || '',
    nameEn: movie?.nameEn || '',
    director: movie?.director || '',
    actor: (movie as any)?.actor || '',
    time: movie?.time?.toString() || '120',
    ratings: movie?.ratings || '',
    status: movie?.status || 'NOW_SHOWING',
    releaseDate: movie?.releaseDate?.split('T')[0] || '',
    briefVn: movie?.briefVn || '',
    briefEn: movie?.briefEn || '',
    format: (movie as any)?.format || '2D',
    limitageNameVn: movie?.limitageNameVn || 'T16',
    image: movie?.image || '',
    trailer: movie?.trailer || '',
    listGenre: movie?.listGenre?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const payload = {
        ...form,
        time: parseInt(form.time || '120'),
        listGenre: form.listGenre.split(',').map((s: string) => s.trim()).filter(Boolean),
        listActor: [],
      };

      const url = movie?.id ? `/api/movies/${movie.id}` : '/api/movies';
      const method = movie?.id ? 'PUT' : 'POST';

      // For new movie, use FormData (existing POST API requires it)
      // For edit, use JSON (updated PUT API accepts it)
      if (method === 'PUT') {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.statusCode === 200 || data.statusCode === 201) { onSave(); onClose(); }
        else setError(data.message || 'Có lỗi xảy ra');
      } else {
        // POST - use FormData for new movie creation (existing API)
        const formData = new FormData();
        formData.append('nameVn', payload.nameVn);
        formData.append('nameEn', payload.nameEn);
        formData.append('director', payload.director);
        formData.append('actor', payload.actor);
        formData.append('time', payload.time.toString());
        formData.append('ratings', payload.ratings);
        formData.append('status', payload.status);
        formData.append('releaseDate', payload.releaseDate);
        formData.append('briefVn', payload.briefVn);
        formData.append('briefEn', payload.briefEn);
        formData.append('format', payload.format);
        formData.append('limitageNameVn', payload.limitageNameVn);
        formData.append('imageUrl', payload.image);
        formData.append('trailerUrl', payload.trailer);
        formData.append('listGenre', JSON.stringify(payload.listGenre));
        formData.append('listActor', JSON.stringify(payload.listActor));
        const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.statusCode === 200 || data.statusCode === 201) { onSave(); onClose(); }
        else setError(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Lỗi kết nối');
    }
    setSaving(false);
  };


  const field = (label: string, key: keyof typeof form, type = 'text', opts?: any) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      {type === 'select' ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors">
          {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white resize-none transition-colors" />
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white">{movie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}</h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{movie?.nameEn || 'Nhập thông tin phim thủ công'}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Tên Tiếng Việt', 'nameVn')}
            {field('Tên Tiếng Anh', 'nameEn')}
            {field('Đạo diễn', 'director')}
            {field('Diễn viên', 'actor')}
            {field('Thời lượng (phút)', 'time', 'number')}
            {field('Điểm IMDb', 'ratings')}
            {field('Trạng thái', 'status', 'select', [
              { value: 'NOW_SHOWING', label: 'Đang chiếu' },
              { value: 'COMING_SOON', label: 'Sắp chiếu' },
              { value: 'ENDED', label: 'Đã kết thúc' },
            ])}
            {field('Định dạng', 'format', 'select', [
              { value: '2D', label: '2D' },
              { value: '3D', label: '3D' },
              { value: 'IMAX', label: 'IMAX' },
              { value: '4DX', label: '4DX' },
            ])}
            {field('Giới hạn tuổi', 'limitageNameVn', 'select', [
              { value: 'P', label: 'P - Mọi lứa tuổi' },
              { value: 'T13', label: 'T13 - Từ 13 tuổi' },
              { value: 'T16', label: 'T16 - Từ 16 tuổi' },
              { value: 'T18', label: 'T18 - Từ 18 tuổi' },
              { value: 'C', label: 'C - Cấm phổ biến' },
            ])}
            {field('Ngày khởi chiếu', 'releaseDate', 'date')}
          </div>
          <div className="space-y-4">
            {field('URL Poster', 'image')}
            {field('URL Trailer (YouTube)', 'trailer')}
            {field('Thể loại (phân tách bằng dấu phẩy)', 'listGenre')}
            {field('Tóm tắt Tiếng Việt', 'briefVn', 'textarea')}
            {field('Tóm tắt Tiếng Anh', 'briefEn', 'textarea')}
          </div>
          {error && <p className="text-red-400 text-xs border border-red-900 px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-[11px] uppercase tracking-widest font-bold transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu phim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== TMDB IMPORT MODAL =====================
function TmdbImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { firebaseUser } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('now_playing');
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [imported, setImported] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const search = async () => {
    setLoading(true);
    setError('');
    const url = query ? `/api/admin/tmdb?query=${encodeURIComponent(query)}` : `/api/admin/tmdb?type=${type}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.statusCode === 500) setError(data.message);
    else setResults(data.data || []);
    setLoading(false);
  };

  useEffect(() => { search(); }, [type]);

  const importMovie = async (movie: TmdbMovie) => {
    setImporting(movie.tmdbId);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch('/api/admin/tmdb/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tmdbId: movie.tmdbId, status: movie.status }),
      });
      const data = await res.json();
      if (data.statusCode === 201) {
        setImported(prev => new Set([...prev, movie.tmdbId]));
        onImported();
      } else {
        alert(data.message);
      }
    } catch { alert('Lỗi nhập phim'); }
    setImporting(null);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><DownloadCloud className="w-5 h-5 text-blue-400" /> Nhập phim từ TMDB</h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">The Movie Database — Nguồn dữ liệu toàn cầu</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-8 py-4 border-b border-zinc-800 shrink-0 flex gap-3">
          <div className="flex gap-2">
            {['now_playing', 'upcoming', 'popular'].map(t => (
              <button key={t} onClick={() => { setType(t); setQuery(''); }}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${type === t && !query ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-400 hover:text-white'}`}>
                {t === 'now_playing' ? 'Đang chiếu' : t === 'upcoming' ? 'Sắp chiếu' : 'Phổ biến'}
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Tìm kiếm phim trên TMDB..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-white transition-colors" />
            </div>
            <button onClick={search} className="px-4 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Tìm</button>
          </div>
        </div>

        {error && <div className="px-8 py-3 bg-red-950 border-b border-red-900 text-red-400 text-xs">{error}</div>}

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-zinc-500 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải từ TMDB...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
              {results.map(movie => {
                const isImported = imported.has(movie.tmdbId);
                const isImporting = importing === movie.tmdbId;
                return (
                  <div key={movie.tmdbId} className="border border-zinc-800 group relative">
                    <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                      {movie.image ? <img src={movie.image} className="w-full h-full object-cover" alt={movie.nameVn} /> : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No Image</div>}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center gap-1 text-[9px] text-zinc-300">
                          <Star className="w-2.5 h-2.5 text-yellow-400" /> {movie.ratings}
                          <span className="ml-2 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {movie.time}m</span>
                        </div>
                      </div>
                      {isImported && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Check className="w-8 h-8 text-green-400" /></div>}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-semibold text-white line-clamp-1 mb-1">{movie.nameVn}</h4>
                      <p className="text-[9px] text-zinc-500 line-clamp-1 mb-3">{movie.nameEn}</p>
                      <button onClick={() => importMovie(movie)} disabled={isImported || isImporting}
                        className={`w-full py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${isImported ? 'bg-zinc-800 text-zinc-600 cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}>
                        {isImporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : isImported ? <Check className="w-3 h-3" /> : <DownloadCloud className="w-3 h-3" />}
                        {isImporting ? 'Đang nhập...' : isImported ? 'Đã nhập' : 'Nhập phim'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function AdminMovies() {
  const { firebaseUser } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [showTmdb, setShowTmdb] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMovies = useCallback(() => {
    setLoading(true);
    fetch('/api/movies?limit=100')
      .then(res => res.json())
      .then(data => setMovies(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMovies(); }, [loadMovies]);

  const handleDelete = async (movieId: string, movieName: string) => {
    if (!confirm(`Xóa phim "${movieName}" khỏi hệ thống?`)) return;
    setDeleting(movieId);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        setMovies(prev => prev.filter(m => m.id !== movieId));
      } else {
        alert(data.message);
      }
    } catch { alert('Lỗi xóa phim'); }
    setDeleting(null);
  };

  const filtered = movies.filter(m => {
    const matchSearch = !searchTerm || m.nameVn?.toLowerCase().includes(searchTerm.toLowerCase()) || m.nameEn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !selectedStatus || m.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Phim</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{movies.length} phim trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowTmdb(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-white text-[11px] uppercase tracking-widest font-bold transition-colors">
            <DownloadCloud className="w-4 h-4" /> Nhập từ TMDB
          </button>
          <button onClick={() => { setEditMovie(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Thêm thủ công
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input type="text" placeholder="Tìm phim theo tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600" />
        </div>
        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors">
          <option value="">Tất cả trạng thái</option>
          <option value="NOW_SHOWING">Đang chiếu</option>
          <option value="COMING_SOON">Sắp chiếu</option>
          <option value="ENDED">Đã kết thúc</option>
        </select>
        <button onClick={loadMovies} className="px-4 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                <th className="px-6 py-4">Phim</th>
                <th className="px-4 py-4">Thể loại</th>
                <th className="px-4 py-4">Thời lượng</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-4 py-4">Rating</th>
                <th className="px-4 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Đang tải dữ liệu...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Không tìm thấy phim nào</td></tr>
              ) : filtered.map(movie => (
                <tr key={movie.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={movie.image} alt={movie.nameVn} className="w-10 h-14 object-cover shrink-0 bg-zinc-800" />
                      <div>
                        <div className="text-sm font-semibold text-white truncate max-w-[220px]">{movie.nameVn}</div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[220px] mt-0.5">{movie.nameEn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-400">
                    <div className="flex flex-wrap gap-1">
                      {(movie.listGenre || []).slice(0, 2).map((g: any, i: number) => (
                        <span key={i} className="border border-zinc-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-400 font-mono">{movie.time}m</td>
                  <td className="px-4 py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${movie.status === 'NOW_SHOWING' ? 'border-green-800 text-green-400' : movie.status === 'COMING_SOON' ? 'border-blue-800 text-blue-400' : 'border-zinc-700 text-zinc-500'}`}>
                      {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : movie.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Kết thúc'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-white">★ {movie.ratings || 'N/A'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditMovie(movie); setShowForm(true); }}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(movie.id, movie.nameVn)} disabled={deleting === movie.id}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <MovieFormModal movie={editMovie} onClose={() => setShowForm(false)} onSave={loadMovies} />}
      {showTmdb && <TmdbImportModal onClose={() => setShowTmdb(false)} onImported={loadMovies} />}
    </div>
  );
}
