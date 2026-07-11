'use client';

import { Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

type Order = { id: string; orderNumber: string; status: string; totalItems: number; createdAt: string; storeName: string | null; storeCity: string | null };

const STATUS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800', SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-700',
};

export default function ManufacturerOrdersPage() {
  const { data, error, loading } = useApi<Order[]>('/api/manufacturer/orders', '/manufacturer/login');
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">B2B Orders</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Restock orders placed by stores from your catalog.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {data.map((o) => (
            <Link key={o.id} href={`/manufacturer/orders/${o.id}`}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30">
                <div className="grid flex-1 grid-cols-2 gap-x-4 sm:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Order</p><p className="text-sm font-medium">{o.orderNumber}</p></div>
                  <div><p className="text-xs text-muted-foreground">Store</p><p className="text-sm font-medium text-primary truncate">{o.storeName ?? '—'}</p>{o.storeCity && <p className="text-xs text-muted-foreground">{o.storeCity}</p>}</div>
                  <div><p className="text-xs text-muted-foreground">Items</p><p className="text-sm tabular-nums">{o.totalItems}</p></div>
                  <div className="flex items-start"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[o.status] ?? ''}`}>{o.status.toLowerCase()}</span></div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
