"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, RefreshCw, X, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PricingRule {
  id: string;
  name: string;
  seatType: string;
  format: string;
  dayType: string;
  price: number;
}

// ===================== FORM MODAL =====================
function PricingForm({ rule, onClose, onSave }: { rule: PricingRule | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    name: rule?.name || '',
    seatType: rule?.seatType || 'Standard',
    format: rule?.format || '2D',
    dayType: rule?.dayType || 'WEEKDAY',
    price: rule?.price?.toString() || '55000',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate name from config
  useEffect(() => {
    if (!rule) {
      setForm(p => ({ ...p, name: `${p.seatType} ${p.format} - ${p.dayType === 'WEEKDAY' ? 'Thường ngày' : p.dayType === 'WEEKEND' ? 'Cuối tuần' : 'Tất cả ngày'}` }));
    }
  }, [form.seatType, form.format, form.dayType, rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = rule?.id ? `/api/pricing/${rule.id}` : '/api/pricing';
      const method = rule?.id ? 'PUT' : 'POST';
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
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{rule ? 'Chỉnh sửa Quy tắc Giá' : 'Thêm Quy tắc Giá Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Tên quy tắc</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
          </div>
          {sel('Loại ghế', 'seatType', [
            { value: 'Standard', label: 'Standard' },
            { value: 'VIP', label: 'VIP' },
            { value: 'Couple', label: 'Couple (Ghế đôi)' },
          ])}
          {sel('Định dạng chiếu', 'format', [
            { value: '2D', label: '2D' },
            { value: '3D', label: '3D' },
            { value: 'IMAX', label: 'IMAX' },
            { value: '4DX', label: '4DX' },
          ])}
          {sel('Khung ngày áp dụng', 'dayType', [
            { value: 'WEEKDAY', label: 'Thường ngày (Thứ 2 - Thứ 5)' },
            { value: 'WEEKEND', label: 'Cuối tuần (Thứ 6 - Chủ nhật)' },
            { value: 'ALL', label: 'Tất cả ngày' },
          ])}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Đơn giá (VND)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">đ</span>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} step="1000" min="0"
                className="w-full bg-zinc-900 border border-zinc-700 text-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{parseInt(form.price || '0').toLocaleString('vi-VN')} đồng</p>
          </div>
          {error && <p className="text-red-400 text-xs border border-red-900 px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu quy tắc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
const FORMAT_STYLE: Record<string, string> = {
  IMAX: 'border-blue-700 text-blue-300',
  '4DX': 'border-purple-700 text-purple-300',
  '3D': 'border-green-700 text-green-400',
  '2D': 'border-zinc-600 text-zinc-400',
};

export default function AdminPricing() {
  const { firebaseUser } = useAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<PricingRule | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/pricing').then(r => r.json()).then(d => setRules(d.data || [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa quy tắc giá này?')) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/pricing/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.statusCode === 200) setRules(prev => prev.filter(r => r.id !== id));
    else alert(data.message);
    setDeleting(null);
  };

  const minPrice = rules.length > 0 ? Math.min(...rules.map(r => r.price)) : 0;
  const maxPrice = rules.length > 0 ? Math.max(...rules.map(r => r.price)) : 0;
  const avgPrice = rules.length > 0 ? Math.round(rules.reduce((s, r) => s + r.price, 0) / rules.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Giá Vé</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{rules.length} quy tắc giá</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditRule(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Thêm Quy tắc
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Giá thấp nhất', value: minPrice.toLocaleString('vi-VN') + ' đ', cls: 'text-green-400' },
          { label: 'Giá trung bình', value: avgPrice.toLocaleString('vi-VN') + ' đ', cls: 'text-yellow-400' },
          { label: 'Giá cao nhất', value: maxPrice.toLocaleString('vi-VN') + ' đ', cls: 'text-white' },
        ].map(s => (
          <div key={s.label} className="border border-zinc-800 p-5">
            <div className={`text-xl font-black ${s.cls}`}>{s.value}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              <th className="px-6 py-4">Tên quy tắc</th>
              <th className="px-4 py-4">Loại ghế</th>
              <th className="px-4 py-4">Định dạng</th>
              <th className="px-4 py-4">Khung ngày</th>
              <th className="px-4 py-4">Đơn giá</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Đang tải...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Chưa có quy tắc giá</td></tr>
            ) : rules.map(r => (
              <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0">
                <td className="px-6 py-4 text-sm font-medium text-white">{r.name}</td>
                <td className="px-4 py-4">
                  <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${r.seatType === 'VIP' ? 'border-yellow-700 text-yellow-400' : r.seatType === 'Couple' ? 'border-pink-700 text-pink-300' : 'border-zinc-600 text-zinc-400'}`}>{r.seatType}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${FORMAT_STYLE[r.format] || FORMAT_STYLE['2D']}`}>{r.format}</span>
                </td>
                <td className="px-4 py-4 text-xs text-zinc-400">
                  {r.dayType === 'WEEKDAY' ? 'Thường ngày' : r.dayType === 'WEEKEND' ? 'Cuối tuần' : 'Tất cả'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-bold text-green-400 text-sm">{r.price.toLocaleString('vi-VN')} đ</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditRule(r); setShowForm(true); }} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <PricingForm rule={editRule} onClose={() => setShowForm(false)} onSave={load} />}
    </div>
  );
}
