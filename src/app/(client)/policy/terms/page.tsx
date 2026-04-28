"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";

export default function TermsPage() {
  return (
    <PolicyLayout 
      title="Điều Khoản Hệ Thống" 
      subtitle="Cập nhật lần cuối: Tháng 04/2026"
    >
      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-blue-500">1. Chấp nhận các điều khoản</h2>
        <p>
          Bằng việc truy cập và sử dụng hệ thống đặt vé trực tuyến MS Cinema (bao gồm Website và Ứng dụng di động), khách hàng mặc nhiên đồng ý tuân thủ các điều khoản và điều kiện sử dụng được quy định tại đây. Nếu quý khách không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ của chúng tôi.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-blue-500">2. Tài khoản thành viên</h2>
        <p>
          Khách hàng có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. MS Cinema không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc khách hàng không bảo mật thông tin cá nhân. Chúng tôi có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện các hành vi gian lận hoặc vi phạm chính sách của hệ thống.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-blue-500">3. Quy định giao dịch và Thanh toán</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Giá vé hiển thị trên hệ thống là giá vé đã bao gồm VAT.</li>
          <li>Giao dịch chỉ được xem là thành công khi khách hàng nhận được thông báo xác nhận và Mã vé (Booking Code) qua Email hoặc tin nhắn SMS/App.</li>
          <li>Khách hàng có trách nhiệm kiểm tra kỹ các thông tin về phim, rạp, suất chiếu và loại ghế trước khi tiến hành thanh toán.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-blue-500">4. Chính sách hoàn tiền và Hủy vé</h2>
        <div className="bg-zinc-900/50 border-l-4 border-yellow-500 p-4 italic">
          <p className="text-yellow-500 font-bold mb-2">Lưu ý quan trọng:</p>
          <p>MS Cinema không hỗ trợ đổi trả hoặc hoàn tiền cho các vé đã giao dịch thành công. Quý khách vui lòng cân nhắc kỹ trước khi thực hiện thanh toán.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-blue-500">5. Quyền sở hữu trí tuệ</h2>
        <p>
          Toàn bộ nội dung trên hệ thống bao gồm văn bản, hình ảnh, đồ họa, logo và video đều thuộc quyền sở hữu của MS Cinema hoặc bên thứ ba cấp phép. Mọi hành vi sao chép, trích dẫn mà không có sự đồng ý bằng văn bản của MS Cinema đều bị nghiêm cấm.
        </p>
      </section>
    </PolicyLayout>
  );
}
