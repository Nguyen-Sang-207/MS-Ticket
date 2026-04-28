"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Home, Ticket } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DigitalTicket from "@/components/DigitalTicket";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const status = searchParams.get("status") || "success";
  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("vnp_Amount") ? parseInt(searchParams.get("vnp_Amount") as string) / 100 : 0;
  
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (status === "success" && bookingId) {
        try {
          if (typeof window !== 'undefined' && window.sessionStorage.getItem('__cineme_quota_exceeded__') === '1') {
            const { sandboxGetOverrides } = await import('@/lib/sandboxStore');
            const sandboxBookings = sandboxGetOverrides('bookings');
            if (sandboxBookings[bookingId]) {
              setBookingDetails(sandboxBookings[bookingId]);
              setLoading(false);
              return;
            }
          }
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            const data = await res.json();
            setBookingDetails(data.data);
          }
        } catch (error) {
          console.error("Failed to fetch booking details", error);
        }
      }
      setLoading(false);
    };

    // Add slight delay for realistic processing feel
    setTimeout(loadBooking, 1000);
  }, [bookingId, status]);

  if (loading) return <div className="min-h-screen pt-32 text-center text-white">Đang xử lý thanh toán...</div>;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center mt-10">
        
        {status === "success" ? (
          <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">
            {/* Success Message Column */}
            <div className="flex-1 text-center md:text-left">
               <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6 text-green-500">
                 <CheckCircle className="w-10 h-10" />
               </div>
               <h1 className="text-3xl font-bold text-white mb-2">Thanh Toán Thành Công!</h1>
               <p className="text-gray-400 mb-8">Cảm ơn {user?.fullName || 'bạn'} đã đặt vé tại MS Cinema.</p>
               
               <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-8 space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-gray-400">Trạng thái</span> <span className="text-green-500 font-bold uppercase text-xs tracking-widest">Đã thanh toán</span></div>
                  {amount > 0 && <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-gray-400">Số tiền</span> <span className="text-white font-bold">{amount.toLocaleString('vi-VN')} đ</span></div>}
                  {bookingId && <div className="flex justify-between"><span className="text-gray-400">Mã giao dịch</span> <span className="text-white font-mono text-xs tracking-widest">{bookingId.split('-')[0].toUpperCase()}</span></div>}
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                 <Link href="/" className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                   <Home className="w-5 h-5" /> Trang Chủ
                 </Link>
                 <Link href="/profile" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                   <Ticket className="w-5 h-5" /> Vé Của Tôi
                 </Link>
               </div>
            </div>

            {/* Ticket Column */}
            <div className="flex-1 w-full max-w-sm">
               {bookingDetails ? (
                  <DigitalTicket 
                    movieNameVn={bookingDetails.movieNameVn}
                    format={bookingDetails.movieFormat || bookingDetails.format || '2D'}
                    time={bookingDetails.movieTime || bookingDetails.time || 120}
                    theaterName={bookingDetails.theaterName}
                    date={bookingDetails.date ? bookingDetails.date.split('-').reverse().join('/') : ''}
                    startTime={bookingDetails.startTime}
                    roomName={bookingDetails.roomName}
                    seats={bookingDetails.seats?.map((s: any) => `${s.row}${s.col}`).join(', ')}
                    totalAmount={bookingDetails.totalAmount}
                    qrCode={bookingDetails.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://snguyendev.com/`}
                    bookingId={bookingDetails.id}
                  />
               ) : (
                  <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden animate-pulse min-h-[400px]">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden max-w-md w-full text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <XCircle className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Giao Dịch Thất Bại</h1>
            <p className="text-gray-400 mb-8">Có lỗi xảy ra hoặc bạn đã hủy giao dịch.</p>
            <div className="flex gap-4">
               <Link href="/" className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                 <Home className="w-5 h-5" /> Về Trang Chủ
               </Link>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
