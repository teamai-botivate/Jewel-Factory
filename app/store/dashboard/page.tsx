'use client';

import { ClipboardCheck, ShoppingBag, Users, PencilLine, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

type Dash = {
  pendingKiosk: number; pendingB2b: number; pendingCustom: number;
  totalKiosk: number; totalB2b: number; totalCustom: number; pendingTotal: number;
};

export default function StoreDashboardPage() {
  const { data, error, loading } = useApi<Dash>('/api/store/dashboard', '/store/login');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Approvals and order activity at a glance.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

      {data && (
        <>
          {data.pendingTotal > 0 && (
            <Link href="/store/pending-approvals">
              <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 hover:bg-yellow-100 transition-colors">
                <ClipboardCheck className="h-5 w-5" />
                <span><strong>{data.pendingTotal}</strong> item{data.pendingTotal !== 1 ? 's' : ''} awaiting your approval.</span>
              </div>
            </Link>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card href="/store/kiosk-orders" icon={ShoppingBag} label="Kiosk Orders" total={data.totalKiosk} pending={data.pendingKiosk} />
            <Card href="/store/b2b-orders" icon={Users} label="B2B Orders" total={data.totalB2b} pending={data.pendingB2b} />
            <Card href="/store/custom-designs" icon={PencilLine} label="Custom Designs" total={data.totalCustom} pending={data.pendingCustom} />
          </div>
        </>
      )}
    </div>
  );
}

function Card({ href, icon: Icon, label, total, pending }: { href: string; icon: typeof ShoppingBag; label: string; total: number; pending: number }) {
  return (
    <Link href={href}>
      <div className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{total}</p>
        {pending > 0 && <p className="text-xs text-yellow-700">{pending} pending approval</p>}
      </div>
    </Link>
  );
}
