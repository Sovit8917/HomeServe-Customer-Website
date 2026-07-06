import type { Metadata } from "next";
import "./globals.css";
import AppChrome from "@/components/layout/AppChrome";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HomeServe – Professional Home Services",
  description: "Book trusted home service professionals near you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppChrome>{children}</AppChrome>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#0b7de8', secondary: '#fff' } }
        }} />
      </body>
    </html>
  );
}
