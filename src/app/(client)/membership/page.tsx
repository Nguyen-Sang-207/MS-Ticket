"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const RANKS = [
  {
    id: 'dong',
    name: 'Đồng',
    nameEn: 'Bronze',
    min: 0,
    max: 1000000,
    color: '#cd7f32',
    perks: [
      'Truy cập tất cả suất chiếu thông thường',
      'Tích điểm 1 điểm / 10,000đ chi tiêu',
      'Nhận ưu đãi sinh nhật đặc biệt',
      'Ưu tiên hỗ trợ khách hàng tiêu chuẩn',
    ],
  },
  {
    id: 'bac',
    name: 'Bạc',
    nameEn: 'Silver',
    min: 1000000,
    max: 3000000,
    color: '#9ca3af',
    discount: 5,
    perks: [
      'Tất cả quyền lợi hạng Đồng',
      'Giảm 5% trên tổng hóa đơn',
      'Ưu tiên đặt vé sớm 24h trước khi mở bán',
      'Miễn phí 1 combo bắp nước mỗi tháng',
      'Tích điểm 1.5x cho mọi giao dịch',
    ],
  },
  {
    id: 'vang',
    name: 'Vàng',
    nameEn: 'Gold',
    min: 3000000,
    max: 10000000,
    color: '#d4af37',
    discount: 10,
    featured: true,
    perks: [
      'Tất cả quyền lợi hạng Bạc',
      'Giảm 10% trên tổng hóa đơn',
      'Đặt trước vé 48h khi phim mới ra mắt',
      'Miễn phí upgrade ghế VIP (tùy suất chiếu)',
      '2 vé miễn phí mỗi tháng (vào thứ 3)',
      'Tích điểm 2x cho mọi giao dịch',
      'Phòng chờ VIP Lounge độc quyền',
    ],
  },
  {
    id: 'bachkim',
    name: 'Bạch Kim',
    nameEn: 'Platinum',
    min: 10000000,
    max: Infinity,
    color: '#ffffff',
    discount: 15,
    perks: [
      'Tất cả quyền lợi hạng Vàng',
      'Giảm 15% trên tổng hóa đơn',
      'Đặt vé IMAX & Sweetbox ưu tiên tuyệt đối',
      'Vé xem phim không giới hạn vào thứ 3',
      'Quà tặng cao cấp định kỳ hàng quý',
      'Tích điểm 3x — đổi điểm lấy vé miễn phí',
      'Quản lý tài khoản riêng biệt với Concierge',
      'Mời tham dự các sự kiện Premier & talkshow',
    ],
  },
];

