"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, RefreshCw, X, Tag, Percent, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxUsage?: number;
  usedCount?: number;
  expireDate?: string;
  active: boolean;
  applicableFor?: string;
}

// ===================== FORM MODAL =====================
function PromotionForm({ promo, onClose, onSave }: { promo: Promotion | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    code: promo?.code || '',
    name: promo?.name || '',
    description: promo?.description || '',
    discountType: promo?.discountType || 'PERCENT',
    discountValue: promo?.discountValue?.toString() || '10',
    minOrderAmount: promo?.minOrderAmount?.toString() || '0',
    maxUsage: promo?.maxUsage?.toString() || '0',
    expireDate: promo?.expireDate || '',
    applicableFor: promo?.applicableFor || 'ALL',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = promo?.id ? `/api/promotions/${promo.id}` : '/api/promotions';
      const method = promo?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
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

  const sel = (label: string, key: keyof typeof form, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{promo ? 'Chỉnh sửa Khuyến Mãi' : 'Tạo Mã Khuyến Mãi'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Mã Code</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER2026"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600 uppercase" />
            </div>
            {inp('Tên chương trình', 'name', 'text', 'Giảm giá hè 2026')}
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              placeholder="Chương trình giảm giá dành cho..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none placeholder:text-zinc-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sel('Loại giảm giá', 'discountType', [
              { value: 'PERCENT', label: 'Phần trăm (%)' },
              { value: 'AMOUNT', label: 'Số tiền cố định (đ)' },
            ])}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Giá trị {form.discountType === 'PERCENT' ? '(%)' : '(đ)'}
              </label>
              <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                max={form.discountType === 'PERCENT' ? 100 : undefined} min="0"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Đơn hàng tối thiểu (đ)', 'minOrderAmount', 'number')}
            {inp('Số lần sử dụng tối đa', 'maxUsage', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Ngày hết hạn', 'expireDate', 'date')}
            {sel('Đối tượng áp dụng', 'applicableFor', [
              { value: 'ALL', label: 'Tất cả' },
              { value: 'MEMBER', label: 'Thành viên hạng cao' },
              { value: 'BANK', label: 'Ngân hàng liên kết' },
            ])}
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
export default function AdminPromotions() {
  const { firebaseUser } = useAuth();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/promotions').then(r => r.json()).then(d => setPromos(d.data || [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Xóa mã khuyến mãi "${code}"?`)) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.statusCode === 200) setPromos(prev => prev.filter(p => p.id !== id));
    else alert(data.message);
    setDeleting(null);
  };

  const handleToggle = async (promo: Promotion) => {
    setToggling(promo.id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/promotions/${promo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !promo.active }),
    });
    const data = await res.json();
    if (data.statusCode === 200) setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, active: !p.active } : p));
    setToggling(null);
  };

  const filtered = promos.filter(p =>
    !search || p.code?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const active = promos.filter(p => p.active).length;
  const expired = promos.filter(p => p.expireDate && new Date(p.expireDate) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Khuyến Mãi</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
            {promos.length} mã — {active} đang chạy — {expired} hết hạn
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditPromo(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Tạo Mã Mới
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã code, tên chương trình..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600" />
      </div>

      <div className="border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              <th className="px-6 py-4">Mã Code</th>
              <th className="px-4 py-4">Chương trình</th>
              <th className="px-4 py-4">Giảm giá</th>
              <th className="px-4 py-4">Sử dụng</th>
              <th className="px-4 py-4">Hết hạn</th>
              <th className="px-4 py-4">Trạng thái</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16 text-zinc-500 text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Tag className="w-10 h-10 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">Chưa có mã khuyến mãi nào</p>
                    <button onClick={() => { setEditPromo(null); setShowForm(true); }}
                      className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors">
                      Tạo mã đầu tiên
                    </button>
                  </div>
                </td>
              </tr>
            ) : filtered.map(p => {
              const isExpired = p.expireDate && new Date(p.expireDate) < new Date();
              return (
                <tr key={p.id} className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0 ${!p.active || isExpired ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-mono font-bold text-sm text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5">{p.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-white">{p.name}</div>
                    {p.description && <div className="text-[10px] text-zinc-600 mt-0.5 truncate max-w-[160px]">{p.description}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-green-500" />
                      <span className="font-bold text-green-400 text-sm">
                        {p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-zinc-400">
                    {p.usedCount || 0} / {p.maxUsage || '∞'}
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-500 font-mono">
                    {p.expireDate ? (
                      <span className={isExpired ? 'text-red-400' : 'text-zinc-400'}>
                        {new Date(p.expireDate).toLocaleDateString('vi-VN')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => handleToggle(p)} disabled={toggling === p.id}
                      className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors disabled:opacity-40 ${p.active && !isExpired ? 'text-green-400' : 'text-zinc-600'}`}>
                      {p.active && !isExpired ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {p.active && !isExpired ? 'Đang chạy' : isExpired ? 'Hết hạn' : 'Tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditPromo(p); setShowForm(true); }} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id, p.code)} disabled={deleting === p.id} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && <PromotionForm promo={editPromo} onClose={() => setShowForm(false)} onSave={load} />}
    </div>
  );
}
