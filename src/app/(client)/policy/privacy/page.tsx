"use client";

import PolicyLayout from "@/app/(client)/policy/PolicyLayout";

export default function PrivacyPage() {
  return (
    <PolicyLayout 
      title="Chính Sách Bảo Mật" 
      subtitle="Bảo vệ quyền lợi và dữ liệu của khách hàng là ưu tiên hàng đầu của MS Cinema."
    >
      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-green-500">1. Mục đích thu thập thông tin</h2>
        <p>
          MS Cinema thu thập thông tin cá nhân của khách hàng nhằm:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Xác nhận và quản lý các giao dịch đặt vé trực tuyến.</li>
          <li>Cung cấp mã vé và các thông báo liên quan đến suất chiếu.</li>
          <li>Chăm sóc khách hàng, giải quyết các khiếu nại hoặc tranh chấp.</li>
          <li>Gửi thông tin ưu đãi, khuyến mãi độc quyền cho thành viên (nếu khách hàng đồng ý).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-green-500">2. Phạm vi thu thập</h2>
        <p>
          Các thông tin chúng tôi thu thập bao gồm: Họ và tên, Số điện thoại, Địa chỉ Email, Ngày sinh (để tặng ưu đãi sinh nhật) và Lịch sử giao dịch. Chúng tôi KHÔNG lưu trữ thông tin thẻ tín dụng hoặc tài khoản ngân hàng của khách hàng trên hệ thống.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-green-500">3. Thời gian lưu trữ</h2>
        <p>
          Dữ liệu cá nhân của khách hàng sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ từ phía khách hàng hoặc MS Cinema không còn nhu cầu sử dụng để cung cấp dịch vụ. Trong mọi trường hợp, thông tin sẽ được bảo mật trên máy chủ của MS Cinema.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-green-500">4. Cam kết bảo mật</h2>
        <p>
          Chúng tôi cam kết không bán, chia sẻ hay trao đổi thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại. Thông tin chỉ được tiết lộ cho cơ quan chức năng khi có yêu cầu bằng văn bản theo quy định của pháp luật Việt Nam.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider text-green-500">5. Quyền của khách hàng</h2>
        <p>
          Quý khách có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào thông qua phần "Thông tin cá nhân" trên Website/Ứng dụng hoặc liên hệ trực tiếp với bộ phận hỗ trợ của chúng tôi.
        </p>
      </section>
    </PolicyLayout>
  );
}
