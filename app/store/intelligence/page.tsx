'use client';

import { Loader2, TrendingUp, Package, Lightbulb, Store as StoreIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useApi } from '@/hooks/use-api';
import { StarRating } from '@/components/ui/StarRating';
import type { BranchSalesData } from '@/lib/db/analytics';

type Summary = { views7: number; views30: number; tryons7: number; tryons30: number; sales30: number; activeProducts: number };
type Rec = { productId: string; name: string; type: string; reason: string; imageUrl: string | null };

export default function IntelligencePage() {
  const summary = useApi<Summary>('/api/store/intelligence/summary', '/store/login');
  const recs = useApi<Rec[]>('/api/store/intelligence/recommendations', '/store/login');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Intelligence</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Demand signals and restock recommendations for your inventory.</p>
      </div>

      {summary.loading && <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {summary.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Views (7d)" value={summary.data.views7} icon={TrendingUp} />
          <Stat label="Views (30d)" value={summary.data.views30} icon={TrendingUp} />
          <Stat label="Try-ons (7d)" value={summary.data.tryons7} icon={TrendingUp} />
          <Stat label="Try-ons (30d)" value={summary.data.tryons30} icon={TrendingUp} />
          <Stat label="Sales (30d)" value={summary.data.sales30} icon={TrendingUp} />
          <Stat label="Active Products" value={summary.data.activeProducts} icon={Package} />
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <Lightbulb className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Recommendations</p>
        </div>
        {recs.loading && <div className="flex items-center gap-2 px-4 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {recs.data && recs.data.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recommendations yet. They appear as your kiosk gathers views, try-ons and sales.</p>
        )}
        {recs.data && recs.data.length > 0 && (
          <div className="divide-y">
            {recs.data.map((r) => (
              <div key={r.productId} className="flex items-center gap-3 px-4 py-3">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-10 w-10 rounded-lg border object-cover" />
                ) : <div className="h-10 w-10 rounded-lg border bg-muted" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.type === 'restock' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BranchBreakdown />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof TrendingUp }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// Which of the retailer's stores (branches) is selling what — best-sellers per
// branch, category split. Complements the summary above (which is store-wide,
// not per-branch).
function BranchBreakdown() {
  const [branches, setBranches] = useState<BranchSalesData[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/analytics/store/branches', { credentials: 'same-origin' });
        if (!res.ok) return;
        const json = (await res.json()) as { data: BranchSalesData[] };
        const list = json.data || [];
        setBranches(list);
        if (list.length > 0) setSelectedBranchId(list[0].branchId);
      } catch {
        // non-critical — the page above still works without this section
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading store breakdown…</div>;
  }
  if (!branches.length) return null;

  const branch = branches.find((b) => b.branchId === selectedBranchId);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <StoreIcon className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Store-wise sales (last 30 days)</p>
      </div>

      <div className="flex gap-2 flex-wrap px-4 pt-4">
        {branches.map((b) => (
          <button
            key={b.branchId}
            onClick={() => setSelectedBranchId(b.branchId)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedBranchId === b.branchId ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {b.branchName}
          </button>
        ))}
      </div>

      {branch && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top products</p>
            <div className="space-y-2">
              {branch.topProducts.length === 0 && <p className="text-sm text-muted-foreground">No sales yet for this store.</p>}
              {branch.topProducts.slice(0, 5).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.category}{p.subCategory ? ` · ${p.subCategory}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRating count={p.stars} size="sm" />
                    <span className="text-sm font-semibold tabular-nums">{p.units}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">By category</p>
            <div className="space-y-2">
              {Object.entries(branch.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, units]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-semibold tabular-nums">{units}</span>
                  </div>
                ))}
              {Object.keys(branch.byCategory).length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
