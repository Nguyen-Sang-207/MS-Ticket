"use client";

import React, { useEffect, useState } from "react";
import { Users, Film, Ticket, TrendingUp, ArrowUpRight, Crown, Zap } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { firebaseUser } = useAuth();
  const [data, setData] = useState<{
    stats: any[];
    weeklyRevenue: any[];
    topMovies: any[];
    recentBookings: any[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(async (d) => {
        const finalData = d.data;
        if (finalData && typeof window !== 'undefined') {
          const { sandboxGetOverrides } = await import('@/lib/sandboxStore');
          const sandboxBookings = Object.values(sandboxGetOverrides('bookings')) as any[];
          
          if (sandboxBookings.length > 0) {
             let addedRev = 0;
             let addedTkt = 0;
             const recentSbox: any[] = [];
             
             sandboxBookings.forEach(b => {
               if (b.status !== 'CANCELLED') {
                 addedRev += b.totalAmount || 0;
                 addedTkt += b.seats?.length || 0;
                 recentSbox.push({
                   id: b.id,
                   user: b.userEmail || 'Sandbox User',
                   movie: b.movieNameVn || 'Sandbox Movie',
                   time: new Date(b.createdAt).toLocaleString('vi-VN'),
                   amount: (b.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
                   status: b.status
                 });
               }
             });

             // Add to stats
             if (finalData.stats && finalData.stats.length >= 2) {
               const origRevStr = finalData.stats[0].value.replace(/[^\d]/g, '');
               const origRev = parseInt(origRevStr) || 0;
               finalData.stats[0].value = (origRev + addedRev).toLocaleString('vi-VN') + ' đ';

               const origTktStr = finalData.stats[1].value.replace(/[^\d]/g, '');
               const origTkt = parseInt(origTktStr) || 0;
               finalData.stats[1].value = (origTkt + addedTkt).toLocaleString('vi-VN');
             }

             // Add to recent bookings (at the top)
             finalData.recentBookings = [...recentSbox, ...(finalData.recentBookings || [])].slice(0, 8);
          }
        }
        setData(finalData);
      })
      .catch(console.error);
    }
    load();
  }, [firebaseUser]);

  const defaultStats = [
    { label: "Tổng doanh thu tháng", value: "--- đ", icon: "TrendingUp", change: "", sub: "đang tính toán" },
    { label: "Vé đã bán", value: "---", icon: "Ticket", change: "", sub: "" },
    { label: "Phim đang chiếu", value: "---", icon: "Film", change: "", sub: "" },
    { label: "Thành viên", value: "---", icon: "Users", change: "", sub: "" },
  ];

  const defaultWeekly = [
    { day: "T2", revenue: 0 }, { day: "T3", revenue: 0 }, { day: "T4", revenue: 0 },
    { day: "T5", revenue: 0 }, { day: "T6", revenue: 0 }, { day: "T7", revenue: 0 }, { day: "CN", revenue: 0 }
  ];

  const statsRender = data?.stats || defaultStats;
  const weeklyRevenue = data?.weeklyRevenue || defaultWeekly;
  const maxRevenue = Math.max(...weeklyRevenue.map((d: any) => d.revenue), 100);
  const topMovies = data?.topMovies || [];
  const recentBookings = data?.recentBookings || [];

  // Peak hours
  const peakHours = [
    { time: "09:00", load: 15 },
    { time: "11:00", load: 32 },
    { time: "13:00", load: 68 },
    { time: "15:00", load: 55 },
    { time: "18:00", load: 92 },
    { time: "20:00", load: 100 },
    { time: "22:00", load: 78 },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-1">Tổng Quan Hệ Thống</h1>
          <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold">MS Cinema Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">System Active</span>
        </div>
      </div>

      {/* Editor's Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsRender.map((stat: any, i: number) => (
          <div key={i} className="border border-zinc-800 p-4 md:p-6 flex flex-col justify-between group hover:border-zinc-500 transition-colors bg-[#09090b]">
            <div className="flex items-start justify-between mb-8">
              <div className="text-zinc-500 group-hover:text-white transition-colors">
                {stat.icon === 'TrendingUp' && <TrendingUp className="w-5 h-5" />}
                {stat.icon === 'Ticket' && <Ticket className="w-5 h-5" />}
                {stat.icon === 'Film' && <Film className="w-5 h-5" />}
                {stat.icon === 'Users' && <Users className="w-5 h-5" />}
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5">
                  <ArrowUpRight className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white">{stat.change}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-tight text-white mb-2">{stat.value}</p>
              <div className="flex items-center justify-between">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{stat.label}</p>
                 <span className="text-[9px] text-zinc-600">{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Chart - SVG Line Chart */}
        <div className="lg:col-span-2 border border-zinc-800 p-4 md:p-8 bg-[#09090b]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-white" /> Doanh thu 7 ngày qua
            </h3>
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
              {weeklyRevenue.reduce((s: number, d: any) => s + d.revenue, 0) > 0
                ? `Tổng: ${(weeklyRevenue.reduce((s: number, d: any) => s + d.revenue, 0) / 1000000).toFixed(1)}M đ`
                : 'Chưa có dữ liệu'}
            </span>
          </div>

          {(() => {
            const W = 600; const H = 180; const PAD = { t: 20, r: 20, b: 0, l: 48 };
            const chartW = W - PAD.l - PAD.r;
            const chartH = H - PAD.t - PAD.b;
            const maxR = Math.max(...weeklyRevenue.map((d: any) => d.revenue), 1);
            const pts = weeklyRevenue.map((d: any, i: number) => ({
              x: PAD.l + (i / (weeklyRevenue.length - 1)) * chartW,
              y: PAD.t + chartH - (d.revenue / maxR) * chartH,
              revenue: d.revenue,
              day: d.day,
            }));
            const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + chartH} L ${pts[0].x} ${PAD.t + chartH} Z`;
            // Y axis grid lines
            const gridVals = [0, 0.25, 0.5, 0.75, 1].map(r => ({ y: PAD.t + chartH - r * chartH, val: maxR * r }));

            return (
              <div className="relative w-full" style={{ aspectRatio: `${W}/${H + 32}` }}>
                <svg viewBox={`0 0 ${W} ${H + 32}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#52525b" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#52525b" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {gridVals.map((g, i) => (
                    <g key={i}>
                      <line x1={PAD.l} y1={g.y} x2={W - PAD.r} y2={g.y} stroke="#27272a" strokeWidth="1" strokeDasharray={i === 0 ? '' : '0'} />
                      {g.val > 0 && (
                        <text x={PAD.l - 8} y={g.y + 4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">
                          {g.val >= 1000000 ? `${(g.val / 1000000).toFixed(0)}M` : `${(g.val / 1000).toFixed(0)}K`}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Area fill */}
                  {maxR > 1 && <path d={areaD} fill="url(#areaGrad)" />}

                  {/* Line */}
                  {maxR > 1 && (
                    <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}

                  {/* Dots + labels */}
                  {pts.map((p, i) => {
                    const isWeekend = ['T7', 'CN'].includes(p.day);
                    return (
                      <g key={i} className="group">
                        {/* Hover area */}
                        <rect x={p.x - 20} y={PAD.t} width={40} height={chartH + 32} fill="transparent" />
                        {/* Vertical hover line */}
                        <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t + chartH} stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3"
                          className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Dot */}
                        {p.revenue > 0 && (
                          <>
                            <circle cx={p.x} cy={p.y} r="3" fill="#09090b" stroke="white" strokeWidth="1.5" />
                            {/* Tooltip box */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <rect x={p.x - 30} y={p.y - 30} width={60} height={22} rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                              <text x={p.x} y={p.y - 15} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">
                                {(p.revenue / 1000000).toFixed(1)}M đ
                              </text>
                            </g>
                          </>
                        )}
                        {/* Day label */}
                        <text x={p.x} y={H + 20} textAnchor="middle" fill={isWeekend ? '#52525b' : '#71717a'} fontSize="9"
                          fontFamily="sans-serif" fontWeight="bold" letterSpacing="2">
                          {p.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>

        {/* Peak Hours - Data Driven */}
        <div className="border border-zinc-800 p-4 md:p-8 bg-[#09090b] flex flex-col">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-8 border-b border-zinc-800 pb-4 flex items-center gap-3">
            <Zap className="w-4 h-4 text-white" /> Cường Độ Giờ Vàng
          </h3>
          <div className="space-y-4 flex-1">
            {peakHours.map((h, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest w-10">{h.time}</span>
                <div className="flex-1 bg-zinc-900 h-1">
                  <div
                    className={`h-full transition-all duration-700 ${h.load >= 90 ? 'bg-white' : h.load >= 60 ? 'bg-zinc-400' : 'bg-zinc-700'}`}
                    style={{ width: `${h.load}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono tracking-widest w-8 text-right ${h.load >= 90 ? 'text-white font-bold' : 'text-zinc-500'}`}>{h.load}%</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2 mb-2"><div className="w-1.5 h-1.5 bg-white"></div> Khung Giờ 18:00 - 22:00</div>
            <div className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">Công suất đặt vé tại đỉnh, ưu tiên chiếu phim bom tấn có rating cao.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Movies List */}
        <div className="border border-zinc-800 p-4 md:p-8 bg-[#09090b]">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-8 border-b border-zinc-800 pb-4 flex items-center gap-3">
            <Crown className="w-4 h-4 text-white" /> Phối Cảnh Lắp Đầy (Top Phim)
          </h3>
          <div className="space-y-0">
            {topMovies.map((m, i) => {
              return (
                <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 py-4 group hover:bg-zinc-900/40 transition-colors px-2 -mx-2">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <span className="text-xs font-mono font-bold text-zinc-600 w-4 flex-none">{(i + 1).toString().padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white block mb-0.5 truncate">{m.name}</span>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block truncate">{m.genre || 'Phim'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-none ml-4">
                    <div className="text-xs font-mono text-zinc-300">{m.tickets} tix</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-widest">{(m.revenue / 1000000).toFixed(1)}M đ</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="border border-zinc-800 p-4 md:p-8 bg-[#09090b]">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-8 border-b border-zinc-800 pb-4 flex items-center gap-3">
            <Ticket className="w-4 h-4 text-white" /> Biến Động Giao Dịch
          </h3>
          <div className="space-y-0">
            {recentBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between border-b border-zinc-800/50 py-4 group hover:bg-zinc-900/40 transition-colors px-2 -mx-2">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-6 h-6 border border-zinc-700 flex items-center justify-center font-bold text-white text-[10px] uppercase bg-black flex-none">
                    {b.user.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white uppercase tracking-wider mb-0.5 truncate">{b.user}</div>
                    <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold truncate">{b.movie} · {b.time}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end flex-none ml-4">
                  <div className="text-xs font-mono text-white">{(b.amount / 1000).toFixed(0)}K đ</div>
                  <span className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase tracking-widest mt-1.5 ${b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'border-zinc-700 text-zinc-400' : 'border-dashed border-zinc-500 text-white'}`}>
                    {b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'Thành Công' : 'Đang Xử Lý'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
