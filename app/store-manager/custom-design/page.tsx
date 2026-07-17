'use client';

import { CheckCircle2, Loader2, PencilLine } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiPost } from '@/hooks/use-api';
import { CATEGORIES, subCategoriesFor } from '@/lib/categories';

const PURITIES = ['24K', '22K', '18K', '14K', '916', '750', '585'];

export default function StoreManagerCustomDesignPage() {
  const [form, setForm] = useState({ category: CATEGORIES[0], subCategory: '', weight: '', purity: '', notes: '', imageUrl: '' });
  const [subCustom, setSubCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }
  const subOptions = subCategoriesFor(form.category);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/branch-manager/custom-designs', {
        category: form.category,
        subCategory: form.subCategory.trim() || undefined,
        weightGrams: form.weight ? Number(form.weight) : undefined,
        purity: form.purity || undefined,
        designNotes: form.notes.trim() || undefined,
        referenceImageUrl: form.imageUrl.trim() || undefined,
      });
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit'); } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-7 w-7" /></div>
        <h1 className="mt-4 font-display text-2xl font-medium">Request sent</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sent to Head Office for approval.</p>
        <Button className="mt-6 metal-sheen text-[#17120b] font-semibold" onClick={() => { setDone(false); setForm({ category: CATEGORIES[0], subCategory: '', weight: '', purity: '', notes: '', imageUrl: '' }); }}>New request</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center gap-2 text-primary"><PencilLine className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Custom Design</span></div>
      <h1 className="font-display text-2xl font-medium tracking-tight">New custom request</h1>
      <p className="mt-1 text-sm text-muted-foreground">Capture the customer&apos;s requirement. No customer personal details are stored here — keep those with you.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.category} onChange={(e) => { set('category', e.target.value); set('subCategory', ''); setSubCustom(false); }}>
              {CATEGORIES.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Sub-category <span className="font-normal">(optional)</span></label>
            {subOptions.length > 0 && !subCustom ? (
              <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.subCategory} onChange={(e) => { if (e.target.value === '__other__') { setSubCustom(true); set('subCategory', ''); } else set('subCategory', e.target.value); }}>
                <option value="">—</option>
                {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="__other__">Other (type your own)…</option>
              </select>
            ) : (
              <div className="mt-1 flex gap-2">
                <Input placeholder="Type a sub-category" value={form.subCategory} onChange={(e) => set('subCategory', e.target.value)} />
                {subOptions.length > 0 && <button type="button" onClick={() => { setSubCustom(false); set('subCategory', ''); }} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">List</button>}
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted-foreground">Weight (g)</label><Input className="mt-1" type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Purity</label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.purity} onChange={(e) => set('purity', e.target.value)}>
              <option value="">—</option>
              {PURITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground">Reference image URL <span className="font-normal">(optional)</span></label><Input className="mt-1" placeholder="https://…" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} /></div>
        <div><label className="text-xs font-medium text-muted-foreground">Requirement / notes</label><textarea className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" placeholder="Describe the design the customer wants…" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button type="submit" disabled={loading} className="metal-sheen h-11 w-full text-sm font-semibold text-[#17120b]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send to Head Office'}
        </Button>
      </form>
    </div>
  );
}
