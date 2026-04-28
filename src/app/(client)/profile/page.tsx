"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Ticket, Award, Star, Settings, LogOut, MapPin, ChevronRight, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DigitalTicket from "@/components/DigitalTicket";

interface Booking {
  id: string; movieNameVn: string; theaterName: string; roomName: string;
  date: string; startTime: string; seats: any[];
  totalAmount: number; qrCode: string; status: string;
  movieFormat?: string; movieTime?: number; format?: string; time?: number;
}

const RANKS = [
  { name: 'Đồng', min: 0, max: 1000000, color: 'text-[#cd7f32]', bg: 'from-[#cd7f32]/20 to-[#8b5a2b]/20', border: 'border-[#cd7f32]/30', card: 'from-[#5e3a15] to-[#2a1a09] text-[#e8c39e] border-[#cd7f32]/40', discount: 0 },
  { name: 'Bạc', min: 1000000, max: 3000000, color: 'text-zinc-300', bg: 'from-zinc-400/20 to-zinc-600/20', border: 'border-zinc-400/30', card: 'from-[#9ca3af] to-[#4b5563] text-white border-zinc-300/40', discount: 5 },
  { name: 'Vàng', min: 3000000, max: 10000000, color: 'text-yellow-500', bg: 'from-yellow-400/20 to-amber-600/20', border: 'border-yellow-500/30', card: 'from-[#d4af37] to-[#8b6508] text-[#fff8dc] border-[#FFD700]/50', discount: 10 },
  { name: 'Bạch Kim', min: 10000000, max: Infinity, color: 'text-blue-200', bg: 'from-blue-400/20 to-indigo-600/20', border: 'border-blue-400/30', card: 'from-[#1e1c18] via-[#2a2a35] to-[#1e1c18] text-[#c0c0c0] border-zinc-600 relative overflow-hidden', discount: 15 },
];

