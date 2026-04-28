"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Shield, UserCheck, Lock, Unlock, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";

const rankColors: Record<string, string> = {
  'Bạch Kim': 'border-purple-700 text-purple-300',
  'Vàng': 'border-yellow-700 text-yellow-400',
  'Bạc': 'border-zinc-500 text-zinc-400',
  'Đồng': 'border-amber-800 text-amber-600',
};

export default function AdminUsers() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF' | 'CUSTOMER'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      setUsers(d.data || []);
    } catch { setUsers([]); }
    setLoading(false);
  }, [firebaseUser]);

  useEffect(() => { load(); }, [load]);

  const toggleLock = async (user: User) => {
    if (!confirm(`${user.locked ? 'Mở khóa' : 'Khóa'} tài khoản "${user.fullName}"?`)) return;
    setUpdating(user.id);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ locked: !user.locked }),
      });
      const data = await res.json();
      if (data.statusCode === 200) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, locked: !u.locked } : u));
      else alert(data.message);
    } catch { alert('Lỗi'); }
    setUpdating(null);
  };

  const changeRole = async (user: User, newRole: string) => {
    if (!confirm(`Đổi quyền của "${user.fullName}" thành ${newRole}?`)) return;
    setUpdating(user.id);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.statusCode === 200) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole as any } : u));
      else alert(data.message);
    } catch { alert('Lỗi'); }
    setUpdating(null);
  };

  const filtered = users.filter(u =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (!search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản Lý Người Dùng</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
            {users.length} tài khoản — {users.filter(u => u.locked).length} bị khóa
          </p>
        </div>
        <button onClick={load} className="p-2.5 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Bạch Kim', cls: 'text-purple-300', count: users.filter(u => u.rankName === 'Bạch Kim').length },
          { label: 'Vàng', cls: 'text-yellow-400', count: users.filter(u => u.rankName === 'Vàng').length },
          { label: 'Bạc', cls: 'text-zinc-400', count: users.filter(u => u.rankName === 'Bạc').length },
          { label: 'Đồng', cls: 'text-amber-600', count: users.filter(u => u.rankName === 'Đồng').length },
        ].map(s => (
          <div key={s.label} className="border border-zinc-800 p-4 text-center">
            <div className={`text-2xl font-black ${s.cls}`}>{s.count}</div>
            <div className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">Hạng {s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600" />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'ADMIN', 'STAFF', 'CUSTOMER'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${roleFilter === r ? 'bg-white text-black' : 'border border-zinc-800 text-zinc-500 hover:text-white'}`}>
              {r === 'ALL' ? 'Tất cả' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              <th className="px-6 py-4">Người dùng</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Hạng</th>
              <th className="px-4 py-4">Điểm</th>
              <th className="px-4 py-4">Quyền</th>
              <th className="px-4 py-4">Trạng thái</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16 text-zinc-500 text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-zinc-500 text-sm">Không có người dùng</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors last:border-0 ${u.locked ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{u.fullName}</div>
                      <div className="text-[10px] text-zinc-600">{u.provider}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-zinc-500">{u.email}</td>
                <td className="px-4 py-4">
                  {u.rankName ? (
                    <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${rankColors[u.rankName] || 'border-zinc-700 text-zinc-500'}`}>{u.rankName}</span>
                  ) : <span className="text-zinc-700 text-xs">—</span>}
                </td>
                <td className="px-4 py-4 text-xs font-mono text-white">{u.totalPoints?.toLocaleString() || 0}</td>
                <td className="px-4 py-4">
                  <select value={u.role} onChange={e => changeRole(u, e.target.value)} disabled={updating === u.id}
                    className="bg-transparent border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase px-2 py-1 focus:outline-none focus:border-zinc-500 cursor-pointer hover:border-zinc-500 transition-colors">
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 ${u.locked ? 'border-red-900 text-red-400' : 'border-green-800 text-green-400'}`}>
                    {u.locked ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button title={u.locked ? 'Mở khóa' : 'Khóa tài khoản'} disabled={updating === u.id}
                    onClick={() => toggleLock(u)}
                    className={`p-2 transition-colors disabled:opacity-40 ${u.locked ? 'text-zinc-500 hover:text-green-400 hover:bg-green-900/20' : 'text-zinc-500 hover:text-red-400 hover:bg-red-900/20'}`}>
                    {u.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
