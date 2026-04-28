"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, RefreshCw, X, Coffee } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

// ===================== FORM MODAL =====================
function ComboForm({ combo, onClose, onSave }: { combo: Combo | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    name: combo?.name || '',
    description: combo?.description || '',
    price: combo?.price?.toString() || '69000',
    image: combo?.image || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = combo?.id ? `/api/combos/${combo.id}` : '/api/combos';
      const method = combo?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
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
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{combo ? 'Chỉnh sửa Combo' : 'Thêm Combo Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {inp('Tên Combo', 'name', 'text', 'Combo Đôi')}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              placeholder="1 Bắp ngọt lớn + 2 Nước ngọt..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Giá bán (VND)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">đ</span>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} step="1000" min="0"
                className="w-full bg-zinc-900 border border-zinc-700 text-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{parseInt(form.price || '0').toLocaleString('vi-VN')} đồng</p>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Hình ảnh</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 bg-zinc-900 border border-zinc-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {form.image ? (
                  <img src={form.image} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <Coffee className="w-8 h-8 text-zinc-700" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input type="text" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="Hoặc dán URL hình ảnh vào đây..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600" />
                
                <div className="relative overflow-hidden inline-block w-full">
                  <button type="button" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors">
                    Tải Ảnh Từ Máy Tính
                  </button>
                  <input type="file" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const token = await firebaseUser?.getIdToken();
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('folder', 'cineme/combos');
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: fd
                        });
                        const data = await res.json();
                        if (data.url) setForm(p => ({ ...p, image: data.url }));
                        else alert('Lỗi tải ảnh: ' + data.message);
                      } catch { alert('Lỗi kết nối khi tải ảnh'); }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
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
export default function AdminCombos() {
  const { firebaseUser } = useAuth();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCombo, setEditCombo] = useState<Combo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/combos').then(r => r.json()).then(d => setCombos(d.data || [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa combo "${name}"?`)) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/combos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.statusCode === 200) setCombos(prev => prev.filter(c => c.id !== id));
    else alert(data.message);
    setDeleting(null);
  };

  const filtered = combos.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Bắp Nước (Combos)</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{combos.length} combo đang bán</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditCombo(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Thêm Combo
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm combo..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600" />
      </div>

      {/* Grid cards */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-sm border border-zinc-800">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm border border-zinc-800">Không có combo nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="border border-zinc-800 hover:border-zinc-600 transition-colors group">
              {/* Image */}
              <div className="h-36 bg-zinc-900 flex items-center justify-center border-b border-zinc-800 relative overflow-hidden">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Coffee className="w-12 h-12 text-zinc-700" />
                )}
              </div>
              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white leading-tight">{c.name}</h3>
                  <div className="font-black text-white text-sm shrink-0">{c.price.toLocaleString('vi-VN')} đ</div>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{c.description}</p>
                <div className="flex gap-2 pt-3 border-t border-zinc-800">
                  <button onClick={() => { setEditCombo(c); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-[10px] font-bold uppercase tracking-widest transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)} disabled={deleting === c.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <ComboForm combo={editCombo} onClose={() => setShowForm(false)} onSave={load} />}
    </div>
  );
}
