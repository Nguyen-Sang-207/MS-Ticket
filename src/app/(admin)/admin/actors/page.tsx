"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, RefreshCw, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Actor {
  id: string;
  nameVn: string;
  nameEn: string;
  image?: string;
  dob?: string;
  nationality?: string;
  bio?: string;
}

// ===================== FORM MODAL =====================
function ActorForm({ actor, onClose, onSave }: { actor: Actor | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    nameEn: actor?.nameEn || '',
    nameVn: actor?.nameVn || '',
    image: actor?.image || '',
    dob: actor?.dob || '',
    nationality: actor?.nationality || '',
    bio: actor?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = actor?.id ? `/api/actors/${actor.id}` : '/api/actors';
      const method = actor?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, nameVn: form.nameVn || form.nameEn }),
      });
      const data = await res.json();
      if (data.statusCode === 200 || data.statusCode === 201) { onSave(); onClose(); }
      else setError(data.message || 'Lỗi');
    } catch { setError('Lỗi kết nối'); }
    setSaving(false);
  };

  const inp = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{actor ? 'Chỉnh sửa Diễn Viên' : 'Thêm Diễn Viên Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {inp('Tên (Tiếng Anh)', 'nameEn', 'text', 'Robert Downey Jr.')}
            {inp('Tên (Tiếng Việt)', 'nameVn', 'text', 'Robert Downey Jr.')}
          </div>
          {inp('URL Ảnh đại diện', 'image', 'url', 'https://...')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Ngày sinh', 'dob', 'date')}
            {inp('Quốc tịch', 'nationality', 'text', 'Mỹ')}
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Tiểu sử ngắn</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none" />
          </div>
          {error && <p className="text-red-400 text-xs border border-red-900 px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function AdminActors() {
  const { firebaseUser } = useAuth();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editActor, setEditActor] = useState<Actor | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/actors').then(r => r.json()).then(d => setActors(d.data || [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa diễn viên "${name}"?`)) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/actors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.statusCode === 200) setActors(prev => prev.filter(a => a.id !== id));
    else alert(data.message);
    setDeleting(null);
  };

  const filtered = actors.filter(a =>
    !search || a.nameEn?.toLowerCase().includes(search.toLowerCase()) || a.nationality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Diễn Viên</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{actors.length} diễn viên trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditActor(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Thêm Diễn Viên
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, quốc tịch..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600" />
      </div>

      <div className="border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              <th className="px-6 py-4">Diễn viên</th>
              <th className="px-4 py-4">Quốc tịch</th>
              <th className="px-4 py-4">Ngày sinh</th>
              <th className="px-4 py-4">Tiểu sử</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-16 text-zinc-500 text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <User className="w-10 h-10 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">Chưa có diễn viên nào</p>
                    <button onClick={() => { setEditActor(null); setShowForm(true); }}
                      className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors">
                      Thêm diễn viên đầu tiên
                    </button>
                  </div>
                </td>
              </tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {a.image ? (
                      <img src={a.image} alt={a.nameEn} className="w-10 h-10 object-cover bg-zinc-800 shrink-0" style={{ borderRadius: 0 }} />
                    ) : (
                      <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {a.nameEn?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">{a.nameEn}</div>
                      {a.nameVn && a.nameVn !== a.nameEn && <div className="text-[10px] text-zinc-600">{a.nameVn}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-zinc-400">{a.nationality || '—'}</td>
                <td className="px-4 py-4 text-xs font-mono text-zinc-500">
                  {a.dob ? new Date(a.dob).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="px-4 py-4 text-xs text-zinc-600 max-w-[200px] truncate">{a.bio || '—'}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditActor(a); setShowForm(true); }} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id, a.nameEn)} disabled={deleting === a.id} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <ActorForm actor={editActor} onClose={() => setShowForm(false)} onSave={load} />}
    </div>
  );
}
