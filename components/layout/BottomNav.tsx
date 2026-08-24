'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Wallet, Bell, User, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [chatWidgetOpen, setChatWidgetOpen] = useState(true);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Bookings', href: '/bookings', icon: Calendar },
    { label: 'Wallet', href: '/wallet', icon: Wallet },
    { label: 'Alerts', href: '/notifications', icon: Bell },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      {/* Floating Chat Button (Above Bottom Bar, Bottom-Right) */}
      {chatWidgetOpen && user && (
        <div className="fixed bottom-20 right-4 z-50 md:hidden flex flex-col items-end">
          <div className="relative group">
            <button
              onClick={() => setChatWidgetOpen(false)}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900/80 text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-slate-900 transition-colors"
              aria-label="Dismiss chat widget"
            >
              <X className="h-3 w-3" />
            </button>
            <Link
              href="/chat"
              className="w-13 h-13 rounded-full bg-[#126b4c] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
              aria-label="Support Chat"
            >
              <MessageCircle className="h-6 w-6" />
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Bottom Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-100 px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'text-[#126b4c]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    isActive ? 'bg-[#e8f6ef]' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[11px] mt-0.5 ${isActive ? 'font-bold text-[#126b4c]' : 'font-medium text-slate-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
