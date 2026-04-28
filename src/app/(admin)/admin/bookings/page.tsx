"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Eye, CheckCircle, Clock, XCircle, Download, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Booking } from "@/types";

// ===================== DETAIL MODAL =====================
function BookingDetailModal({ booking, onClose, onRefresh }: { booking: Booking; onClose: () => void; onRefresh: () => void }) {
  const { firebaseUser } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.statusCode === 200) { onRefresh(); onClose(); }
      else alert(data.message);
    } catch { alert('Lỗi cập nhật'); }
    setUpdating(false);
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: 'Đã xác nhận', cls: 'border-green-800 text-green-400' },
    PENDING: { label: 'Chờ thanh toán', cls: 'border-yellow-800 text-yellow-400' },
    CANCELLED: { label: 'Đã hủy', cls: 'border-red-800 text-red-400' },
    COMPLETED: { label: 'Hoàn thành', cls: 'border-zinc-700 text-zinc-400' },
  };
  const s = statusMap[booking.status] || { label: booking.status, cls: 'border-zinc-700 text-zinc-400' };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">Chi Tiết Đặt Vé</h2>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{booking.id}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <div className="p-8 space-y-3 text-sm">
          {[
            { label: 'Phim', value: booking.movieNameVn },
            { label: 'Rạp chiếu', value: booking.theaterName },
            { label: 'Ngày giờ', value: `${booking.date} lúc ${booking.startTime}` },
            { label: 'Ghế ngồi', value: booking.seats?.map(s => `${s.row}${s.col}`).join(', ') },
            { label: 'Tổng tiền', value: `${booking.totalAmount?.toLocaleString('vi-VN')} đ` },
          ].map(item => (
            <div key={item.label} className="flex justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-zinc-500 text-xs">{item.label}</span>
              <span className="text-white font-medium text-right text-xs">{item.value || '—'}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Trạng thái</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${s.cls}`}>{s.label}</span>
          </div>
        </div>
        <div className="px-8 py-6 border-t border-zinc-800 flex flex-wrap gap-2 justify-end">
          {booking.status !== 'CONFIRMED' && (
            <button disabled={updating} onClick={() => updateStatus('CONFIRMED')}
              className="px-4 py-2 border border-green-800 text-green-400 hover:bg-green-900/30 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50">
              Xác nhận
            </button>
          )}
          {booking.status !== 'CANCELLED' && (
            <button disabled={updating} onClick={() => updateStatus('CANCELLED')}
              className="px-4 py-2 border border-red-900 text-red-400 hover:bg-red-900/20 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50">
              Hủy vé
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
type BFilter = 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';

export default function AdminBookings() {
  const { firebaseUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BFilter>('ALL');
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch('/api/bookings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      setBookings(d.data || []);
    } catch { setBookings([]); }
    setLoading(false);
  }, [firebaseUser]);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b =>
    (statusFilter === 'ALL' || b.status === statusFilter) &&
    (!search || b.movieNameVn?.toLowerCase().includes(search.toLowerCase()) || b.id?.toLowerCase().includes(search.toLowerCase()))
  );

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    CONFIRMED: { label: 'Thành công', icon: <CheckCircle className="w-3 h-3" />, cls: 'text-green-400' },
    PENDING: { label: 'Chờ TT', icon: <Clock className="w-3 h-3" />, cls: 'text-yellow-400' },
    CANCELLED: { label: 'Đã hủy', icon: <XCircle className="w-3 h-3" />, cls: 'text-red-400' },
    COMPLETED: { label: 'Hoàn thành', icon: <CheckCircle className="w-3 h-3" />, cls: 'text-zinc-400' },
  };

  const totalRevenue = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((s, b) => s + (b.totalAmount || 0), 0);

  const filterButtons: BFilter[] = ['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Đặt Vé</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
            {bookings.length} giao dịch — Doanh thu: <span className="text-green-400">{totalRevenue.toLocaleString('vi-VN')} đ</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED'].map(s => {
          const count = bookings.filter(b => b.status === s).length;
          const cfg = statusConfig[s];
          return (
            <div key={s} className="border border-zinc-800 p-4 text-center">
              <div className={`text-2xl font-black ${cfg.cls}`}>{count}</div>
              <div className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã vé, tên phim..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600" />
        </div>
        <div className="flex gap-2">
          {filterButtons.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${statusFilter === f ? 'bg-white text-black' : 'border border-zinc-800 text-zinc-500 hover:text-white'}`}>
              {f === 'ALL' ? 'Tất cả' : statusConfig[f]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              <th className="px-6 py-4">Mã vé</th>
              <th className="px-4 py-4">Phim & Suất chiếu</th>
              <th className="px-4 py-4">Ghế</th>
              <th className="px-4 py-4">Tổng tiền</th>
              <th className="px-4 py-4">Trạng thái</th>
              <th className="px-4 py-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Không có đặt vé nào</td></tr>
            ) : filtered.map(b => {
              const cfg = statusConfig[b.status] || statusConfig.PENDING;
              return (
                <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-1 border border-zinc-800">{b.id?.slice(0, 8)}...</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-white truncate max-w-[180px]">{b.movieNameVn || '—'}</div>
                    <div className="text-[10px] text-zinc-600">{b.theaterName} · {b.date} {b.startTime}</div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-zinc-400">{b.seats?.map(s => `${s.row}${s.col}`).join(', ') || '—'}</td>
                  <td className="px-4 py-4 text-sm font-bold text-white">{b.totalAmount?.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-4">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${cfg.cls}`}>{cfg.icon}{cfg.label}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => setSelected(b)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </div>
  );
}
