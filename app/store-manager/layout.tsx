'use client';

import { Loader2, LogOut, Gem, PencilLine, Package, LayoutDashboard } from 'lucide-react';
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
    { href: '/store-manager/kiosk', label: 'Kiosk', icon: Gem },
    { href: '/store-manager/custom-design', label: 'Custom Design', icon: PencilLine },
    { href: '/store-manager/restock', label: 'Restock', icon: Package },
  ];

  return (
    <Ctx.Provider value={data}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b bg-[#fbf8f1]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              {data.retailer.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.retailer.logoUrl} alt="" className="h-7 w-auto object-contain" />
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-medium">{data.retailer.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{data.branch.name} · Store Manager</p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground">
                  <Icon className="h-4 w-4" />{label}
                </Link>
              ))}
            </nav>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
          {/* Mobile nav */}
          <nav className="flex items-center gap-1 overflow-x-auto border-t px-2 py-1 md:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-foreground/70 hover:bg-muted">
                <Icon className="h-3.5 w-3.5" />{label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="mt-auto border-t py-4 text-center text-xs text-muted-foreground">
          {data.retailer.name} · {data.branch.name} · Powered by Jewel Factory
        </footer>
      </div>
    </Ctx.Provider>
  );
}
