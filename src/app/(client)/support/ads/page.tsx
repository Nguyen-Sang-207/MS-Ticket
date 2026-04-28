"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";
import { Monitor, Layout, Megaphone, Zap } from "lucide-react";

export default function AdvertisingPage() {
  const services = [
    { 
      title: "Quảng cáo Màn hình lớn", 
      desc: "Phát sóng TVC quảng cáo trước khi phim bắt đầu. Tiếp cận khách hàng trong không gian tập trung tối đa.",
      icon: Monitor,
      color: "text-blue-500"
    },
    { 
      title: "Quảng cáo khu vực Sảnh", 
      desc: "Đặt Standee, Booth trải nghiệm hoặc quảng cáo trên hệ thống màn hình LCD tại khu vực sảnh chờ.",
      icon: Layout,
      color: "text-purple-500"
    },
    { 
      title: "Tổ chức Sự kiện / Thuê rạp", 
      desc: "Thuê trọn phòng chiếu cho các buổi hội thảo, ra mắt sản phẩm hoặc tổ chức sinh nhật, tỏ tình riêng tư.",
      icon: Megaphone,
      color: "text-orange-500"
    },
    { 
      title: "Hợp tác thương hiệu", 
      desc: "Triển khai các chương trình khuyến mãi chéo (Cross-promotion) trên website, app và tại rạp.",
      icon: Zap,
      color: "text-yellow-500"
    },
  ];

  return (
    <PolicyLayout 
      title="Liên Hệ Quảng Cáo" 
      subtitle="Đưa thương hiệu của bạn tiếp cận hàng triệu khán giả yêu điện ảnh mỗi tháng."
    >
      <section className="mb-16">
        <p className="text-lg leading-relaxed text-zinc-400 mb-8">
          MS Cinema cung cấp các giải pháp quảng cáo đa dạng, giúp thương hiệu kết nối với khách hàng mục tiêu một cách ấn tượng và hiệu quả nhất trong không gian giải trí đẳng cấp.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((item, i) => (
            <div key={i} className="bg-zinc-900/50 p-8 border border-zinc-800 hover:bg-zinc-900 transition-all group">
              <item.icon className={`w-10 h-10 ${item.color} mb-6 group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 p-12 text-center border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Bạn đang quan tâm đến việc hợp tác?</h2>
        <p className="text-blue-100 mb-8 max-w-lg mx-auto">Vui lòng liên hệ trực tiếp với bộ phận Marketing & Partnership để nhận báo giá chi tiết và các gói ưu đãi mới nhất.</p>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 text-white">
          <div>
            <span className="block text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Điện thoại</span>
            <span className="text-xl font-black">0909 123 789</span>
          </div>
          <div className="hidden md:block w-px bg-white/20"></div>
          <div>
            <span className="block text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Email Partnership</span>
            <span className="text-xl font-black">ads@mscinema.vn</span>
          </div>
        </div>
      </section>

      <section className="mt-16 text-sm text-zinc-500 italic text-center">
        * MS Cinema cam kết mang lại các giải pháp quảng cáo sáng tạo, tuân thủ quy định pháp luật và tôn trọng trải nghiệm người xem.
      </section>
    </PolicyLayout>
  );
}
