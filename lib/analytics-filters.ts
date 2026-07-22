/**
 * Shared filter state + helpers for the Retailer and Manufacturer Intelligence
 * pages. Date-range changes require a refetch (the backend aggregates by
 * range); category/sub-category/weight/units filters apply client-side over
 * whatever the current range's dataset already contains.
 */

export type DatePreset = '7' | '30' | '90' | '180' | '365' | 'week' | 'month' | 'custom';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
];

export interface AnalyticsFilters {
  datePreset: DatePreset;
  customFrom: string; // yyyy-mm-dd (input[type=date] value)
  customTo: string;
  category: string;
  subCategory: string;
  weightMin: string; // decimal string — jewellery weights aren't whole grams
  weightMax: string;
  unitsMin: string;
  unitsMax: string;
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  datePreset: '30',
  customFrom: '',
  customTo: '',
  category: '',
  subCategory: '',
  weightMin: '',
  weightMax: '',
  unitsMin: '',
  unitsMax: '',
};

/** Build the `?days=` or `?from=&to=` query string for an /api/analytics/* GET. */
export function rangeQueryString(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();

  if (filters.datePreset === 'custom') {
    if (filters.customFrom) params.set('from', new Date(filters.customFrom).toISOString());
    if (filters.customTo) params.set('to', new Date(`${filters.customTo}T23:59:59`).toISOString());
    return params.toString();
  }

  if (filters.datePreset === 'week') {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    params.set('from', monday.toISOString());
    params.set('to', now.toISOString());
    return params.toString();
  }

  if (filters.datePreset === 'month') {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    params.set('from', firstOfMonth.toISOString());
    params.set('to', now.toISOString());
    return params.toString();
  }

  params.set('days', filters.datePreset);
  return params.toString();
}

/** A row shaped like this can be filtered by category/sub-category/weight/units. */
export interface FilterableRow {
  category?: string | null;
  subCategory?: string | null;
  weight?: number | null;
  units?: number;
}

export function matchesFilters(row: FilterableRow, filters: AnalyticsFilters): boolean {
  if (filters.category && row.category !== filters.category) return false;
  if (filters.subCategory && row.subCategory !== filters.subCategory) return false;

  if (filters.weightMin) {
    const min = parseFloat(filters.weightMin);
    if (!Number.isNaN(min) && (row.weight == null || row.weight < min)) return false;
  }
  if (filters.weightMax) {
    const max = parseFloat(filters.weightMax);
    if (!Number.isNaN(max) && (row.weight == null || row.weight > max)) return false;
  }

  if (filters.unitsMin) {
    const min = parseFloat(filters.unitsMin);
    if (!Number.isNaN(min) && (row.units == null || row.units < min)) return false;
  }
  if (filters.unitsMax) {
    const max = parseFloat(filters.unitsMax);
    if (!Number.isNaN(max) && (row.units == null || row.units > max)) return false;
  }

  return true;
}

export function isFiltersActive(filters: AnalyticsFilters): boolean {
  return Boolean(
    filters.category ||
      filters.subCategory ||
      filters.weightMin ||
      filters.weightMax ||
      filters.unitsMin ||
      filters.unitsMax
  );
}
