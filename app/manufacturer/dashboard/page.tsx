'use client';

import { Package, ShoppingBag, Users, ClipboardCheck, Store as StoreIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Dashboard = {
  totalDesigns: number;
  activeDesigns: number;
  pendingB2b: number;
  pendingKiosk: number;
  pendingRegistrations: number;
  activeStores: number;
  recentB2b: {
    id: string;
    orderNumber: string;
    status: string;
    totalItems: number;
    createdAt: string;
    storeName: string | null;
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function Stat({ label, value, icon: Icon, href }: { label: string; value: number; icon: typeof Package; href: string }) {
  return (
    <Link href={href}>
      <div className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      </div>
    </Link>
  );
}

export default function ManufacturerDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/manufacturer/dashboard', { cache: 'no-store' });
        if (res.status === 401) { window.location.assign('/manufacturer/login'); return; }
        const json = (await res.json()) as { data?: Dashboard; error?: { message: string } };
        if (!res.ok || json.error) { setError(json.error?.message ?? 'Failed to load'); return; }
        setData(json.data!);
      } catch {
        setError('Network error');
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Overview of your catalog, orders and retailers.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!data && !error && (
        <div className="flex items-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Total Designs" value={data.totalDesigns} icon={Package} href="/manufacturer/catalog" />
            <Stat label="Active" value={data.activeDesigns} icon={Package} href="/manufacturer/catalog" />
            <Stat label="B2B Pending" value={data.pendingB2b} icon={ShoppingBag} href="/manufacturer/orders" />
            <Stat label="Kiosk Pending" value={data.pendingKiosk} icon={Users} href="/manufacturer/kiosk-orders" />
            <Stat label="Approvals" value={data.pendingRegistrations} icon={ClipboardCheck} href="/manufacturer/store-registrations" />
            <Stat label="Active Retailers" value={data.activeStores} icon={StoreIcon} href="/manufacturer/stores" />
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium">Recent B2B Orders</p>
              <Link href="/manufacturer/orders" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {data.recentB2b.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="divide-y">
                {data.recentB2b.map((o) => (
                  <Link key={o.id} href={`/manufacturer/orders/${o.id}`}>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.storeName ?? '—'} · {o.totalItems} item{o.totalItems !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? ''}`}>
                        {o.status.toLowerCase()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
