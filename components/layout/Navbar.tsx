'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, X, LogOut, User, Star, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { notificationsApi } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = () => {
      notificationsApi.getAll()
        .then((res) => {
          const payload = res.data.data || res.data || {};
          setUnreadCount(payload.unreadCount || 0);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">HS</span>
            </div>
            <span className="font-display font-bold text-slate-900 text-lg hidden sm:block">HomeServe</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[['/', 'Home'], ['/services', 'Services'], ['/bookings', 'Bookings'], ['/support', 'Support']].map(([href, label]) => (
              <Link key={href} href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === href ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            {user && (
              <Link href="/notifications" className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-24 truncate">{user.name || 'Profile'}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.phone || user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="h-4 w-4" /> My Profile
                      </Link>
                      <Link href="/subscription" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Star className="h-4 w-4" /> Subscription Plans
                      </Link>
                      <Link href="/support/ai-chat" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <MessageCircle className="h-4 w-4" /> Live Chat
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2 px-4">Sign In</Link>
            )}

            {/* Mobile menu btn */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-100 mt-2">
            {[['/', 'Home'], ['/services', 'Services'], ['/bookings', 'Bookings'], ['/support', 'Support']].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${pathname === href ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
