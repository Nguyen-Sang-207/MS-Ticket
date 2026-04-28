# MS Ticket - Cinema Ticketing Platform

MS Ticket là một ứng dụng đặt vé xem phim hiện đại, tập trung vào trải nghiệm người dùng trên thiết bị di động (mobile-first) với thiết kế cao cấp và hiệu năng tối ưu. Dự án được phát triển bằng Next.js 16 và tích hợp hệ thống Firebase.

## 🌟 Tính năng nổi bật

### 📱 Trải nghiệm Người dùng (Client)
- **Thiết kế Mobile-First**: Giao diện responsive hoàn hảo, mượt mà trên mọi thiết bị.
- **Hero Carousel**: Banner phim nổi bật với hiệu ứng chuyển cảnh Cinematic.
- **Đặt vé thông minh**: Quy trình chọn ghế (Seat Map) trực quan, hỗ trợ khóa ghế thời gian thực qua Firebase RTDB.
- **E-Ticket**: Hệ thống vé điện tử với mã QR, tích hợp lưu trữ lịch sử đặt vé trong hồ sơ cá nhân.
- **Tìm kiếm & Lọc**: Tìm kiếm phim nhanh chóng, lọc lịch chiếu theo ngày và rạp.
- **Sandbox Mode**: Chế độ khách cho phép trải nghiệm đầy đủ tính năng admin/đặt vé mà không ảnh hưởng đến database thật (lưu trữ local).

### 🛠 Quản trị (Admin Dashboard)
- **Quản lý Phim**: Import dữ liệu phim tự động từ TMDB API.
- **Quản lý Suất chiếu**: Giao diện quản lý suất chiếu chuyên nghiệp, hỗ trợ lọc và sắp xếp thông minh.
- **Quản lý Rạp & Phòng**: Hệ thống quản lý đa rạp, đa phòng chiếu.
- **Thống kê**: Theo dõi số lượng vé và doanh thu (đang phát triển).

## 🚀 Công nghệ sử dụng

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) với Turbopack.
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking).
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) icons.
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Realtime Database, Admin SDK).
- **Hình ảnh**: [Cloudinary](https://cloudinary.com/) API.
- **Email**: [Resend](https://resend.com/).
- **Dữ liệu phim**: [TMDB API](https://www.themoviedb.org/documentation/api).
- **Deployment**: [Vercel](https://vercel.com/).

## 🛠 Hướng dẫn cài đặt

1. **Clone repository**:
   ```bash
   git clone https://github.com/Nguyen-Sang-207/MS-Ticket.git
   cd MS-Ticket
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Tạo file `.env.local` tại thư mục gốc và cấu hình các thông số sau:
   - Firebase Client & Admin SDK Keys
   - Cloudinary Credentials
   - Resend API Key
   - TMDB API Key

4. **Chạy ứng dụng ở chế độ development**:
   ```bash
   npm run dev
   ```
   Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

## 📦 Triển khai (Deployment)

Dự án được tối ưu hóa để triển khai trên **Vercel**. 
*Lưu ý*: Khi deploy, hãy đảm bảo đã thêm đầy đủ các biến môi trường trong phần **Project Settings > Environment Variables** và cấp quyền (Whitelist) cho domain của bạn trong **Firebase Console > Authentication > Settings**.

## 📝 Giấy phép

Dự án được phát triển bởi **Nguyen-Sang-207**.

---
*Tự hào được xây dựng với mục tiêu mang lại trải nghiệm xem phim tốt nhất cho người Việt.*
