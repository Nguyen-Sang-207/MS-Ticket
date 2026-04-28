"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";

export default function CinemaRulesPage() {
  return (
    <PolicyLayout 
      title="Quy Định Tại Rạp" 
      subtitle="Vui lòng tuân thủ các quy định để đảm bảo không gian điện ảnh văn minh."
    >
      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-red-500">1. Quy định về phân loại độ tuổi</h2>
        <p className="mb-4">MS Cinema áp dụng nghiêm ngặt các quy chuẩn phân loại phim theo độ tuổi của Bộ Văn hóa, Thể thao và Du lịch:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-green-500 font-bold block mb-1">P (Phổ biến)</span>
            <span className="text-xs text-zinc-500">Phim được phép phổ biến đến mọi lứa tuổi.</span>
          </div>
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-yellow-500 font-bold block mb-1">K (Dưới 13 kèm người giám hộ)</span>
            <span className="text-xs text-zinc-500">Phim được phổ biến đến người xem dưới 13 tuổi với điều kiện xem cùng cha, mẹ hoặc người giám hộ.</span>
          </div>
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-orange-500 font-bold block mb-1">T13 (13+)</span>
            <span className="text-xs text-zinc-500">Phim phổ biến đến người xem từ đủ 13 tuổi trở lên.</span>
          </div>
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-red-500 font-bold block mb-1">T16 (16+)</span>
            <span className="text-xs text-zinc-500">Phim phổ biến đến người xem từ đủ 16 tuổi trở lên.</span>
          </div>
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-red-600 font-bold block mb-1">T18 (18+)</span>
            <span className="text-xs text-zinc-500">Phim phổ biến đến người xem từ đủ 18 tuổi trở lên.</span>
          </div>
          <div className="bg-zinc-900 p-4 border border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">C (Cấm phổ biến)</span>
            <span className="text-xs text-zinc-500">Phim không được phép phổ biến.</span>
          </div>
        </div>
        <p className="mt-4 italic text-sm text-zinc-500">* Khách hàng vui lòng mang theo giấy tờ tùy thân có ảnh để xác minh độ tuổi khi cần thiết.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-red-500">2. Quy định an ninh và Bản quyền</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Nghiêm cấm mọi hành vi sử dụng thiết bị ghi hình (điện thoại, máy quay...) để ghi lại nội dung phim dưới mọi hình thức. Mọi hành vi vi phạm sẽ được chuyển giao cho cơ quan chức năng xử lý theo Luật Sở hữu trí tuệ.</li>
          <li>Hệ thống Camera giám sát (CCTV) hoạt động 24/7 tại khu vực sảnh và trong phòng chiếu để đảm bảo an ninh.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-red-500">3. Nội quy phòng chiếu</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Không mang thức ăn, đồ uống từ bên ngoài vào rạp.</li>
          <li>Không hút thuốc (kể cả thuốc lá điện tử) trong toàn bộ khuôn viên rạp.</li>
          <li>Hạn chế gây ồn, giữ gìn vệ sinh chung và không gác chân lên ghế phía trước.</li>
          <li>Vui lòng chuyển điện thoại sang chế độ rung hoặc im lặng khi phim bắt đầu.</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
