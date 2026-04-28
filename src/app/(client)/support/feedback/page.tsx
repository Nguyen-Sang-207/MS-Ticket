"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";
import { Mail, Phone, MapPin } from "lucide-react";

export default function FeedbackPage() {
  return (
    <PolicyLayout 
      title="Góp Ý & Phản Hồi" 
      subtitle="Chúng tôi luôn lắng nghe để hoàn thiện trải nghiệm điện ảnh của bạn."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-zinc-900 p-8 text-center border border-zinc-800 hover:border-blue-500 transition-colors">
          <Phone className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Hotline</h3>
          <p className="text-xl font-bold">1900 6688</p>
          <p className="text-[10px] text-zinc-500 mt-2">Hỗ trợ 24/7</p>
        </div>
        <div className="bg-zinc-900 p-8 text-center border border-zinc-800 hover:border-blue-500 transition-colors">
          <Mail className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Email</h3>
          <p className="text-sm font-bold">support@mscinema.vn</p>
          <p className="text-[10px] text-zinc-500 mt-2">Phản hồi trong 24h</p>
        </div>
        <div className="bg-zinc-900 p-8 text-center border border-zinc-800 hover:border-blue-500 transition-colors">
          <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Trụ sở chính</h3>
          <p className="text-xs font-bold leading-relaxed">Tầng 5, Tòa nhà MS Tower, 123 Lê Lợi, Quận 1, TP. Hồ Chí Minh</p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-blue-500 text-center">Gửi phản hồi cho chúng tôi</h2>
        <form className="bg-zinc-900 p-8 border border-zinc-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Họ và tên</label>
              <input type="text" className="w-full bg-black border border-zinc-800 p-3 text-sm focus:border-blue-500 outline-none transition-colors" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Số điện thoại</label>
              <input type="tel" className="w-full bg-black border border-zinc-800 p-3 text-sm focus:border-blue-500 outline-none transition-colors" placeholder="090 123 4567" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Chủ đề</label>
            <select className="w-full bg-black border border-zinc-800 p-3 text-sm focus:border-blue-500 outline-none transition-colors">
              <option>Chất lượng phục vụ</option>
              <option>Chất lượng phòng chiếu</option>
              <option>Góp ý về ứng dụng/website</option>
              <option>Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Nội dung phản hồi</label>
            <textarea className="w-full bg-black border border-zinc-800 p-3 text-sm focus:border-blue-500 outline-none transition-colors h-32 resize-none" placeholder="Nhập nội dung góp ý tại đây..."></textarea>
          </div>
          <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 uppercase tracking-[0.2em] text-xs transition-colors">
            Gửi phản hồi
          </button>
        </form>
      </section>
    </PolicyLayout>
  );
}