export default function ProfilePage() {
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'perks' | 'settings'>('history');

  const totalSpending = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const currentRank = RANKS.reduce((found, rank) => totalSpending >= rank.min ? rank : found, RANKS[0]);
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  const rankProgress = nextRank ? ((totalSpending - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;

  useEffect(() => {
    if (!user || !firebaseUser) { setLoading(false); return; }
    const fetchBookings = async () => {
      try {
        // Always get sandbox bookings first (may have mock bookings from fallback mode)
        const { sandboxGetOverrides } = await import('@/lib/sandboxStore');
        const sandboxBookings = sandboxGetOverrides('bookings');
        const sandboxList = Object.values(sandboxBookings) as any[];

        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/bookings?userId=${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (data.statusCode === 200) {
            const serverBookings: any[] = data.data || [];
            // Merge: sandbox bookings + server bookings, deduplicate by id
            const allIds = new Set(serverBookings.map((b: any) => b.id));
            const merged = [...serverBookings, ...sandboxList.filter((b: any) => !allIds.has(b.id))];
            merged.sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            setBookings(merged);
          }
        } catch {
          // API failed entirely - use sandbox only
          setBookings(sandboxList);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchBookings();
  }, [user, firebaseUser]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return (
    <div className="min-h-screen pt-32 pb-20 flex bg-[#09090b] flex-col items-center justify-center text-zinc-100">
      <div className="text-center max-w-sm">
        <h2 className="text-3xl font-semibold mb-2">Truy cập bị từ chối</h2>
        <p className="text-zinc-500 text-sm mb-8">Bạn cần đăng nhập để quản lý thẻ thành viên và lịch sử đặt vé phim.</p>
        <Link href="/" className="px-8 py-3 bg-white text-black font-semibold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors">Đăng nhập</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-32 px-6 md:px-12 max-w-6xl mx-auto bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-12 lg:gap-20">

        {/* Cinematic Sidebar */}
        <div className="space-y-12">
          
          {/* Header */}
          <div>
             <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Hồ sơ cá nhân</h1>
             <p className="text-zinc-500 text-sm">Quản lý hạng thẻ và lịch sử giao dịch</p>
          </div>

          {/* Feature: Digital Membership Card (Apple Wallet Style) */}
          <div className="space-y-4">
             <div className={`w-full aspect-[1.586/1] rounded-xl p-6 relative flex flex-col justify-between shadow-2xl bg-gradient-to-br ${currentRank.card} border drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500`}>
                
                {/* Visual Flair for Platinum Card */}
                {currentRank.name === 'Bạch Kim' && (
                  <>
                     <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#000_0%,#4b5563_50%,#000_100%)] opacity-20 pointer-events-none mix-blend-overlay"></div>
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </>
                )}

                <div className="flex justify-between items-start relative z-10">
                   {/* Logo */}
                   <div className="font-black text-xl tracking-[0.1em] uppercase drop-shadow-md">MS CINEMA</div>
                   <div className="text-[9px] uppercase font-bold tracking-[0.3em] font-mono opacity-80 border px-2 py-0.5 rounded-sm shadow-sm">{currentRank.name}</div>
                </div>
                
                {/* Chip Graphic */}
                <div className="w-10 h-8 rounded bg-gradient-to-br from-[#d4af37] to-[#8b6508] border border-[#d4af37]/50 mt-4 opacity-90 shadow-inner relative z-10 overflow-hidden flex flex-col justify-between p-1 px-1.5">
                   <div className="w-full h-px bg-black/20"></div>
                   <div className="w-full h-px bg-black/20"></div>
                   <div className="w-full h-px bg-black/20"></div>
                </div>
                
                <div className="mt-auto relative z-10 flex justify-between items-end">
                   <div>
                      <div className="font-mono text-[10px] opacity-70 mb-1 tracking-[0.2em]">{user.id.substring(0, 16).replace(/(.{4})/g, '$1 ').trim().toUpperCase()}</div>
                      <div className="font-semibold text-sm uppercase tracking-widest">{user.fullName || 'Khách Hàng MS'}</div>
                   </div>
                   <div className="text-[10px] tracking-widest font-mono opacity-60">SINCE '26</div>
                </div>
             </div>

             {/* Progress to next rank */}
             {nextRank && (
               <div className="pt-4 animate-in fade-in">
                  <div className="flex justify-between text-[10px] tracking-widest text-zinc-500 uppercase mb-2 font-medium">
                     <span>Hạng {currentRank.name}</span>
                     <span>Mục tiêu {nextRank.name}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                     <div className={`h-full bg-white transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, rankProgress)}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-zinc-500 mt-2 font-medium">Còn {((nextRank.min - totalSpending) / 1000).toLocaleString('vi-VN')}k để nâng hạng</div>
               </div>
             )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 border-y border-zinc-800 py-6">
             <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Tổng Chi Tiêu</div>
                <div className="text-lg font-semibold">{totalSpending.toLocaleString('vi-VN')} đ</div>
             </div>
             <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Vé Đã Mua</div>
                <div className="text-lg font-semibold">{bookings.length} Vé</div>
             </div>
          </div>

          {/* User Details & Actions */}
          <div className="space-y-4 text-sm font-medium">
             <div className="flex items-center gap-3 text-zinc-400">
                <Mail className="w-4 h-4 text-zinc-600" />
                <span className="truncate">{user.email}</span>
             </div>
             {user.phone && (
               <div className="flex items-center gap-3 text-zinc-400">
                  <span className="w-4 text-center font-mono text-zinc-600">📱</span>
                  <span>{user.phone}</span>
               </div>
             )}
             
             <button onClick={handleLogout} className="mt-8 flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:text-red-400 transition-colors">
                Đăng Xuất <LogOut className="w-3.5 h-3.5" />
             </button>
          </div>

        </div>

        {/* Main Interface */}
        <div>
          
          {/* Minimalist Tab Selector */}
          <div className="flex gap-8 border-b border-zinc-800 mb-10 overflow-x-auto custom-scrollbar">
            {([
              { id: 'history', label: 'E-Ticket Đã Đặt' },
              { id: 'perks', label: 'Đặc Quyền Thành Viên' },
              { id: 'settings', label: 'Cài Đặt Hồ Sơ' }
            ] as const).map(tab => (
               <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 border-b-2 text-[12px] font-semibold tracking-wide uppercase whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature: E-Ticket Archive (History) */}
          {activeTab === 'history' && (
             <div className="space-y-0 relative animate-in slide-in-from-right-4 duration-500">
               {loading ? (
                  <div className="py-20 text-center text-zinc-500 text-sm">Đang đồng bộ vé...</div>
               ) : bookings.length === 0 ? (
                  <div className="py-32 text-center text-zinc-500 text-sm border-2 border-dashed border-zinc-800 rounded">
                     Bạn chưa thực hiện giao dịch nào. <br/>
                     <Link href="/movies" className="inline-block mt-4 text-white uppercase text-[10px] font-bold tracking-widest border-b border-white pb-1">Xem Phim Ngay</Link>
                  </div>
               ) : (
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                     {bookings.map(booking => (
                        <div key={booking.id} className="relative group">
                          {/* Decorative status flag (absolute over the ticket) */}
                          <div className={`absolute -top-3 -right-3 z-20 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase rounded-full shadow-lg ${(booking.status === 'CONFIRMED' || booking.status === 'PENDING') ? 'bg-[#1E1C18]' : 'bg-red-800'}`}>
                            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') ? 'Đã Thanh Toán' : booking.status}
                          </div>
                          
                          <DigitalTicket 
                            movieNameVn={booking.movieNameVn}
                             format={booking.movieFormat || booking.format || '2D'}
                             time={booking.movieTime || booking.time || 120}
                             theaterName={booking.theaterName}
                            date={booking.date ? booking.date.split('-').reverse().join('/') : ''}
                            startTime={booking.startTime}
                            roomName={booking.roomName}
                            seats={booking.seats?.map((s: any) => `${s.row}${s.col}`).join(', ') || 'N/A'}
                            totalAmount={booking.totalAmount || 0}
                            qrCode={booking.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://snguyendev.com/`}
                            bookingId={booking.id}
                          />

                          {/* Hover action to download */}
                          <div className="absolute inset-0 bg-[#1E1C18]/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-30 rounded-md">
                             <img src={booking.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://snguyendev.com/`} alt="QR" className="w-24 h-24 mb-4 bg-white p-2 rounded-sm" />
                             <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors">
                               <Download className="w-4 h-4"/> Tải E-Ticket
                             </button>
                          </div>
                        </div>
                     ))}
                  </div>
               )}
             </div>
          )}

          {/* Feature: Perks & Ranks */}
          {activeTab === 'perks' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
               <div className="bg-zinc-900 border border-zinc-800 p-8 mb-8 relative overflow-hidden">
                  <Star className="absolute -right-10 -bottom-10 w-40 h-40 text-white/5 pointer-events-none" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Chính sách Quyền lợi</h3>
                  <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">Hệ thống phân hạng tự động tính toán dựa trên tổng chi tiêu tích lũy. Đặc quyền chiết khấu trực tiếp trên giá vé và F&B tại toàn bộ hệ thống MS Cinema.</p>
               </div>
               
               <div className="space-y-4">
                  {RANKS.map((rank) => (
                     <div key={rank.name} className={`flex items-start md:items-center flex-col md:flex-row gap-6 p-6 border transition-colors ${rank.name === currentRank.name ? 'border-white bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}>
                        <div className={`w-16 h-16 shrink-0 flex items-center justify-center rounded-sm font-black text-2xl uppercase tracking-wider bg-gradient-to-br ${rank.bg} ${rank.color}`}>
                           {rank.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-3 mb-1">
                              <h4 className={`text-lg font-bold uppercase tracking-widest ${rank.color}`}>{rank.name}</h4>
                              {rank.name === currentRank.name && <span className="text-[9px] bg-white text-black px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest">Hiện Tại</span>}
                           </div>
                           <div className="text-xs text-zinc-500 font-mono tracking-wider">MỨC: {(rank.min / 1000).toLocaleString('vi-VN')}K - {rank.max === Infinity ? 'MAX' : `${(rank.max / 1000).toLocaleString('vi-VN')}K`}</div>
                        </div>
                        <div className="md:text-right">
                           {rank.discount > 0 ? (
                              <>
                                <div className="text-white font-semibold flex items-center gap-2 mb-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Giảm {rank.discount}% Tổng Bill</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Áp dụng cho Vé & F&B</div>
                              </>
                           ) : (
                              <div className="text-sm text-zinc-500 font-medium">Quyền lợi cơ bản</div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
             </div>
          )}

          {/* Feature: Settings (Mock) */}
          {activeTab === 'settings' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
               <div className="grid gap-8 max-w-xl">
                  {/* Account detail mock form */}
                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Họ và Tên</label>
                        <input type="text" value={user.fullName || ''} readOnly className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white text-sm focus:outline-none focus:border-white transition-colors" />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Địa chỉ Email</label>
                        <input type="email" value={user.email || ''} readOnly className="w-full bg-transparent border-b border-zinc-700 pb-2 text-zinc-500 text-sm focus:outline-none cursor-not-allowed" />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Số Điện Thoại</label>
                        <input type="text" placeholder="Chưa cập nhật" value={user.phone || ''} readOnly className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white text-sm focus:outline-none focus:border-white transition-colors" />
                     </div>
                  </div>
                  <button className="self-start px-6 py-3 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors rounded-sm">Cập nhật thông tin</button>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

