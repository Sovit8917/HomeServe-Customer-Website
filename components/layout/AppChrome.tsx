'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';

// Pages that are their own full-screen flow and shouldn't show the app chrome.
// '/track' is the public booking-share link — a standalone view for someone
// who was never logged in, so it shouldn't show a Navbar full of
// authenticated-account links (cart, wallet, profile menu, etc.).
const CHROMELESS_PATHS = ['/login', '/onboarding', '/track'];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isChromeless) {
    return (
      <main className="min-h-screen">
        <PushNotificationManager />
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      <PushNotificationManager />
    </>
  );
}
