import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "MS Ticket - Hệ thống quản lý vé xem phim",
    template: "%s | MS Ticket",
  },
  description:
    "Hệ thống đặt vé xem phim trực tuyến hiện đại. Tìm kiếm phim, chọn ghế và đặt vé nhanh chóng tại MS Ticket.",
  keywords: ["cinema", "movie", "booking", "ticket", "phim", "dat ve", "MS Ticket"],
  openGraph: {
    title: "MS Ticket - Hệ thống quản lý vé xem phim",
    description: "Hệ thống đặt vé xem phim trực tuyến hiện đại tại MS Ticket.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // for iPhone notch safe areas
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#24221e] text-[#fefdfc]">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
