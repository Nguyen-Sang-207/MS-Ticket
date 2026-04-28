"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Film, Search, Award, X, Menu, Clock, Tag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, firebaseUser, logout, signInWithGoogle } = useAuth();

  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [scrolled, setScrolled] = useState(false);
  const [showPanel, setShowPanel] = useState(false); // unified menu + account panel for mobile
  const [showUserDropdown, setShowUserDropdown] = useState(false); // desktop only
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [imgError, setImgError] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const browserLang = navigator.language || "vi";
    setLang(browserLang.startsWith("vi") ? "vi" : "en");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setShowUserDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchFocused(false); setSuggestions([]); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setImgError(false); }, [user?.id]);

  useEffect(() => {
    document.body.style.overflow = showPanel ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPanel]);

  // Close panel on route change
  useEffect(() => { setShowPanel(false); }, [pathname]);

  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (!searchTerm.trim() || searchTerm.length < 2) { setSuggestions([]); return; }
    suggestDebounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/movies?limit=50`);
        const data = await res.json();
        if (data.statusCode === 200) {
          const term = searchTerm.toLowerCase();
          setSuggestions((data.data || []).filter((m: any) =>
            m.nameVn?.toLowerCase().includes(term) || m.nameEn?.toLowerCase().includes(term)
          ).slice(0, 6));
        }
      } catch { /* silent */ }
      setLoadingSuggestions(false);
    }, 280);
  }, [searchTerm]);

  const handleLogout = async () => { await logout(); setShowUserDropdown(false); setShowPanel(false); router.push("/"); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) { router.push(`/movies?search=${encodeURIComponent(searchTerm)}`); setSearchFocused(false); setSuggestions([]); }
  };
  const handleSelectSuggestion = (movie: any) => { router.push(`/film-detail/${movie.id}`); setSearchTerm(""); setSuggestions([]); setSearchFocused(false); };

  const TEXT = {
    vi: { phim: "Phim", lichchieu: "Lịch Chiếu", uudai: "Khuyến Mãi", hangthe: "Thành Viên", search: "Tìm phim...", login: "Đăng nhập" },
    en: { phim: "Movies", lichchieu: "Showtimes", uudai: "Promotions", hangthe: "Membership", search: "Search...", login: "Sign In" },
  }[lang];

  const displayAvatar = firebaseUser?.photoURL || user?.avatar;
  const navLinks = [
    { href: '/movies', label: TEXT.phim, icon: <Film className="w-5 h-5" /> },
    { href: '/showtimes', label: TEXT.lichchieu, icon: <Clock className="w-5 h-5" /> },
    { href: '/promotions', label: TEXT.uudai, icon: <Tag className="w-5 h-5" /> },
    { href: '/membership', label: TEXT.hangthe, icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <>
      <nav className={`w-full flex items-center justify-between fixed top-0 left-0 z-[90] px-4 sm:px-6 md:px-12 transition-all duration-500 ${scrolled ? "bg-[#09090b]/90 backdrop-blur-xl border-b border-white/5 py-3 md:py-4" : "bg-gradient-to-b from-black/70 to-transparent py-5 md:py-8"} text-white`}>

        {/* LEFT: Logo + Desktop Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex flex-col drop-shadow-md hover:opacity-80 transition-opacity flex-none" translate="no">
            <span className="text-3xl md:text-4xl font-black text-blue-500 leading-none tracking-tighter">MS</span>
            <span className="text-[7px] md:text-[9px] font-bold text-white tracking-[0.25em] leading-none mt-1 ml-0.5 uppercase">TICKET</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden xl:flex gap-10 font-semibold text-[11px] tracking-[0.2em] uppercase text-zinc-400">
            {navLinks.map(link => (
              <li key={link.href} className="relative group cursor-pointer">
                <Link href={link.href} className="hover:text-white transition-colors duration-300">{link.label}</Link>
                <span className="absolute -bottom-1.5 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-out group-hover:w-full" />
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT: Search (desktop) + Account/Menu (both) */}
        <div className="flex items-center gap-3 md:gap-6">

          {/* ---- SEARCH ---- */}
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearch} className={`flex items-center border-b transition-all duration-400 py-1.5 gap-1.5 md:gap-2 ${searchFocused ? "w-[160px] sm:w-64 border-white" : "w-6 md:w-44 border-transparent md:border-white/20 md:hover:border-white/50"}`}>
              <Search 
                 className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-none transition-colors cursor-pointer ${searchFocused ? "text-white" : "text-white md:text-zinc-500"}`} 
                 onClick={() => {
                   setSearchFocused(true);
                   setTimeout(() => document.getElementById('nav-search-input')?.focus(), 50);
                 }}
              />
              <input
                id="nav-search-input"
                onFocus={() => setSearchFocused(true)}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                type="text"
                placeholder={TEXT.search}
                className={`bg-transparent border-none focus:outline-none text-[11px] font-medium tracking-wide placeholder:text-zinc-600 text-white transition-all ${searchFocused ? "w-full opacity-100 px-1" : "w-0 opacity-0 md:w-full md:opacity-100 md:px-0"}`}
              />
              {searchTerm && <button type="button" onClick={() => { setSearchTerm(""); setSuggestions([]); }} className="flex-none text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>}
            </form>

            {/* Search suggestions */}
            {searchFocused && searchTerm.length >= 2 && (
              <div className="fixed top-[72px] left-4 right-4 md:absolute md:top-full md:left-0 md:right-auto md:mt-3 bg-[#0a0a0c] border border-zinc-800 shadow-2xl z-[100] md:w-auto md:min-w-[350px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingSuggestions ? (
                  <div className="px-4 py-6 text-[11px] text-zinc-500 text-center tracking-widest uppercase font-medium">Đang tìm...</div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-zinc-800/50 bg-[#09090b] sticky top-0 z-10"><span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Kết quả gợi ý</span></div>
                    {suggestions.map(movie => (
                      <button key={movie.id} onMouseDown={() => handleSelectSuggestion(movie)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors text-left group border-b border-white/5 last:border-none">
                        <div className="w-9 h-12 bg-zinc-900 flex-none overflow-hidden border border-white/5">
                          {movie.image && <img src={movie.image} alt={movie.nameVn} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="text-[12px] font-bold text-white truncate leading-tight group-hover:text-blue-400 transition-colors">{movie.nameVn}</div>
                          {movie.nameEn && movie.nameEn !== movie.nameVn && <div className="text-[10px] text-zinc-500 truncate mt-0.5">{movie.nameEn}</div>}
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                            <span className="text-white/80">{movie.format || '2D'}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-zinc-600"></span>
                            <span>{movie.time || 120} phút</span>
                          </div>
                        </div>
                        <span className={`hidden sm:block text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 flex-none ${movie.status === 'NOW_SHOWING' ? 'text-blue-400 border border-blue-400/30 bg-blue-400/5' : 'text-zinc-500 border border-zinc-700 bg-zinc-800/20'}`}>
                          {movie.status === 'NOW_SHOWING' ? 'Tại Rạp' : 'Sắp Chiếu'}
                        </span>
                      </button>
                    ))}
                    <button onMouseDown={() => { router.push(`/movies?search=${encodeURIComponent(searchTerm)}`); setSearchFocused(false); setSuggestions([]); }} className="w-full px-4 py-3 border-t border-zinc-800/50 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-center tracking-widest uppercase font-bold">
                      Xem tất cả kết quả cho "{searchTerm}"
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <div className="text-[11px] text-zinc-400 font-medium mb-1">Không tìm thấy phim nào</div>
                    <div className="text-[10px] text-zinc-600">cho từ khoá "{searchTerm}"</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- DESKTOP USER DROPDOWN ---- */}
          {user ? (
            <div className="relative hidden md:block" ref={userDropdownRef}>
              <button onClick={() => setShowUserDropdown(v => !v)} className="flex items-center gap-3 group focus:outline-none">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white group-hover:text-zinc-300 transition-colors uppercase tracking-widest">{user.fullName || "Tài khoản"}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-medium tracking-widest mt-0.5">MS Member</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-colors overflow-hidden">
                  {displayAvatar && !imgError ? (
                    <img src={displayAvatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
                  ) : (
                    <span className="font-bold text-white text-xs">{user.fullName?.[0].toUpperCase()}</span>
                  )}
                </div>
              </button>
              <div className={`absolute right-0 mt-6 w-64 bg-[#0a0a0c] border border-zinc-800/80 shadow-2xl z-50 p-2 transition-all duration-300 origin-top-right ${showUserDropdown ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0 pointer-events-none'}`}>
                <div className="px-4 py-4 mb-2 border-b border-zinc-900/50">
                  <div className="font-bold text-white text-[11px] uppercase tracking-widest">{user.fullName}</div>
                  <div className="text-[10px] text-zinc-600 font-mono mt-1">{user.email}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setShowUserDropdown(false); router.push('/profile'); }} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-colors flex items-center gap-3">
                    <Award className="w-3.5 h-3.5" /> Hạng Thành Viên
                  </button>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => { setShowUserDropdown(false); router.push('/admin'); }} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-colors flex items-center gap-3">
                      <Film className="w-3.5 h-3.5" /> Quản Trị Viên
                    </button>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-colors flex items-center gap-3 mt-2 border-t border-zinc-900/50 pt-4">
                    <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button className="hidden md:block px-6 py-2.5 border border-white text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors" onClick={signInWithGoogle}>
              {TEXT.login}
            </button>
          )}

          {/* ---- MOBILE: Single menu button ---- */}
          <button
            onClick={() => setShowPanel(true)}
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </nav>

      {/* ===== MOBILE FULL-SCREEN PANEL (Menu + Account combined) ===== */}
      <div className={`fixed inset-0 z-[200] md:hidden transition-all duration-300 ${showPanel ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showPanel ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowPanel(false)} />

        {/* Panel slides in from right */}
        <div className={`absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-[#09090b] border-l border-zinc-800/80 flex flex-col transition-transform duration-300 ease-out overflow-y-auto ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
            <span className="text-white font-bold text-[10px] tracking-[0.2em] uppercase">Menu</span>
            <button onClick={() => setShowPanel(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User section */}
          {user ? (
            <div className="px-6 py-6 border-b border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center flex-none">
                  {displayAvatar && !imgError ? (
                    <img src={displayAvatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
                  ) : (
                    <span className="font-bold text-white text-base">{user.fullName?.[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-[11px] uppercase tracking-widest truncate">{user.fullName}</div>
                  <div className="text-zinc-600 font-mono text-[9px] truncate mt-0.5">{user.email}</div>
                  <div className="text-blue-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5">MS Member</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 border-b border-zinc-800/50">
              <button onClick={() => { signInWithGoogle(); setShowPanel(false); }} className="w-full py-3 border border-white text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors">
                {TEXT.login}
              </button>
            </div>
          )}

          {/* Nav links - List */}
          <div className="px-6 pb-6 border-b border-zinc-800/50">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowPanel(false)}
                  className="flex items-center gap-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  <span className="text-zinc-500">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account section */}
          {user && (
            <div className="px-6 py-4 border-b border-zinc-800/50">
              <div className="flex flex-col gap-1">
                <button onClick={() => { setShowPanel(false); router.push('/profile'); }} className="flex items-center gap-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  Hạng Thành Viên
                </button>
                {user.role === 'ADMIN' && (
                  <button onClick={() => { setShowPanel(false); router.push('/admin'); }} className="flex items-center gap-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                    <Film className="w-3.5 h-3.5 text-zinc-500" />
                    Quản Trị Viên
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Logout */}
          {user && (
            <div className="px-6 py-4">
              <button onClick={handleLogout} className="flex items-center gap-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
