"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, MapPin, RefreshCw, X, Building2, DoorOpen, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Theater {
  id: string;
  nameVn: string;
  nameEn: string;
  address?: string;
  city?: string;
  phone?: string;
  status?: string;
}

interface Room {
  id: string;
  name: string;
  theaterId: string;
  type: string;
  totalSeats: number;
  rows?: number;
  cols?: number;
  status?: string;
}

// ===================== THEATER FORM =====================
function TheaterForm({ theater, onClose, onSave }: { theater: Theater | null; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    nameVn: theater?.nameVn || '',
    nameEn: theater?.nameEn || '',
    address: theater?.address || '',
    city: theater?.city || 'Hồ Chí Minh',
    phone: theater?.phone || '',
    status: theater?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = theater?.id ? `/api/theaters/${theater.id}` : '/api/theaters';
      const method = theater?.id ? 'PUT' : 'POST';
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

  const f = (label: string, key: keyof typeof form, type = 'text', opts?: any) => (
    <div key={key}>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      {type === 'select' ? (
        <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors">
          {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{theater ? 'Chỉnh sửa Rạp' : 'Thêm Rạp Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {f('Tên rạp (Tiếng Việt)', 'nameVn')}
            {f('Tên rạp (Tiếng Anh)', 'nameEn')}
          </div>
          {f('Địa chỉ', 'address')}
          <div className="grid grid-cols-2 gap-4">
            {f('Thành phố', 'city', 'select', [
              { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
              { value: 'Hà Nội', label: 'Hà Nội' },
              { value: 'Đà Nẵng', label: 'Đà Nẵng' },
              { value: 'Cần Thơ', label: 'Cần Thơ' },
            ])}
            {f('Số điện thoại', 'phone', 'tel')}
          </div>
          {f('Trạng thái', 'status', 'select', [
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'INACTIVE', label: 'Tạm dừng' },
          ])}
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

// ===================== ROOM FORM =====================
function RoomForm({ room, theaterId, onClose, onSave }: { room: Room | null; theaterId: string; onClose: () => void; onSave: () => void }) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    name: room?.name || '',
    theaterId: room?.theaterId || theaterId,
    type: room?.type || '2D',
    totalSeats: room?.totalSeats?.toString() || '120',
    rows: room?.rows?.toString() || '10',
    cols: room?.cols?.toString() || '12',
    status: room?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = await firebaseUser?.getIdToken();
      const url = room?.id ? `/api/rooms/${room.id}` : '/api/rooms';
      const method = room?.id ? 'PUT' : 'POST';
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

  const inp = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
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
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">{room ? 'Chỉnh sửa Phòng Chiếu' : 'Thêm Phòng Chiếu Mới'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {inp('Tên phòng', 'name')}
          {sel('Loại màn hình', 'type', [
            { value: '2D', label: '2D' },
            { value: '3D', label: '3D' },
            { value: 'IMAX', label: 'IMAX' },
            { value: '4DX', label: '4DX' },
            { value: 'Couple', label: 'Couple' },
            { value: 'VIP', label: 'VIP Lounge' },
          ])}
          <div className="grid grid-cols-3 gap-4">
            {inp('Tổng số ghế', 'totalSeats', 'number')}
            {inp('Số hàng', 'rows', 'number')}
            {inp('Số cột', 'cols', 'number')}
          </div>
          {sel('Trạng thái', 'status', [
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'MAINTENANCE', label: 'Bảo trì' },
            { value: 'INACTIVE', label: 'Tạm dừng' },
          ])}
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
const TYPE_STYLE: Record<string, string> = {
  IMAX: 'border-blue-700 text-blue-300',
  '4DX': 'border-purple-700 text-purple-300',
  '3D': 'border-green-700 text-green-400',
  Couple: 'border-pink-700 text-pink-300',
  VIP: 'border-yellow-600 text-yellow-400',
  '2D': 'border-zinc-600 text-zinc-400',
};

export default function AdminTheatersAndRooms() {
  const { firebaseUser } = useAuth();
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showTheaterForm, setShowTheaterForm] = useState(false);
  const [editTheater, setEditTheater] = useState<Theater | null>(null);
  
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/theaters').then(r => r.json()),
      fetch('/api/rooms').then(r => r.json())
    ]).then(([tData, rData]) => {
      setTheaters(tData.data || []);
      setAllRooms(rData.data || []);
      if (!selectedTheaterId && tData.data?.length > 0) {
        setSelectedTheaterId(tData.data[0].id);
      }
    }).finally(() => setLoading(false));
  }, [selectedTheaterId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteTheater = async (id: string, name: string) => {
    if (!confirm(`Xóa rạp "${name}"? Các phòng chiếu bên trong cũng có thể bị ảnh hưởng.`)) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/theaters/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setTheaters(prev => prev.filter(t => t.id !== id));
      if (selectedTheaterId === id) setSelectedTheaterId(null);
    } else alert('Lỗi xóa rạp');
    setDeleting(null);
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (!confirm(`Xóa phòng "${name}"?`)) return;
    setDeleting(id);
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setAllRooms(prev => prev.filter(r => r.id !== id));
    } else alert('Lỗi xóa phòng');
    setDeleting(null);
  };

  const filteredTheaters = theaters.filter(t =>
    !search || t.nameVn?.toLowerCase().includes(search.toLowerCase()) || t.city?.toLowerCase().includes(search.toLowerCase())
  );

  const activeTheater = theaters.find(t => t.id === selectedTheaterId);
  const activeRooms = allRooms.filter(r => r.theaterId === selectedTheaterId);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Hệ Thống Rạp & Phòng Chiếu</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Quản lý cơ sở vật chất đồng bộ</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditTheater(null); setShowTheaterForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Thêm Cụm Rạp
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Theaters List */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col border border-zinc-800 bg-[#0d0d0f] shrink-0 h-[600px] lg:h-auto">
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm rạp, thành phố..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading ? (
              <div className="text-center py-10 text-zinc-500 text-sm">Đang tải...</div>
            ) : filteredTheaters.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm">Không tìm thấy rạp</div>
            ) : filteredTheaters.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTheaterId(t.id)}
                className={`w-full text-left p-4 border transition-all flex items-center justify-between group ${selectedTheaterId === t.id ? 'bg-white border-white' : 'bg-transparent border-transparent hover:bg-zinc-900 hover:border-zinc-800'}`}
              >
                <div>
                  <div className={`font-bold text-sm ${selectedTheaterId === t.id ? 'text-black' : 'text-white'}`}>{t.nameVn}</div>
                  <div className={`text-xs mt-1 truncate max-w-[180px] ${selectedTheaterId === t.id ? 'text-zinc-600' : 'text-zinc-500'}`}>{t.city} • {t.address}</div>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedTheaterId === t.id ? 'text-black' : 'text-zinc-700 group-hover:text-zinc-500'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Theater Details & Rooms */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] border border-zinc-800">
          {!activeTheater ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
              <Building2 className="w-16 h-16 mb-4 text-zinc-800" />
              <p>Chọn một rạp ở cột bên trái để quản lý phòng chiếu</p>
            </div>
          ) : (
            <>
              {/* Theater Details Header */}
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">{activeTheater.nameVn}</h2>
                    <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${!activeTheater.status || activeTheater.status === 'ACTIVE' ? 'border-green-800 text-green-400' : 'border-red-900 text-red-400'}`}>
                      {!activeTheater.status || activeTheater.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> {activeTheater.address}, {activeTheater.city}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditTheater(activeTheater); setShowTheaterForm(true); }} className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-widest">
                    Sửa Rạp
                  </button>
                  <button onClick={() => handleDeleteTheater(activeTheater.id, activeTheater.nameVn)} disabled={deleting === activeTheater.id} className="px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-900/20 transition-colors text-xs font-bold uppercase tracking-widest">
                    Xóa
                  </button>
                </div>
              </div>

              {/* Rooms List */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Danh sách phòng chiếu ({activeRooms.length})</h3>
                  <button onClick={() => { setEditRoom(null); setShowRoomForm(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase tracking-widest font-bold transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Thêm Phòng
                  </button>
                </div>

                {activeRooms.length === 0 ? (
                  <div className="border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
                    <DoorOpen className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm">Rạp này chưa có phòng chiếu nào.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeRooms.map(r => (
                      <div key={r.id} className="border border-zinc-800 p-5 hover:border-zinc-600 transition-colors bg-[#0d0d0f]">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-lg font-bold text-white mb-1">{r.name}</div>
                            <div className="text-xs text-zinc-500">{r.totalSeats} ghế ({r.rows}x{r.cols})</div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-1 ${TYPE_STYLE[r.type] || TYPE_STYLE['2D']}`}>
                            {r.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                          <button onClick={() => { setEditRoom(r); setShowRoomForm(true); }} className="flex-1 py-1.5 text-center border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-[10px] uppercase font-bold transition-colors">
                            Sửa
                          </button>
                          <button onClick={() => handleDeleteRoom(r.id, r.name)} disabled={deleting === r.id} className="flex-1 py-1.5 text-center border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-900/50 text-[10px] uppercase font-bold transition-colors">
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showTheaterForm && <TheaterForm theater={editTheater} onClose={() => setShowTheaterForm(false)} onSave={loadData} />}
      {showRoomForm && <RoomForm room={editRoom} theaterId={selectedTheaterId!} onClose={() => setShowRoomForm(false)} onSave={loadData} />}
    </div>
  );
}
