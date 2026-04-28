"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Film, Users, CalendarDays, Ticket,
  MapPin, Coffee, Tags, DoorOpen, DollarSign, UserSquare, Brain, FlaskConical, Menu, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isMasterAdmin } from "@/lib/masterConfig";
import SandboxBanner from "@/components/SandboxBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isMaster = isMasterAdmin(user?.email);
  const isSandbox = !!user && !isMaster;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to home if not authenticated after loading completes
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  const menuSections = [
    {
      title: "Tổng quan",
      items: [
        { name: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
      ]
    },
    {
      title: "Nội dung",
      items: [
        { name: "Phim", path: "/admin/movies", icon: <Film className="w-4 h-4" /> },
        { name: "Diễn viên", path: "/admin/actors", icon: <UserSquare className="w-4 h-4" /> },
      ]
    },
    {
      title: "Vận hành",
      items: [
        { name: "Suất chiếu", path: "/admin/showtimes", icon: <CalendarDays className="w-4 h-4" /> },
        { name: "AI Lịch chiếu", path: "/admin/ai-schedule", icon: <Brain className="w-4 h-4" /> },
        { name: "Hệ thống rạp", path: "/admin/theaters", icon: <MapPin className="w-4 h-4" /> },
        { name: "Giá vé", path: "/admin/pricing", icon: <DollarSign className="w-4 h-4" /> },
        { name: "Combos", path: "/admin/combos", icon: <Coffee className="w-4 h-4" /> },
      ]
    },
    {
      title: "Quản lý",
      items: [
        { name: "Đặt vé", path: "/admin/bookings", icon: <Ticket className="w-4 h-4" /> },
        { name: "Khách", path: "/admin/users", icon: <Users className="w-4 h-4" /> },
        { name: "Khuyến mãi", path: "/admin/promotions", icon: <Tags className="w-4 h-4" /> },
      ]
    },
  ];


  // Show loading while Firebase Auth initializes
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Xác thực...</p>
      </div>
    </div>
  );

  // Not logged in — redirect happens via useEffect, show nothing
  if (!user) return null;

  // Any logged-in user can enter admin (non-master = sandbox mode)
  // No 403 block - sandbox mode handles write protection automatically

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-white selection:text-black">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Desktop fixed, Mobile drawer */}
      <aside className={`
        fixed md:relative z-[160] md:z-auto
        w-64 bg-[#09090b] border-r border-zinc-800 flex flex-col overflow-y-auto flex-shrink-0 hide-scrollbar pt-6 pb-6
        h-full
        transition-transform duration-300 ease-out md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Block */}
        <div className="px-6 mb-8 flex items-end gap-3">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex flex-col flex-none notranslate" translate="no">
            <span className="text-4xl font-black text-blue-500 leading-none tracking-tighter hover:opacity-80 transition-opacity">MS</span>
            <span className="text-[10px] font-bold text-white tracking-[0.25em] leading-none mt-1 ml-0.5">TICKET</span>
          </Link>
          <div className="pb-1">
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Hệ Thống</div>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 mb-10">
           <div className="flex items-center gap-3 border border-zinc-800 p-2.5">
             <div className="w-7 h-7 bg-zinc-800 text-white flex items-center justify-center font-bold text-xs uppercase">
               {user.fullName?.charAt(0)}
             </div>
             <div className="min-w-0">
               <div className="text-white font-bold text-[10px] uppercase tracking-wider truncate">{user.fullName}</div>
               <div className={`text-[8px] font-bold tracking-[0.2em] uppercase mt-0.5 ${isSandbox ? 'text-blue-400' : 'text-zinc-500'}`}>
                 {isSandbox ? 'Sandbox Mode' : 'Master Admin'}
               </div>
             </div>
             {isSandbox && (
               <div title="Sandbox Mode: Changes saved locally only">
                 <FlaskConical className="w-3.5 h-3.5 text-blue-400 flex-none" />
               </div>
             )}
           </div>
           {isSandbox && (
             <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed px-0.5">
               Chế độ Demo — Mọi thay đổi chỉ lưu trên máy bạn.
             </p>
           )}
        </div>

        {/* Navigation Modules */}
        <nav className="flex-1 px-4 space-y-8">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 px-2 flex items-center gap-2">
                 <span className="w-2 h-px bg-zinc-700"></span> {section.title}
              </p>
              <div className="flex flex-col space-y-0.5">
                {section.items.map(item => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-semibold tracking-wider transition-colors relative group ${
                        isActive
                          ? "text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white"></div>}
                      <span className={`${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"}`}>{item.icon}</span>
                      <span className="mt-0.5 uppercase">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System Exit */}
        <div className="px-6 mt-auto pt-6 flex flex-col">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors">
            <DoorOpen className="w-4 h-4" /> Thoát Hệ Thống
          </Link>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-auto bg-[#09090b]">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-[#09090b] sticky top-0 z-[100]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm tracking-wide">Admin Panel</span>
        </div>
        <div className="p-4 sm:p-6 md:p-10 max-w-[1400px] mx-auto min-h-full">
          {children}
        </div>
      </main>

      {/* Sandbox Banner */}
      <SandboxBanner />
    </div>
  );
}
