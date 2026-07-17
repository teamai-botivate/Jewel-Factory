'use client';

import { Loader2, LogOut, Gem, PencilLine, Package, LayoutDashboard, Sparkles, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';

import { useApi, apiPost } from '@/hooks/use-api';

export type StoreManagerMe = {
  id: string;
  name: string;
  email: string;
  branch: { id: string; name: string; hasRestockPin: boolean };
  retailer: { id: string; name: string; logoUrl: string | null; tagline: string | null; city: string | null };
};

const Ctx = createContext<StoreManagerMe | null>(null);
export function useStoreManager(): StoreManagerMe {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStoreManager outside provider');
  return v;
}

export default function StoreManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The login page renders under this route but must NOT require auth.
  if (pathname === '/store-manager/login') return <>{children}</>;

  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  const { data, loading } = useApi<StoreManagerMe>('/api/branch-manager/me', '/store-manager/login');

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  async function logout() {
    try { await apiPost('/api/branch-manager/logout'); } catch { /* ignore */ }
    window.location.assign('/store-manager/login');
  }

  const nav = [
    { href: '/store-manager', label: 'Home', icon: LayoutDashboard },
    { href: '/store-manager/kiosk', label: 'Catalog', icon: Gem },
    { href: '/store-manager/try-on', label: 'Try-On', icon: Sparkles },
    { href: '/store-manager/search', label: 'Search', icon: Search },
    { href: '/store-manager/custom-design', label: 'Custom Design', icon: PencilLine },
    { href: '/store-manager/restock', label: 'Restock', icon: Package },
  ];

  return (
    <Ctx.Provider value={data}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20">
          {/* Dark branding strip — retailer identity (same look as the old kiosk) */}
          <div className="flex items-center justify-between gap-2 bg-[#191511] px-4 py-1.5 text-[11px]">
            <div className="flex min-w-0 items-center gap-2 text-[#e4cf8f]">
              {data.retailer.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.retailer.logoUrl} alt={data.retailer.name} className="h-5 w-auto object-contain" />
              ) : null}
              <span className="truncate font-semibold text-[#f8e7af]">{data.retailer.name}</span>
              <span className="hidden text-[#c9b98b] sm:inline">· {data.branch.name}</span>
            </div>
            <span className="flex-shrink-0 text-[#5a4f38]">Store Manager · Powered by Jewel Factory</span>
          </div>
          {/* Glassy cream nav bar */}
          <div className="flex h-14 items-center justify-between gap-3 border-b bg-[#fbf8f1]/90 px-4 backdrop-blur-lg">
            <Link href="/store-manager" className="truncate font-display text-base font-medium tracking-tight sm:text-lg">{data.retailer.name}</Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              {nav.slice(1).map(({ href, label }) => (
                <Link key={href} href={href} className="luxury-link-underline">{label}</Link>
              ))}
            </nav>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
          {/* Mobile nav */}
          <nav className="flex items-center gap-1 overflow-x-auto border-b bg-[#fbf8f1] px-2 py-1 md:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-foreground/70 hover:bg-muted">
                <Icon className="h-3.5 w-3.5" />{label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="mt-auto border-t bg-[#1A1A1A] py-8 text-center text-white/70">
          <p className="font-display text-lg">{data.retailer.name}</p>
          {data.retailer.tagline && <p className="mt-1 text-sm text-white/50">{data.retailer.tagline}</p>}
          <p className="mt-3 text-xs text-white/40">{data.branch.name} · Powered by Jewel Factory</p>
        </footer>
      </div>
    </Ctx.Provider>
  );
}
