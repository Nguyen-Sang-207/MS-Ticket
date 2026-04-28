"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Promo {
  id: string;
  code: string;
  name: string;
  description: string;
  expireDate: string;
  applicableFor: string;
  discountType: string;
  discountValue: number;
  banks?: string[];
}

const CATEGORIES = ['Tất cả', 'ALL', 'MEMBER', 'BANK'];
const CATEGORY_LABELS: Record<string, string> = {
  'ALL': 'Tất cả mọi người',
  'MEMBER': 'Thành Viên',
  'BANK': 'Ngân Hàng',
};

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [copied, setCopied] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.json())
      .then(d => {
        // filter active promos only for the frontend
        const data = d.data || [];
        setPromos(data.filter((p: any) => p.active));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'Tất cả' ? promos : promos.filter(p => p.applicableFor === activeTab);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pt-28 pb-32 selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Khuyến Mãi</h1>
            <p className="text-zinc-500 text-sm">Các ưu đãi độc quyền dành cho thành viên MS Cinema</p>
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            Cập nhật: Tháng 04/2026
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-8 overflow-x-auto border-b border-zinc-800 mb-12 pb-px custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-shrink-0 pb-4 border-b-2 text-[11px] tracking-widest uppercase font-bold transition-all ${activeTab === cat ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
             <div className="text-zinc-500 py-10 col-span-2 text-center">Đang tải mã khuyến mãi...</div>
          ) : filtered.length === 0 ? (
             <div className="text-zinc-500 py-10 col-span-2 text-center">Không có mã khuyến mãi nào</div>
          ) : filtered.map(promo => {
            const isPercent = promo.discountType === 'PERCENT';
            const discountLabel = isPercent ? `-${promo.discountValue}%` : `-${(promo.discountValue / 1000)}K`;

            return (
            <div key={promo.id} className="border border-zinc-800 hover:border-zinc-600 transition-colors group">
              {/* Card header stripe */}
              <div className="flex items-stretch">
                {/* Discount badge — left vertical stripe on the card */}
                <div className="w-28 shrink-0 bg-white text-black flex flex-col items-center justify-center p-4 text-center group-hover:bg-zinc-200 transition-colors">
                  <span className="text-2xl font-black leading-tight">{discountLabel}</span>
                  {isPercent && <span className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-60">GIẢM GIÁ</span>}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-1 block">
                        {CATEGORY_LABELS[promo.applicableFor] || promo.applicableFor}
                      </span>
                      <h3 className="text-lg font-semibold text-white leading-snug">{promo.name}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed mt-2 mb-4 line-clamp-3">{promo.description}</p>

                  {promo.banks && promo.banks.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {promo.banks.map(b => (
                        <span key={b} className="text-[9px] uppercase font-bold tracking-widest border border-zinc-700 px-2 py-0.5 text-zinc-400">{b}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                    <div>
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Tình trạng</span>
                      <p className="text-[10px] text-green-400 font-medium mt-0.5">Đang hoạt động</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">HSD</span>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{promo.expireDate ? new Date(promo.expireDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Bar */}
              <div 
                onClick={() => copyCode(promo.code)}
                className="flex items-center justify-between px-6 py-3 border-t border-dashed border-zinc-700 cursor-pointer group/code hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-600">Mã giảm giá</span>
                  <span className="font-mono font-black text-white text-sm tracking-widest">{promo.code}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${copied === promo.code ? 'text-green-400' : 'text-zinc-500 group-hover/code:text-white'}`}>
                  {copied === promo.code ? 'Đã sao chép' : 'Nhấn để sao chép'}
                </span>
              </div>
            </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 border border-zinc-800 p-12 text-center">
          <h3 className="text-2xl font-semibold text-white mb-3">Nhận Ưu Đãi Sớm Nhất</h3>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">Đăng ký tài khoản thành viên để nhận thông báo về các chương trình ưu đãi độc quyền trước khi công bố rộng rãi.</p>
          <Link href="/profile" className="inline-block px-10 py-3.5 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            Xem Thẻ Thành Viên
          </Link>
        </div>

      </div>
    </div>
  );
}
