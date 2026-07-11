'use client';

import { Loader2, Package, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';

type Order = { id: string; orderNumber: string; status: string; totalItems: number; pendingManagerApproval: boolean; trackingNumber: string | null; createdAt: string };

const STATUS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800', SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-700',
};

export default function StoreB2bOrdersPage() {
  const { data, error, loading } = useApi<Order[]>('/api/store/b2b-orders', '/store/login');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">B2B Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Restock orders you placed from the manufacturer catalog.</p>
        </div>
        <Link href="/store/manufacturer-catalog"><Button className="metal-sheen text-[#17120b] font-semibold"><Plus className="mr-1.5 h-4 w-4" />New Order</Button></Link>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No B2B orders yet.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {data.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {o.totalItems} item(s){o.trackingNumber ? ` · Tracking: ${o.trackingNumber}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {o.pendingManagerApproval && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">Needs approval</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[o.status] ?? ''}`}>{o.status.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
