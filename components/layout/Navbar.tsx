'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, X, LogOut, User, Star, MessageCircle, Receipt, ShieldAlert, Wallet, BadgePercent, CreditCard, Heart, SlidersHorizontal, ShoppingCart, Repeat } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';
import { notificationsApi, servicesApi } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const cartCount = useCartStore((s) => s.itemCount);
  const refreshCart = useCartStore((s) => s.refresh);
  const resetCart = useCartStore((s) => s.reset);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  const resetFavorites = useFavoritesStore((s) => s.reset);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    notificationsApi.getAll()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          setUnreadCount(list.filter((n: any) => !n.isRead).length);
        }
      })
      .catch(() => setUnreadCount(0));
  }, [user, pathname]);

  // Pull the customer's cart count + favorites whenever they log in, and
  // refresh the cart badge on every route change (e.g. after adding an
  // item then navigating back). Cleared on logout so a shared device
  // doesn't leak the previous customer's data into the UI.
  useEffect(() => {
    if (!user) { resetCart(); resetFavorites(); return; }
    refreshCart();
    hydrateFavorites();
  }, [user]);

  useEffect(() => {
    if (user) refreshCart();
  }, [pathname, user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close both menus whenever the route changes (tapping a link, back/forward, etc.)
  useEffect(() => {
    setProfileMenuOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleProfileMenu = () => {
    setMobileNavOpen(false);
    setProfileMenuOpen((v) => !v);
  };

  const toggleMobileNav = () => {
    setProfileMenuOpen(false);
    setMobileNavOpen((v) => !v);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ services: { id: string; name: string; image?: string }[]; categories: { id: string; name: string; icon?: string }[] }>({ services: [], categories: [] });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const handleNavbarSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/services');
    }
  };

  // Debounced search-suggestions dropdown, powered by the /services/search-suggestions
  // endpoint (service + category name matches) so typing "clean" surfaces both
  // "Bathroom Cleaning" and the "Cleaning" category to jump straight into.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSuggestions({ services: [], categories: [] }); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      servicesApi.getSearchSuggestions(q)
        .then((res) => {
          if (cancelled) return;
          const data = res.data?.data || res.data || { services: [], categories: [] };
          setSuggestions({ services: data.services || [], categories: data.categories || [] });
        })
        .catch(() => { if (!cancelled) setSuggestions({ services: [], categories: [] }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery]);

  // Close the suggestions dropdown on outside click, same pattern as the profile menu.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToService = (id: string) => {
    setSuggestionsOpen(false);
    setSearchQuery('');
    router.push(`/services/${id}`);
  };

  const goToCategory = (id: string) => {
    setSuggestionsOpen(false);
    setSearchQuery('');
    router.push(`/services?category=${id}`);
  };

  const hasSuggestions = suggestions.services.length > 0 || suggestions.categories.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center bg-white">
              <img src={logo.src} alt="HomeServe" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-slate-900 text-lg hidden sm:block">HomeServe</span>
          </Link>

          {/* Inline Search Bar (Tablet & Desktop) */}
          <div ref={searchBoxRef} className="hidden sm:block relative flex-1 max-w-md lg:max-w-lg">
            <form onSubmit={handleNavbarSearch} className="flex items-center bg-slate-50 rounded-full pl-4 pr-1 py-1 border border-slate-200/90 shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2.5 flex-shrink-0" />
              <input
                name="query"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSuggestionsOpen(true); }}
                onFocus={() => setSuggestionsOpen(true)}
                placeholder='Search "AC repair", "deep cleaning"...'
                autoComplete="off"
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0 transition-colors ml-1"
                aria-label="Filter"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </form>

            {suggestionsOpen && searchQuery.trim() && hasSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
                {suggestions.categories.length > 0 && (
                  <div className="py-1.5">
                    <p className="px-4 pt-1 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Categories</p>
                    {suggestions.categories.map((c) => (
                      <button key={c.id} onClick={() => goToCategory(c.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.services.length > 0 && (
                  <div className="py-1.5 border-t border-slate-100">
                    <p className="px-4 pt-1 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Services</p>
                    {suggestions.services.map((s) => (
                      <button key={s.id} onClick={() => goToService(s.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                        {s.image ? (
                          <img src={s.image} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[['/', 'Home'], ['/services', 'Services'], ['/deals', 'Deals'], ['/bookings', 'Bookings'], ['/support', 'Support']].map(([href, label]) => (
              <Link key={href} href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === href ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Mobile Only Search Icon */}
            <Link
              href="/search"
              aria-label="Search"
              className="sm:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>
            {user && (
              <Link href="/chat" className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </Link>
            )}
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
            {user && (
              <Link href="/cart" className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-brand-500 rounded-full">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button onClick={toggleProfileMenu} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-24 truncate">{user.name || 'Profile'}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.phone || user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="h-4 w-4" /> My Profile
                      </Link>
                      <Link href="/wallet" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Wallet className="h-4 w-4" /> Wallet
                      </Link>
                      <Link href="/profile/cards" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <CreditCard className="h-4 w-4" /> Saved Cards
                      </Link>
                      <Link href="/favorites" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Heart className="h-4 w-4" /> Favorites
                      </Link>
                      <Link href="/cart" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <ShoppingCart className="h-4 w-4" /> Cart
                      </Link>
                      <Link href="/recurring-bookings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Repeat className="h-4 w-4" /> Recurring Bookings
                      </Link>
                      <Link href="/deals" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <BadgePercent className="h-4 w-4" /> Deals &amp; Offers
                      </Link>
                      <Link href="/subscription" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Star className="h-4 w-4" /> Subscription Plans
                      </Link>
                      <Link href="/invoices" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Receipt className="h-4 w-4" /> Invoices &amp; Receipts
                      </Link>
                      <Link href="/disputes" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <ShieldAlert className="h-4 w-4" /> My Disputes
                      </Link>
                      <Link href="/support/ai-chat" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
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
            <button onClick={toggleMobileNav} className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Floating Mobile Nav Overlay */}
        {mobileNavOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 top-16 bg-slate-900/25 backdrop-blur-xs z-40 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />

            {/* Floating Dropdown Menu */}
            <div className="absolute top-full left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-2xl px-4 py-3 space-y-1 md:hidden">
              {[['/', 'Home'], ['/services', 'Services'], ['/deals', 'Deals'], ['/bookings', 'Bookings'], ['/support', 'Support']].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === href
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
