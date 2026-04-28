"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";
import { Briefcase, Users, Star, Award, MapPin } from "lucide-react";

export default function RecruitmentPage() {
  const jobs = [
    { title: "Nhân viên Phục vụ Rạp (Part-time/Full-time)", location: "Toàn quốc", type: "Dịch vụ khách hàng" },
    { title: "Quản lý Ca (Shift Supervisor)", location: "Hồ Chí Minh/Hà Nội", type: "Quản lý" },
    { title: "Chuyên viên Marketing & Sự kiện", location: "Trụ sở chính (Hồ Chí Minh)", type: "Văn phòng" },
    { title: "Kỹ thuật viên Vận hành Máy chiếu", location: "Đà Nẵng/Cần Thơ", type: "Kỹ thuật" },
  ];

  return (
    <PolicyLayout 
      title="Cơ Hội Nghề Nghiệp" 
      subtitle="Gia nhập đội ngũ MS Cinema để cùng tạo nên những khoảnh khắc điện ảnh kỳ diệu."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="flex gap-4 p-6 bg-zinc-900 border border-zinc-800">
          <Star className="w-8 h-8 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Môi trường chuyên nghiệp</h3>
            <p className="text-xs text-zinc-500">Làm việc tại hệ thống rạp hiện đại nhất Việt Nam với quy trình chuẩn quốc tế.</p>
          </div>
        </div>
        <div className="flex gap-4 p-6 bg-zinc-900 border border-zinc-800">
          <Users className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Đồng đội năng động</h3>
            <p className="text-xs text-zinc-500">Gặp gỡ và làm việc cùng những người trẻ đam mê điện ảnh và dịch vụ tận tâm.</p>
          </div>
        </div>
        <div className="flex gap-4 p-6 bg-zinc-900 border border-zinc-800">
          <Award className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Phúc lợi hấp dẫn</h3>
            <p className="text-xs text-zinc-500">Mức lương cạnh tranh, lộ trình thăng tiến rõ ràng và xem phim miễn phí hàng tháng.</p>
          </div>
        </div>
        <div className="flex gap-4 p-6 bg-zinc-900 border border-zinc-800">
          <Briefcase className="w-8 h-8 text-purple-500 shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Đào tạo bài bản</h3>
            <p className="text-xs text-zinc-500">Được đào tạo kỹ năng giao tiếp, xử lý tình huống và kiến thức chuyên môn về điện ảnh.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-8 uppercase tracking-wider text-blue-500 border-l-4 border-blue-500 pl-4">Vị trí đang tuyển dụng</h2>
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="bg-zinc-900 p-6 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-500 transition-colors">
              <div>
                <h3 className="font-bold text-white text-lg mb-1">{job.title}</h3>
                <div className="flex gap-4 text-xs text-zinc-500 font-medium items-center">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-blue-500" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3 text-purple-500" /> {job.type}</span>
                </div>
              </div>
              <button className="bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Ứng tuyển ngay
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 text-center bg-zinc-900 p-12 border border-zinc-800 border-dashed">
        <h2 className="text-lg font-bold text-white mb-4">Chưa tìm thấy vị trí phù hợp?</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">Hãy gửi CV của bạn về email <span className="text-white font-bold">tuyendung@mscinema.vn</span>, chúng tôi sẽ liên hệ khi có cơ hội mới.</p>
        <div className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-600">MS Cinema Human Resources</div>
      </section>
    </PolicyLayout>
  );
}
