/**
 * Client-side order-filter helpers shared by the HO Manager, Manufacturer and
 * Store Manager order-list pages. Keep all filtering logic here so every page
 * behaves the same.
 */

// Status buckets for kiosk guest orders + B2B orders (OrderStatus enum).
export const KIOSK_B2B_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Status buckets for custom design REQUESTS (HO side — CustomStatus enum).
export const CUSTOM_REQUEST_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'FORWARDED', label: 'Forwarded' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Status buckets for custom design ORDERS (Manufacturer side — CustomOrderStatus).
export const CUSTOM_ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PRODUCTION', label: 'In production' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Derived status buckets for the Store Manager "My Orders" (no raw enum shown).
export const SM_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

/** Build a de-duplicated, sorted dropdown option list from a set of names. */
export function uniqueBranchOptions(names: (string | null | undefined)[]): { value: string; label: string }[] {
  const set = new Set<string>();
  for (const n of names) {
    const v = (n ?? '').trim();
    if (v) set.add(v);
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ value: v, label: v }));
}

/**
 * Generic matcher for a list row.
 * - search: substring match against the order number / label
 * - status: exact match against the row status (skip when '')
 * - branch/retailer: exact match against the row's group name (skip when '')
 */
export function matchOrder(
  row: { orderNumber?: string | null; status?: string | null },
  opts: { search: string; status: string; searchLabel?: string; branch?: string; branchName?: string | null },
): boolean {
  const q = opts.search.trim().toLowerCase();
  if (q) {
    const hay = `${row.orderNumber ?? ''} ${opts.searchLabel ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (opts.status && (row.status ?? '') !== opts.status) return false;
  if (opts.branch && (opts.branchName ?? '') !== opts.branch) return false;
  return true;
}
