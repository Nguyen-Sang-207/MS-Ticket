import Link from "next/link";

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`w-full py-16 bg-[#09090b] border-t border-white/5 text-zinc-400 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="inline-flex flex-col drop-shadow-md hover:opacity-80 transition-opacity flex-none notranslate translate-no mb-6">
            <span className="text-4xl font-sans font-black text-blue-500 leading-none tracking-tighter">MS</span>
            <span className="text-[9px] font-sans font-bold text-white tracking-[0.25em] leading-none mt-1 ml-0.5">TICKET</span>
          </Link>
          <p className="text-sm font-medium leading-relaxed max-w-sm">
            Hệ thống rạp chiếu phim đẳng cấp nhất với công nghệ tiên tiến, mang lại trải nghiệm điện ảnh chân thật và sống động tuyệt đối.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Chính Sách</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/policy/terms" className="hover:text-blue-500 transition-colors">Điều khoản hệ thống</Link></li>
            <li><Link href="/policy/privacy" className="hover:text-blue-500 transition-colors">Bảo mật thông tin</Link></li>
            <li><Link href="/policy/rules" className="hover:text-blue-500 transition-colors">Quy định rạp</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Hỗ Trợ</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/support/feedback" className="hover:text-blue-500 transition-colors">Góp ý & Phản hồi</Link></li>
            <li><Link href="/support/careers" className="hover:text-blue-500 transition-colors">Tuyển dụng</Link></li>
            <li><Link href="/support/ads" className="hover:text-blue-500 transition-colors">Liên hệ quảng cáo</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} MS Ticket Ecosystem. All rights reserved.</p>
      </div>
    </footer>
  );
}