export default function MembershipPage() {
  const { user } = useAuth();

  const totalSpending = 0; // In real app, would come from booking history
  const currentRank = RANKS.reduce((found, rank) => totalSpending >= rank.min ? rank : found, RANKS[0]);
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  const rankProgress = nextRank ? ((totalSpending - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pt-28 pb-32 selection:bg-white selection:text-black">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4">MS Cinema</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">Chương Trình Thành Viên</h1>
          <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">Hệ thống phân hạng tự động. Tích lũy chi tiêu — nhận đặc quyền điện ảnh xứng tầm.</p>
        </div>

        {/* If User Logged In: Show Personal Status */}
        {user && (
          <div className="border border-zinc-800 p-8 mb-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Thành viên đang đăng nhập</p>
              <h2 className="text-2xl font-semibold text-white mb-1">{user.fullName}</h2>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: currentRank.color }}>Hạng {currentRank.name}</span>
                {nextRank && <span className="text-[10px] uppercase tracking-widest text-zinc-600">Mục tiêu: {nextRank.name}</span>}
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, rankProgress)}%` }}></div>
              </div>
              {nextRank && (
                <p className="text-[10px] text-zinc-600 font-medium">Còn {((nextRank.min - totalSpending) / 1000).toLocaleString('vi-VN')}K để lên hạng {nextRank.name}</p>
              )}
              <Link href="/profile" className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-white border-b border-white hover:text-zinc-400 hover:border-zinc-400 transition-colors">
                Xem Chi Tiết
              </Link>
            </div>
          </div>
        )}

        {/* Rank Comparison Table */}
        <div className="overflow-x-auto mb-20">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 pr-8 text-[10px] uppercase tracking-widest font-bold text-zinc-600 border-b border-zinc-800">Đặc Quyền</th>
                {RANKS.map(rank => (
                  <th key={rank.id} className={`text-center py-4 px-4 text-[10px] uppercase tracking-widest font-black border-b border-zinc-800 ${rank.featured ? 'bg-zinc-900' : ''}`}>
                    <span style={{ color: rank.color }}>{rank.name}</span>
                    <div className="text-zinc-700 font-mono text-[8px] mt-1 tracking-widest normal-case">
                      {rank.max === Infinity ? `${(rank.min/1000).toLocaleString()}K+` : `${(rank.min/1000).toLocaleString()}K – ${(rank.max/1000000).toFixed(1)}M`}
                    </div>
                    {rank.featured && <div className="text-[8px] font-bold bg-white text-black px-1.5 py-0.5 rounded-sm inline-block mt-1.5 uppercase tracking-wider">Phổ biến</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                { label: 'Chiết khấu hóa đơn', values: ['—', '-5%', '-10%', '-15%'] },
                { label: 'Tích điểm', values: ['1x', '1.5x', '2x', '3x'] },
                { label: 'Ưu đãi sinh nhật', values: ['✓', '✓', '✓', '✓'] },
                { label: 'Đặt vé sớm', values: ['—', '24h', '48h', 'Ưu tiên'] },
                { label: 'Combo miễn phí/tháng', values: ['—', '1', '2', 'Không giới hạn'] },
                { label: 'Vé xem thứ 3', values: ['—', '—', '2 vé/tháng', 'Không giới hạn'] },
                { label: 'Phòng chờ VIP Lounge', values: ['—', '—', '✓', '✓'] },
                { label: 'Sự kiện Premier độc quyền', values: ['—', '—', '—', '✓'] },
                { label: 'Concierge cá nhân', values: ['—', '—', '—', '✓'] },
              ].map((row, i) => (
                <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors">
                  <td className="py-4 pr-8 text-[11px] font-medium text-zinc-300">{row.label}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className={`text-center py-4 px-4 text-[11px] font-semibold ${RANKS[j].featured ? 'bg-zinc-900/40' : ''} ${val === '✓' ? 'text-white' : val === '—' ? 'text-zinc-700' : 'text-white'}`}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Individual Rank Cards */}
        <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-500 mb-8 flex items-center gap-4">
          <span className="w-12 h-px bg-zinc-700"></span> Chi tiết từng hạng <span className="w-12 h-px bg-zinc-700"></span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {RANKS.map(rank => {
            const isCurrent = user && rank.id === currentRank.id;
            return (
              <div key={rank.id} className={`border p-8 relative transition-colors ${isCurrent ? 'border-white bg-zinc-900/30' : 'border-zinc-800 hover:border-zinc-700'}`}>
                {isCurrent && <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white text-black px-2 py-0.5">Hạng của bạn</div>}

                <div className="flex items-end gap-3 mb-6">
                  <div className="w-2 h-10" style={{ backgroundColor: rank.color }}></div>
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-widest" style={{ color: rank.color }}>{rank.name}</h3>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">{rank.nameEn} · {rank.max === Infinity ? `${(rank.min/1000).toLocaleString()}K+` : `${(rank.min/1000).toLocaleString()}K – ${(rank.max/1000000).toFixed(1)}M`} đ</p>
                  </div>
                  {rank.discount && (
                    <div className="ml-auto text-right">
                      <span className="text-3xl font-black text-white">-{rank.discount}%</span>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mt-0.5">Mọi đơn hàng</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {rank.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-zinc-400">
                      <span className="w-4 h-px bg-zinc-700 mt-2 shrink-0"></span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="border-t border-zinc-800 pt-16">
          <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-500 mb-10 flex items-center gap-4">
            <span className="w-12 h-px bg-zinc-700"></span> Câu hỏi thường gặp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {[
              { q: 'Hạng thành viên được tính thế nào?', a: 'Được tính dựa trên tổng chi tiêu tích lũy từ khi đăng ký tài khoản. Không giới hạn thời gian.' },
              { q: 'Điểm tích lũy có thời hạn không?', a: 'Điểm tích lũy có hiệu lực 24 tháng kể từ ngày phát sinh giao dịch. Với hạng Vàng trở lên, điểm không giới hạn thời gian.' },
              { q: 'Tôi có thể bị hạ hạng không?', a: 'Không. Hạng thành viên chỉ được cộng dồn, không bao giờ bị hạ xuống khi bạn đã đạt được.' },
              { q: 'Chiết khấu áp dụng cho cả F&B không?', a: 'Có. Chiết khấu theo hạng áp dụng cho toàn bộ hóa đơn bao gồm cả vé và dịch vụ ăn uống tại quầy.' },
            ].map((faq, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Footer */}
        {!user && (
          <div className="mt-20 border border-zinc-800 p-12 text-center">
            <h3 className="text-2xl font-semibold text-white mb-3">Bắt Đầu Hành Trình</h3>
            <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">Tạo tài khoản miễn phí để bắt đầu tích lũy và thăng hạng thành viên MS Cinema ngay hôm nay.</p>
            <Link href="/" className="inline-block px-10 py-3.5 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              Đăng Ký Ngay
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
