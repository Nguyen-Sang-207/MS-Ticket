// Email service using Resend - replaces Spring Mail + RabbitMQ
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send booking confirmation email
export async function sendBookingConfirmation(params: {
  to: string;
  customerName: string;
  movieName: string;
  theaterName: string;
  date: string;
  startTime: string;
  seats: string[];
  totalAmount: number;
  qrCodeUrl: string;
  bookingId: string;
}): Promise<void> {
  await resend.emails.send({
    from: 'CineMe <noreply@cineme.app>',
    to: params.to,
    subject: `Xac nhan dat ve: ${params.movieName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 32px; border-radius: 12px;">
        <h1 style="color: #ff7218; text-align: center;">CineMe</h1>
        <h2 style="text-align: center;">Xac nhan dat ve thanh cong</h2>
        
        <div style="background: #16213e; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <p><strong>Ma dat ve:</strong> ${params.bookingId}</p>
          <p><strong>Phim:</strong> ${params.movieName}</p>
          <p><strong>Rap:</strong> ${params.theaterName}</p>
          <p><strong>Ngay:</strong> ${params.date}</p>
          <p><strong>Gio chieu:</strong> ${params.startTime}</p>
          <p><strong>Ghe:</strong> ${params.seats.join(', ')}</p>
          <p><strong>Tong tien:</strong> ${params.totalAmount.toLocaleString('vi-VN')} VND</p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <p>Ma QR Code cua ve:</p>
          <img src="${params.qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
        </div>
        
        <p style="text-align: center; color: #888; font-size: 12px;">
          Cam on ban da su dung dich vu cua CineMe!
        </p>
      </div>
    `,
  });
}

// Send OTP verification email
export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  customerName: string;
}): Promise<void> {
  await resend.emails.send({
    from: 'CineMe <noreply@cineme.app>',
    to: params.to,
    subject: 'Ma xac thuc OTP - CineMe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 32px; border-radius: 12px;">
        <h1 style="color: #ff7218; text-align: center;">CineMe</h1>
        <h2 style="text-align: center;">Ma xac thuc</h2>
        <p>Xin chao ${params.customerName},</p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="font-size: 48px; font-weight: bold; color: #ff7218; letter-spacing: 16px;">
            ${params.otp}
          </div>
        </div>
        <p style="color: #888;">Ma nay co hieu luc trong 5 phut. Khong chia se ma nay cho bat ky ai.</p>
      </div>
    `,
  });
}

export default resend;
