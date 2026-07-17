'use client';

import { Camera, Loader2, Upload, Search as SearchIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { titleCaseName, productMetaLine } from '@/lib/format';

type Img = { secureUrl: string; isPrimary: boolean };
type Product = { id: string; designNumber: string; name: string; category: string | null; subCategory: string | null; purity: string | null; weightGrams: string | null; hasTryon: boolean; images: Img[] };

export default function StoreManagerSearchPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null); setResults(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      try {
        const res = await fetch('/api/branch-manager/search/image', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (res.status === 401) { window.location.assign('/store-manager/login'); return; }
        const json = (await res.json()) as { data?: Product[]; error?: { message: string } };
        if (!res.ok || json.error) { setError(json.error?.message ?? 'Search failed'); return; }
        setResults(json.data!);
      } catch { setError('Network error'); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2 text-primary"><SearchIcon className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Visual Search</span></div>
      <h1 className="font-display text-3xl font-normal tracking-tight">Find a match by photo</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload a photo and we&apos;ll find similar pieces in the catalog.</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={() => fileInput.current?.click()} className="metal-sheen text-[#17120b] font-semibold">
          <Upload className="mr-1.5 h-4 w-4" />Upload Photo
        </Button>
        <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="query" className="h-16 w-16 rounded-lg border object-cover" />
        )}
      </div>

      {loading && <div className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>}
      {error && <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

      {results && results.length === 0 && !loading && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <Camera className="h-10 w-10 opacity-40" /><p className="text-sm">No similar pieces found. Try a different photo.</p>
        </div>
      )}
      {results && results.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-sm font-medium">{results.length} similar piece{results.length !== 1 ? 's' : ''} — add to order from Catalog</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => {
              const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
              return (
                <div key={p.id} className="overflow-hidden rounded-lg bg-[#FBF9F5] ring-1 ring-black/5">
                  <div className="relative aspect-[3/4] bg-[#ece5da]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.secureUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                    {p.hasTryon && <span className="metal-sheen absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#17120b]"><Sparkles className="mr-0.5 inline h-2.5 w-2.5" />AR</span>}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{titleCaseName(p.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{productMetaLine({ category: p.category, subCategory: p.subCategory, purity: p.purity, weight: p.weightGrams })}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/store-manager/kiosk" className="metal-sheen inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#17120b]">Go to Catalog to order</Link>
          </div>
        </div>
      )}
    </main>
  );
}
