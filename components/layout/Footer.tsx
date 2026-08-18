import Link from 'next/link';
import logo from '@/assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 bg-white">
                <img src={logo.src} alt="HomeServe" className="w-full h-full object-cover" />
              </div>
              <span className="font-display font-bold text-slate-900">HomeServe</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">Professional home services at your doorstep, available across Bhubaneswar.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 text-sm">Services</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {['Cleaning', 'Plumbing', 'Electrician', 'AC Repair', 'Carpentry'].map(s => (
                <li key={s}><Link href="/services" className="hover:text-brand-500 transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {[['About', '/about'], ['Blog', '/blog'], ['Careers', '/careers'], ['Partner with us', '/partner']].map(([l, h]) => (
                <li key={l}><Link href={h} className="hover:text-brand-500 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {[['Help Centre', '/support'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Contact Us', '/contact']].map(([l, h]) => (
                <li key={l}><Link href={h} className="hover:text-brand-500 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 mt-8 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HomeServe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
