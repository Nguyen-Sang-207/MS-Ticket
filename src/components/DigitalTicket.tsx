import React from "react";
import { MapPin } from "lucide-react";

interface TicketProps {
  movieNameVn: string;
  format?: string;
  time?: number;
  theaterName: string;
  date: string;
  startTime: string;
  roomName: string;
  seats: string;
  totalAmount: number;
  qrCode?: string;
  bookingId?: string;
}

export default function DigitalTicket({
  movieNameVn,
  format = "2D",
  time = 120,
  theaterName,
  date,
  startTime,
  roomName,
  seats,
  totalAmount,
  qrCode,
  bookingId
}: TicketProps) {
  return (
    <div className="bg-[#FAF8F5] text-[#1E1C18] rounded-md overflow-hidden shadow-2xl flex flex-col font-mono text-sm leading-relaxed border-t-[8px] border-blue-600 relative p-6 md:p-8 w-full max-w-sm mx-auto">
      {/* Receipt Notch Decorators */}
      <div className="absolute left-0 top-1/3 w-4 h-8 bg-[#09090b] rounded-r-full -translate-y-1/2"></div>
      <div className="absolute right-0 top-1/3 w-4 h-8 bg-[#09090b] rounded-l-full -translate-y-1/2"></div>
      
      {/* Receipt Header */}
      <h2 className="text-center font-bold text-lg uppercase tracking-[0.2em] mb-4 border-b-2 border-dashed border-[#1E1C18]/20 pb-4">
         E-Ticket
      </h2>
      
      {/* Movie Info */}
      <div className="border-b-2 border-dashed border-[#1E1C18]/20 pb-6 mb-6 mt-2 relative z-0">
         <h3 className="font-bold text-xl uppercase leading-tight line-clamp-2">{movieNameVn}</h3>
         <div className="mt-2 text-xs uppercase tracking-widest font-semibold text-blue-700 bg-blue-100 inline-block px-1.5 py-0.5 rounded-sm">
           {format} • {time} M
         </div>
      </div>
      
      {/* Details table */}
      <div className="space-y-4 border-b-2 border-dashed border-[#1E1C18]/20 pb-6 mb-6">
         <div>
            <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Rạp / Cinema</div>
            <div className="font-semibold flex items-center gap-1.5">
               <MapPin className="w-3 h-3 text-[#1E1C18]/60" /> 
               {theaterName || 'MS Cinema'}
            </div>
         </div>
         
         <div className="flex gap-6">
            <div>
               <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Ngày / Date</div>
               <div className="font-semibold">{date}</div>
            </div>
            <div>
               <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Giờ / Time</div>
               <div className="font-semibold">{startTime}</div>
            </div>
         </div>

         <div>
            <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Phòng / Room</div>
            <div className="font-semibold">{roomName}</div>
         </div>

         <div>
            <div className="text-[10px] text-[#1E1C18]/60 uppercase tracking-widest font-bold mb-0.5">Ghế / Seat(s)</div>
            <div className="font-semibold text-lg">{seats}</div>
         </div>
      </div>

      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center mb-6">
         <div className="bg-white p-2 border border-zinc-200 shadow-sm rounded-sm mb-2">
            {qrCode ? (
               <img src={qrCode} alt="Ticket QR Code" className="w-32 h-32 object-contain mix-blend-multiply" />
            ) : (
               <div className="w-32 h-32 flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs">Generating QR...</div>
            )}
         </div>
         {bookingId && (
            <div className="text-[10px] font-mono tracking-widest text-[#1E1C18]/60">ID: {bookingId.split('-')[0].toUpperCase()}</div>
         )}
      </div>

      {/* Total Display */}
      <div className="mt-auto pt-4 border-t-2 border-dashed border-[#1E1C18]/20 flex justify-between items-end">
         <span className="font-bold text-sm">ĐÃ THANH TOÁN</span>
         <span className="text-xl tracking-tighter font-bold">{totalAmount.toLocaleString('vi-VN')} đ</span>
      </div>
    </div>
  );
}
