'use client';

import { CheckCircle2, Loader2, PencilLine } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKioskStore } from '@/components/kiosk/StoreContext';

const CATEGORIES = ['ring', 'earring', 'necklace', 'bangle', 'bracelet', 'pendant', 'chain', 'nose-pin', 'anklet', 'mangalsutra'];
const PURITIES = ['24K', '22K', '18K', '14K', '916', '750', '585'];

export default function CustomDesignPage() {
  const store = useKioskStore();
  const base = `/${store.slug}`;
  const [form, setForm] = useState({ name: '', phone: '', category: 'necklace', weight: '', purity: '', notes: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || form.phone.trim().length < 7) return setError('Please enter your name and a valid phone.');
    setLoading(true);
    try {
      const res = await fetch('/api/kiosk/custom-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: store.slug,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          category: form.category,
          weightGrams: form.weight ? Number(form.weight) : undefined,
          purity: form.purity || undefined,
          notes: form.notes.trim() || undefined,
          referenceImageUrl: form.imageUrl.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { data?: unknown; error?: { message: string } };
      if (!res.ok || json.error) { setError(json.error?.message ?? 'Could not submit.'); return; }
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Network error'); } finally { setLoading(false); }
  }

  if (done) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-7 w-7" /></div>
        <h1 className="mt-4 font-display text-2xl font-medium">Request submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">The store will review your custom design request and contact you.</p>
        <Link href={`${base}/catalog`} className="mt-6"><Button className="metal-sheen text-[#17120b] font-semibold">Back to Catalog</Button></Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-primary"><PencilLine className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Custom Design</span></div>
      <h1 className="font-display text-3xl font-normal tracking-tight">Request a custom piece</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tell us what you have in mind. The store will get back to you.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted-foreground">Your Name *</label><Input className="mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Phone *</label><Input className="mt-1" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Weight (g)</label><Input className="mt-1" type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Purity</label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.purity} onChange={(e) => set('purity', e.target.value)}>
              <option value="">—</option>
              {PURITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground">Reference image URL (optional)</label><Input className="mt-1" placeholder="https://…" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} /></div>
        <div><label className="text-xs font-medium text-muted-foreground">Notes / description</label><textarea className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" placeholder="Describe your ideal design…" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button type="submit" disabled={loading} className="metal-sheen h-11 w-full text-sm font-semibold text-[#17120b]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
        </Button>
      </form>
    </main>
  );
}
