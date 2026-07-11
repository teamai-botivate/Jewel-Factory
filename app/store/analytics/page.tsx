'use client';

import { Loader2, BarChart3 } from 'lucide-react';

import { useApi } from '@/hooks/use-api';

type Summary = { views7: number; views30: number; tryons7: number; tryons30: number; sales30: number; activeProducts: number };

export default function AnalyticsPage() {
  const { data, loading } = useApi<Summary>('/api/store/intelligence/summary', '/store/login');
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Kiosk engagement over the last 7 and 30 days.</p>
      </div>
      {loading && <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Panel label="Product Views" a={data.views7} b={data.views30} />
          <Panel label="Try-ons" a={data.tryons7} b={data.tryons30} />
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Sales (30d)</p><BarChart3 className="h-4 w-4 text-primary" /></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{data.sales30}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ label, a, b }: { label: string; a: number; b: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between"><p className="text-sm font-medium">{label}</p><BarChart3 className="h-4 w-4 text-primary" /></div>
      <div className="mt-3 flex items-end gap-4">
        <div><p className="text-3xl font-semibold tabular-nums">{a}</p><p className="text-xs text-muted-foreground">7 days</p></div>
        <div><p className="text-xl font-semibold tabular-nums text-muted-foreground">{b}</p><p className="text-xs text-muted-foreground">30 days</p></div>
      </div>
    </div>
  );
}
