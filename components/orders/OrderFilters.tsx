'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

/**
 * Reusable client-side filter bar for order-list pages (HO Manager, Manufacturer,
 * Store Manager). All filtering is done in-page against already-fetched data.
 *
 * - search: matches the order number / label (case-insensitive substring)
 * - status: dropdown of status buckets (pass the options relevant to the role)
 * - group: optional second dropdown — "Store" (branch) for HO, "Retailer" for
 *   the manufacturer. Omit `groupOptions` to hide it.
 */
export function OrderFilters({
  search,
  onSearch,
  searchPlaceholder = 'Search by order ID…',
  status,
  onStatus,
  statusOptions,
  statusAllLabel = 'All statuses',
  group,
  onGroup,
  groupOptions,
  groupAllLabel = 'All',
  groupLabel = 'Filter',
  from,
  to,
  onFrom,
  onTo,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  status: string;
  onStatus: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  statusAllLabel?: string;
  group?: string;
  onGroup?: (v: string) => void;
  groupOptions?: { value: string; label: string }[];
  groupAllLabel?: string;
  groupLabel?: string;
  // Date range (createdAt). Pass all four to show the From/To inputs.
  from?: string;
  to?: string;
  onFrom?: (v: string) => void;
  onTo?: (v: string) => void;
}) {
  const selectCls =
    'h-9 rounded-md border border-input bg-transparent px-3 text-sm';
  const showDates = onFrom && onTo;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>

      <select className={selectCls} value={status} onChange={(e) => onStatus(e.target.value)}>
        <option value="">{statusAllLabel}</option>
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {groupOptions && onGroup && (
        <select className={selectCls} value={group ?? ''} onChange={(e) => onGroup(e.target.value)} aria-label={groupLabel}>
          <option value="">{groupAllLabel}</option>
          {groupOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {showDates && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>From</span>
          <input type="date" value={from ?? ''} onChange={(e) => onFrom!(e.target.value)} max={to || undefined} className={selectCls} aria-label="From date" />
          <span>To</span>
          <input type="date" value={to ?? ''} onChange={(e) => onTo!(e.target.value)} min={from || undefined} className={selectCls} aria-label="To date" />
          {(from || to) && (
            <button type="button" onClick={() => { onFrom!(''); onTo!(''); }} className="rounded px-1.5 py-1 text-muted-foreground hover:text-foreground" aria-label="Clear dates">Clear</button>
          )}
        </div>
      )}
    </div>
  );
}
