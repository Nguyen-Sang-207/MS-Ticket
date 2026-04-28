"use client";

import React, { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Clock, Coffee, Plus, Minus, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { rtdb } from '@/lib/firebase/client';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';
import { isFirebaseDown } from '@/lib/dataService';
import { sandboxUpsert } from '@/lib/sandboxStore';

const generateMockSeats = (): Seat[] => {
  const rows = ['A','B','C','D','E','F','G','H'];
  const seatsPerRow = 12;
  const seats: Seat[] = [];
  let idx = 0;
  rows.forEach(row => {
    for (let col = 1; col <= seatsPerRow; col++) {
      if (col === 7) seats.push({ id: `W_${row}7`, seatNumber: `W_${row}7`, price: 0, status: 'WALKWAY', seatType: 'WALKWAY' });
      const seatType = ['E','F'].includes(row) ? 'VIP' : ['G','H'].includes(row) && col >= 5 && col <= 8 ? 'Couple' : 'Standard';
      const price = seatType === 'VIP' ? 100000 : seatType === 'Couple' ? 200000 : 55000;
      const status = 'AVAILABLE';
      seats.push({ id: `${row}${col}`, seatNumber: `${row}${col}`, seatType, price, status });
      idx++;
    }
  });
  return seats;
};

interface MovieDetail { id: string; nameVn: string; nameEn?: string; image: string; ratings: string; time: number; format: string; }
interface Theater { id: string; nameEn: string; nameVn: string; }
interface Showtime { id: string; startTime: string; roomName: string; }
interface Seat { id: string; seatNumber: string; seatType?: string; price: number; status: string; }
interface Combo { id: string; name: string; price: number; image: string; description: string; }
interface SelectedCombo extends Combo { selectedQuantity: number; }

function BookingFlow({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuth();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [loadingTheaters, setLoadingTheaters] = useState(false);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<string[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [availableCombos, setAvailableCombos] = useState<Combo[]>([]);

  // Promo Code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);

  // Cool Feature: Booking Timer
  const [timeLeft, setTimeLeft] = useState(600); // 10:00 minutes

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    // Use local date components (not toISOString which converts to UTC first)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      value: `${year}-${month}-${day}`,
      day: day,
      name: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      month: month,
    };
  });

  useEffect(() => {
    fetch('/api/combos').then(res => res.json()).then(data => {
      setAvailableCombos(data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.statusCode === 200) {
          setMovie(data.data);
          const preDate = searchParams.get('date');
          setSelectedDate(preDate || dates[0].value);
        }
      })
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingTheaters(true);
    setTheaters([]);
    fetch(`/api/theaters`)
      .then(res => res.json())
      .then(data => {
        const tList = data.data || [];
        setTheaters(tList);
        const preTh = searchParams.get('theater');
        if (preTh) {
           const match = tList.find((t: Theater) => t.id === preTh);
           if (match) setSelectedTheater(match);
        }
      })
      .finally(() => setLoadingTheaters(false));
  }, [selectedDate, searchParams]);

  useEffect(() => {
    if (!selectedTheater || !selectedDate) return;
    setLoadingShowtimes(true);
    setShowtimes([]);
    fetch(`/api/showtimes?movieId=${id}&theaterId=${selectedTheater.id}&date=${selectedDate}`)
      .then(res => res.json())
      .then(async data => {
        const { sandboxMerge } = await import('@/lib/sandboxStore');
        const sList = sandboxMerge<Showtime>('showtimes', data.data as Showtime[] || []);
        setShowtimes(sList);
        const preTime = searchParams.get('showtime');
        if (preTime) {
           const match = sList.find((s: Showtime) => s.startTime === preTime);
           if (match) setSelectedShowtime(match);
        }
      })
      .finally(() => setLoadingShowtimes(false));
  }, [id, selectedTheater, selectedDate, searchParams]);

  useEffect(() => {
    if (!selectedShowtime) return;
    setLoadingSeats(true);
    setSeats([]);
    fetch(`/api/showtimes/${selectedShowtime.id}/seats`)
      .then(res => res.json())
      .then(async data => {
        let apiSeats = data.data || [];
        if (apiSeats.length === 0) apiSeats = generateMockSeats();

        // Lấy ghế đã đặt từ Sandbox cho suất chiếu này
        if (typeof window !== 'undefined') {
           const { sandboxGetOverrides } = await import('@/lib/sandboxStore');
           const sandboxBookings = Object.values(sandboxGetOverrides('bookings')) as any[];
           
           const bookedSeatIds = new Set<string>();
           sandboxBookings.forEach(b => {
             if (b.showtimeId === selectedShowtime.id && b.status !== 'CANCELLED') {
               if (Array.isArray(b.seats)) {
                 b.seats.forEach((s: any) => s.seatId && bookedSeatIds.add(s.seatId));
               }
             }
           });

           if (bookedSeatIds.size > 0) {
             apiSeats = apiSeats.map((seat: any) => {
               if (bookedSeatIds.has(seat.id)) {
                 return { ...seat, status: 'BOOKED' };
               }
               return seat;
             });
           }
        }
        setSeats(apiSeats);
      })
      .catch(() => setSeats(generateMockSeats()))
      .finally(() => setLoadingSeats(false));

    const locksRef = ref(rtdb, `seatLocks/${selectedShowtime.id}`);
    const unsub = onValue(locksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const locks: string[] = [];
        Object.entries(data).forEach(([uid, userLocks]: [string, any]) => {
          if (uid !== user?.id) locks.push(...userLocks);
        });
        setLockedSeats(locks);
      } else {
        setLockedSeats([]);
      }
    });

    return () => unsub();
  }, [selectedShowtime, user?.id]);

  useEffect(() => {
    if (!selectedShowtime || !user) return;
    const myLockRef = ref(rtdb, `seatLocks/${selectedShowtime.id}/${user.id}`);
    if (selectedSeats.length > 0) {
      set(myLockRef, selectedSeats.map(s => s.id));
      onDisconnect(myLockRef).remove();
    } else {
      remove(myLockRef);
    }
  }, [selectedSeats, selectedShowtime, user]);

  // Timer Countdown Logic
  useEffect(() => {
    if (selectedSeats.length > 0 && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timerId);
    }
    if (timeLeft === 0 && selectedSeats.length > 0) {
      alert("Thời gian giữ ghế đã hết. Vui lòng chọn lại.");
      setSelectedSeats([]);
      setTimeLeft(600);
    }
  }, [selectedSeats.length, timeLeft]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.seatNumber.startsWith('W_') || seat.status !== 'AVAILABLE' || lockedSeats.includes(seat.id)) return;
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    if (isSelected) {
       setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
       if (selectedSeats.length === 0) setTimeLeft(600); // reset timer on first seat
       setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getSeatClasses = (seat: Seat) => {
    if (seat.seatNumber.startsWith('W_')) return 'opacity-0 cursor-default pointer-events-none border-none';
    
    if (selectedSeats.find(s => s.id === seat.id)) return 'bg-white text-black font-black scale-110 shadow-lg';
    
    if (lockedSeats.includes(seat.id)) return 'border-zinc-800 text-zinc-800/10 opacity-30 cursor-not-allowed bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAxIi8+Cgk8cGF0aCBkPSJNMCAwTDQgNFpNNCAwTDAgNFoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==")]';
    if (seat.status !== 'AVAILABLE') return 'border-zinc-800 text-zinc-800/10 opacity-20 cursor-not-allowed bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAxIi8+Cgk8cGF0aCBkPSJNMCAwTDQgNFpNNCAwTDAgNFoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==")]';
    
    if (seat.seatType === 'VIP') return 'border-yellow-500/80 text-yellow-500 hover:bg-yellow-500 hover:text-black';
    if (seat.seatType === 'Couple') return 'border-indigo-400/80 text-indigo-400 hover:bg-indigo-400 hover:text-white';
    
    return 'border-zinc-600 text-zinc-400 hover:bg-white hover:text-black hover:border-white';
  };

  const getSeatPrice = (type?: string, base: number = 0) => {
    if (base > 0) return base;
    if (type === 'VIP') return 100000;
    if (type === 'Couple') return 200000;
    return 50000;
  };

  const subtotal = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s.seatType, s.price), 0) + 
                   selectedCombos.reduce((sum, c) => sum + c.price * c.selectedQuantity, 0);

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'PERCENT') {
      discountAmount = (subtotal * appliedPromo.discountValue) / 100;
    } else {
      discountAmount = appliedPromo.discountValue;
    }
  }
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true); setPromoError(''); setPromoSuccess('');
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      const allPromos = data.data || [];
      const match = allPromos.find((p: any) => p.code === promoCode.toUpperCase() && p.active);
      
      if (!match) {
        setPromoError('Mã không hợp lệ hoặc đã hết hạn.');
      } else {
        if (match.minOrderAmount && subtotal < match.minOrderAmount) {
           setPromoError(`Đơn hàng tối thiểu để áp dụng mã này là ${match.minOrderAmount.toLocaleString('vi-VN')}đ`);
        } else {
           setAppliedPromo(match);
           setPromoSuccess(`Áp dụng thành công mã ${match.code}!`);
        }
      }
    } catch {
      setPromoError('Lỗi kiểm tra mã khuyến mãi.');
    }
    setCheckingPromo(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoSuccess('');
    setPromoError('');
  };

  const handleBooking = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) return;
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    
    setIsBooking(true);
    try {
      const bookingData = {
        showtimeId: selectedShowtime.id,
        seats: selectedSeats.map(s => ({ seatId: s.id, row: s.seatNumber.charAt(0), col: s.seatNumber.slice(1) })),
        combos: selectedCombos,
        totalAmount,
        discountAmount,
        promotionCode: appliedPromo?.code || null,
        // Include display info so mock bookings have full details
        movieNameVn: movie?.nameVn || '',
        movieNameEn: movie?.nameEn || '',
        movieFormat: movie?.format || '2D',
        movieTime: movie?.time || 120,
        theaterName: selectedTheater?.nameVn || selectedTheater?.nameEn || '',
        roomName: selectedShowtime.roomName || '',
        date: selectedDate || '',
        startTime: selectedShowtime.startTime || '',
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await firebaseUser!.getIdToken()}` },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (data.statusCode === 201 || data.statusCode === 200 || res.ok) {
        if (isFirebaseDown()) {
           sandboxUpsert('bookings', data.data.id, data.data);
        }
        router.push(`/payment-result?status=success&bookingId=${data.data.id}&vnp_Amount=${bookingData.totalAmount * 100}`);
      } else {
        alert('Lỗi đặt vé: ' + data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
    } finally {
      setIsBooking(false);
    }
  };

  // String replacer removed
  const formatMoney = (n: number) => n.toLocaleString('vi-VN') + ' đ';

  const seatRows: { [key: string]: Seat[] } = {};
  seats.forEach(seat => {
    const row = seat.seatNumber.startsWith('W_') ? seat.seatNumber.substring(2, 3) : seat.seatNumber.charAt(0);
    if (!seatRows[row]) seatRows[row] = [];
    seatRows[row].push(seat);
  });
  Object.values(seatRows).forEach(row => {
    row.sort((a, b) => {
      const getPos = (num: string) => parseInt(num.startsWith('W_') ? num.substring(3) : num.includes('+') ? num.split('+')[0].slice(1) : num.slice(1));
      return getPos(a.seatNumber) - getPos(b.seatNumber);
    });
  });

  if (loading || !movie) return (
    <div className="min-h-screen pt-32 flex items-center justify-center bg-[#09090b]">
       <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pt-28 pb-32">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-20">
        
        {/* Main Selection Flow */}
        <div className="space-y-16">
          
          <div className="border-b border-zinc-800 pb-8 flex items-end justify-between">
             <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Thông tin Đặt vé</h1>
             {selectedSeats.length > 0 && (
                <div className="text-sm font-medium animate-in fade-in flex items-center gap-2">
                   Giữ ghế: <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
             )}
          </div>

          {/* Step 1: Schedule Selection (Flat UI) */}
          <section>
            <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-semibold mb-6 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-zinc-600"></span> 1. Lịch Chiếu
            </h3>
            
            <div className="space-y-8">
               {/* Date Scrubber */}
               <div className="flex gap-6 overflow-x-auto custom-scrollbar border-b border-zinc-800 pb-px">
                 {dates.map(date => {
                   const isSelected = selectedDate === date.value;
                   return (
                     <button 
                       key={date.value} 
                       onClick={() => { setSelectedDate(date.value); setSelectedShowtime(null); }}
                       className={`flex-shrink-0 flex flex-col pb-3 border-b-2 transition-all ${isSelected ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                     >
                       <span className="text-[10px] font-medium tracking-wide uppercase mb-1">{date.name}</span>
                       <span className={`text-xl ${isSelected ? 'font-semibold' : 'font-normal'}`}>{date.day}/{date.month}</span>
                     </button>
                   );
                 })}
               </div>

               {/* Theater Select */}
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                 {loadingTheaters ? (
                   // Skeleton placeholders while theaters are loading
                   Array.from({ length: 6 }).map((_, i) => (
                     <div key={i} className="p-3 border border-zinc-800 rounded animate-pulse">
                       <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                     </div>
                   ))
                 ) : theaters.length === 0 ? (
                   <span className="text-zinc-600 text-sm">Chưa cập nhật cụm rạp mốc thời gian này.</span>
                 ) : (
                   theaters.map(t => (
                     <button
                       key={t.id}
                       onClick={() => { setSelectedTheater(t); setSelectedShowtime(null); }}
                       className={`p-3 text-left border rounded transition-colors ${selectedTheater?.id === t.id ? 'border-white !bg-white text-black font-semibold' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                     >
                       <div className="text-sm line-clamp-1">{t.nameVn || 'MS Cinema'}</div>
                     </button>
                   ))
                 )}
               </div>

               {/* Showtime Select — grouped by type: Phòng Thường / Phòng VIP */}
               {selectedTheater && (() => {
                 // Loading skeleton for showtimes
                 if (loadingShowtimes) return (
                   <div className="pt-6 border-t border-zinc-800/50 space-y-3">
                     <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse"></div>
                     <div className="flex flex-wrap gap-2">
                       {Array.from({ length: 5 }).map((_, i) => (
                         <div key={i} className="w-20 h-9 bg-zinc-800 rounded animate-pulse"></div>
                       ))}
                     </div>
                   </div>
                 );

                 if (showtimes.length === 0) return (
                   <span className="text-zinc-600 text-sm pt-4 border-t border-zinc-800/50 block">Không có suất chiếu phù hợp.</span>
                 );

                 // Classify by VIP keyword in roomName
                 const isVip = (st: any) => (st.roomName || '').toLowerCase().includes('vip');
                 const standard = showtimes.filter((st: any) => !isVip(st));
                 const vip = showtimes.filter((st: any) => isVip(st));

                 const renderGroup = (label: string, tag: string, list: typeof showtimes, accent: string) => (
                   list.length > 0 ? (
                     <div key={label}>
                       <div className={`flex items-center gap-2 mb-3`}>
                         <span className={`text-[10px] uppercase tracking-[0.25em] font-bold ${accent}`}>{label}</span>
                         <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${tag === 'vip' ? 'border-yellow-500/50 text-yellow-500' : 'border-zinc-700 text-zinc-500'}`}>{tag}</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {list.map((st: any) => (
                           <button
                             key={st.id}
                             onClick={() => { setSelectedShowtime(st); setSelectedSeats([]); }}
                             className={`px-5 py-2.5 border rounded transition-colors text-sm font-semibold tracking-wider ${
                               selectedShowtime?.id === st.id
                                 ? (tag === 'vip' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300' : 'border-white !bg-white text-black')
                                 : (tag === 'vip' ? 'border-yellow-500/30 text-yellow-600 hover:border-yellow-400 hover:text-yellow-400' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500')
                             }`}
                           >
                             {st.startTime}
                           </button>
                         ))}
                       </div>
                     </div>
                   ) : null
                 );

                 return (
                   <div className="space-y-6 pt-6 border-t border-zinc-800/50">
                     {renderGroup('Phòng Thường', 'standard', standard, 'text-zinc-400')}
                     {renderGroup('Phòng VIP', 'vip', vip, 'text-yellow-500')}
                   </div>
                 );
               })()}
            </div>
          </section>

          {/* Step 2: Seat Selection (Minimalist Theatre) */}
          <section className={`transition-all duration-700 ${selectedShowtime ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
             <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-semibold mb-10 flex items-center gap-2">
               <span className="w-4 h-[1px] bg-zinc-600"></span> 2. Sơ đồ Ghế
             </h3>
             
             {/* Stage screen curve */}
             <div className="w-[80%] mx-auto pb-12 mb-10 relative">
                <h4 className="absolute left-1/2 -bottom-2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold z-10">Màn Hình</h4>
                <div className="w-full h-8 border-t-[3px] border-zinc-500 rounded-t-[50%] opacity-50 shadow-[0_-5px_20px_rgba(255,255,255,0.05)]"></div>
             </div>
             
             {/* Seat map or loading skeleton */}
             {loadingSeats ? (
               <div className="overflow-x-auto pb-4">
                 <div className="min-w-max flex flex-col items-center gap-2.5">
                   {['A','B','C','D','E','F','G','H'].map(row => (
                     <div key={row} className="flex items-center gap-2">
                       <div className="w-6 text-xs text-zinc-700 text-right pr-2 font-semibold">{row}</div>
                       <div className="flex gap-1.5 p-1">
                         {Array.from({ length: 11 }).map((_, i) => (
                           <div key={i} className="w-8 h-8 bg-zinc-800 rounded-t rounded-b-sm animate-pulse"></div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
             <div className="overflow-x-auto pb-4">
               <div className="min-w-max flex flex-col items-center gap-2.5">
                  {Object.entries(seatRows).map(([rowLetter, rowSeats]) => (
                    <div key={rowLetter} className="flex items-center gap-2">
                      <div className="w-6 font-semibold text-zinc-600 text-xs text-right pr-2">{rowLetter}</div>
                      <div className="flex gap-1.5 p-1">
                        {rowSeats.map(seat => {
                           const isWalkway = seat.seatNumber.startsWith('W_');
                           const seatClasses = getSeatClasses(seat);
                           const isCouple = seat.seatNumber.includes('+');
                           
                           if (isWalkway) return <div key={seat.id} className="w-8 h-8"></div>;

                           return (
                             <button
                               key={seat.id}
                               onClick={() => handleSeatClick(seat)}
                               disabled={seat.status !== 'AVAILABLE' || lockedSeats.includes(seat.id)}
                               className={`border rounded-t rounded-b-sm font-semibold text-[10px] flex items-center justify-center transition-all ${isCouple ? 'w-[75px]' : 'w-8'} h-8 ${seatClasses}`}
                             >
                               {seat.seatNumber}
                             </button>
                           );
                        })}
                      </div>
                      <div className="w-6 font-semibold text-zinc-600 text-xs pl-2">{rowLetter}</div>
                    </div>
                  ))}
               </div>
             </div>
             )}
             
             {/* Flat Legend */}
             <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-zinc-800/80 text-[11px] text-zinc-400 uppercase tracking-widest font-medium">
               <div className="flex items-center gap-2"><div className="w-4 h-4 border border-zinc-600 rounded-sm"></div>Thường</div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 border border-yellow-500/80 rounded-sm"></div>VIP</div>
               <div className="flex items-center gap-2"><div className="w-8 h-4 border border-indigo-400/80 rounded-sm"></div>Couple</div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white bg-white rounded-sm"></div>Đang chọn</div>
             </div>
          </section>

          {/* Step 3: F&B */}
          <section className={`transition-all duration-700 ${selectedSeats.length > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-semibold mb-6 flex items-center gap-2">
               <span className="w-4 h-[1px] bg-zinc-600"></span> 3. Dịch vụ & F&B
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {availableCombos.map(combo => {
                  const currentCombo = selectedCombos.find(c => c.id === combo.id);
                  const qty = currentCombo ? currentCombo.selectedQuantity : 0;
                  
                  return (
                    <div key={combo.id} className="border border-zinc-800 rounded p-4 flex gap-4 items-center">
                      <div className="w-12 h-12 flex items-center justify-center p-1 border border-zinc-800 rounded bg-zinc-900/50">
                         <img src={combo.image || 'https://cdn.iconscout.com/icon/free/png-256/popcorn-154-1077752.png'} alt={combo.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{combo.name}</h4>
                        <div className="text-[10px] text-zinc-500 mb-1">{combo.description || 'Combo tiêu chuẩn'}</div>
                        <div className="font-semibold text-xs tracking-wide">{formatMoney(combo.price)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { if (qty > 1) setSelectedCombos(selectedCombos.map(c => c.id === combo.id ? { ...c, selectedQuantity: qty - 1 } : c)); else if (qty === 1) setSelectedCombos(selectedCombos.filter(c => c.id !== combo.id)); }} disabled={qty === 0} className="w-7 h-7 border border-zinc-600 rounded flex items-center justify-center hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"><Minus className="w-3 h-3 text-white" /></button>
                        <span className="w-3 text-center text-sm font-semibold">{qty}</span>
                        <button onClick={() => { if (qty > 0) setSelectedCombos(selectedCombos.map(c => c.id === combo.id ? { ...c, selectedQuantity: qty + 1 } : c)); else setSelectedCombos([...selectedCombos, { ...combo, selectedQuantity: 1 }]); }} className="w-7 h-7 border border-white bg-white text-black rounded flex items-center justify-center hover:bg-zinc-200 transition-all font-bold"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )
               })}
            </div>
          </section>

        </div>

        {/* Sidebar: Premium Digital Receipt View */}
        <div className="relative pt-6">
           <div className="sticky top-32 bg-[#FAF8F5] text-[#1E1C18] rounded-md overflow-hidden shadow-2xl flex flex-col font-mono text-sm leading-relaxed border-t-[8px] border-blue-600 filter drop-shadow-xl relative z-10 p-6 md:p-8">
              
              {/* Receipt Notch Decorators */}
              <div className="absolute left-0 top-[200px] w-4 h-8 bg-[#09090b] rounded-r-full"></div>
              <div className="absolute right-0 top-[200px] w-4 h-8 bg-[#09090b] rounded-l-full"></div>
              
              {/* Receipt Header */}
              <h2 className="text-center font-bold text-lg uppercase tracking-[0.2em] mb-4 border-b-2 border-dashed border-[#1E1C18]/20 pb-4">
                 E-Ticket
              </h2>
              
              {/* Movie Info */}
              <div className="border-b-2 border-dashed border-[#1E1C18]/20 pb-6 mb-6 mt-2 relative z-0">
                 <h3 className="font-bold text-xl uppercase leading-tight line-clamp-2">{movie.nameVn}</h3>
                 <div className="mt-2 text-xs uppercase tracking-widest font-semibold text-blue-700 bg-blue-100 inline-block px-1.5 py-0.5 rounded-sm">
                   {movie.format || '2D'} • {movie.time || 120} M
                 </div>
              </div>
              
              {/* Details table */}
              <div className="space-y-4 border-b-2 border-dashed border-[#1E1C18]/20 pb-6 mb-6">
                 <div>
                    <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Rạp / Cinema</div>
                    <div className="font-semibold">{selectedTheater ? (selectedTheater.nameVn || 'MS Cinema') : '---'}</div>
                 </div>
                 
                 <div className="flex gap-6">
                    <div>
                       <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Ngày / Date</div>
                       <div className="font-semibold">{selectedDate ? selectedDate.split('-').reverse().join('/') : '---'}</div>
                    </div>
                    <div>
                       <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Giờ / Time</div>
                       <div className="font-semibold">{selectedShowtime ? selectedShowtime.startTime : '---'}</div>
                    </div>
                 </div>

                 <div>
                    <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Phòng / Room</div>
                    <div className="font-semibold">{selectedShowtime?.roomName || '---'}</div>
                 </div>

                 <div>
                    <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Gế / Seat(s)</div>
                    <div className="font-semibold text-lg">{selectedSeats.length > 0 ? selectedSeats.map(s => s.seatNumber).join(', ') : '---'}</div>
                 </div>
              </div>

              {/* Total Calculation */}
              <div className="mb-8 border-t-2 border-dashed border-[#1E1C18]/20 pt-6">
                 {/* Promo Code Input */}
                 <div className="mb-4">
                    <label className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-1 block">Mã giảm giá</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={promoCode} 
                         onChange={e => setPromoCode(e.target.value.toUpperCase())}
                         disabled={!!appliedPromo}
                         placeholder="Nhập mã..." 
                         className="flex-1 border border-[#1E1C18]/20 bg-transparent px-3 py-2 text-sm font-bold uppercase focus:outline-none focus:border-blue-600 disabled:opacity-50"
                       />
                       {appliedPromo ? (
                         <button onClick={handleRemovePromo} className="px-3 bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors">
                           Hủy
                         </button>
                       ) : (
                         <button onClick={handleApplyPromo} disabled={checkingPromo || !promoCode.trim()} className="px-3 bg-[#1E1C18] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50">
                           {checkingPromo ? '...' : 'Áp dụng'}
                         </button>
                       )}
                    </div>
                    {promoError && <p className="text-red-500 text-[10px] font-semibold mt-1">{promoError}</p>}
                    {promoSuccess && <p className="text-green-600 text-[10px] font-semibold mt-1">{promoSuccess}</p>}
                 </div>

                 {/* Price Breakdown */}
                 <div className="space-y-1 mb-3 text-sm font-semibold text-[#1E1C18]/70">
                    <div className="flex justify-between">
                       <span>Tạm tính:</span>
                       <span>{subtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                         <span>Giảm giá ({appliedPromo?.code}):</span>
                         <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                 </div>

                 <div className="flex justify-between font-bold text-lg items-end mt-2 pt-2 border-t border-[#1E1C18]/10">
                    <span>Tổng / Total:</span>
                    <span className="text-2xl tracking-tighter">
                       {totalAmount.toLocaleString('vi-VN')}
                    </span>
                 </div>
                 {selectedCombos.length > 0 && <div className="text-[10px] text-[#1E1C18]/60 font-semibold mt-1 text-right">(Bao gồm F&B)</div>}
              </div>

              {/* Checkout Button directly on ticket */}
              <button 
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || isBooking}
                className="w-full bg-[#1E1C18] text-white disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed py-4 font-bold uppercase tracking-widest text-sm transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-[#333]"
              >
                {isBooking ? 'Đang xuất vé...' : 'Thanh Toán Ngay'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

export default function BookingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] pt-32 text-center text-white font-mono">Loading Booking Flow...</div>}>
      <BookingFlow id={id} />
    </Suspense>
  );
}
