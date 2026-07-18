'use client';

import { Camera, Gem, Loader2, Upload, Search as SearchIcon, Sparkles, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { titleCaseName, productMetaLine, formatWeight } from '@/lib/format';

type Img = { secureUrl: string; isPrimary: boolean };
type Product = { id: string; designNumber: string; name: string; category: string | null; subCategory: string | null; purity: string | null; weightGrams: string | null; description?: string | null; hasTryon: boolean; images: Img[] };

export default function StoreManagerSearchPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailImg, setDetailImg] = useState(0);

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
                <button key={p.id} type="button" onClick={() => { setDetail(p); setDetailImg(0); }} className="group overflow-hidden rounded-lg bg-[#FBF9F5] text-left ring-1 ring-black/5 transition-shadow hover:shadow-md" title="View details">
                  <div className="relative aspect-[3/4] bg-[#ece5da]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.secureUrl} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : null}
                    {p.hasTryon && <span className="metal-sheen absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#17120b]"><Sparkles className="mr-0.5 inline h-2.5 w-2.5" />AR</span>}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">{titleCaseName(p.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{productMetaLine({ category: p.category, subCategory: p.subCategory, purity: p.purity, weight: p.weightGrams })}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/store-manager/kiosk" className="metal-sheen inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#17120b]">Go to Catalog to order</Link>
          </div>
        </div>
      )}

      {/* Product detail modal */}
      {detail && (() => {
        const similar = (results ?? [])
          .filter((p) => p.id !== detail.id && (
            (detail.subCategory && p.subCategory === detail.subCategory) || (detail.category && p.category === detail.category)
          ))
          .slice(0, 6);
        return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8" onClick={() => setDetail(null)}>
          <div className="relative w-full max-w-3xl rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} aria-label="Close" className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"><X className="h-4 w-4" /></button>
            <div className="grid md:grid-cols-2">
              {/* Gallery */}
              <div className="bg-[#ece5da] p-4 md:rounded-l-2xl">
                <div className="aspect-square overflow-hidden rounded-xl bg-white">
                  {detail.images[detailImg] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.images[detailImg].secureUrl} alt={detail.name} className="h-full w-full object-contain" />
                  ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Gem className="h-10 w-10" /></div>}
                </div>
                {detail.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {detail.images.map((im, i) => (
                      <button key={i} onClick={() => setDetailImg(i)} className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === detailImg ? 'border-primary' : 'border-transparent'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.secureUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="space-y-4 p-6">
                <div className="pr-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">{detail.category ?? 'Jewellery'}{detail.subCategory ? ` · ${detail.subCategory}` : ''}</p>
                  <h2 className="mt-1 font-display text-2xl font-medium">{titleCaseName(detail.name)}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">Design {detail.designNumber}</p>
                </div>
                <div className="overflow-hidden rounded-xl border text-sm">
                  <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Metal</span><span className="font-medium">Gold</span></div>
                  {detail.purity && <div className="flex justify-between bg-muted/40 px-4 py-2.5"><span className="text-muted-foreground">Purity</span><span className="font-medium">{detail.purity}</span></div>}
                  {formatWeight(detail.weightGrams) && <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Weight</span><span className="font-medium">{formatWeight(detail.weightGrams)}</span></div>}
                  <div className="flex justify-between bg-muted/40 px-4 py-2.5"><span className="text-muted-foreground">Category</span><span className="font-medium">{detail.category ?? '—'}{detail.subCategory ? ` › ${detail.subCategory}` : ''}</span></div>
                </div>
                {detail.description && detail.description.trim().length >= 4 && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="metal-sheen flex-1 text-[#17120b] font-semibold">
                    <Link href="/store-manager/kiosk"><Plus className="mr-1.5 h-4 w-4" />Order from Catalog</Link>
                  </Button>
                  {detail.hasTryon && (
                    <Button asChild variant="outline" className="border-primary/40 text-primary">
                      <Link href={`/store-manager/try-on?product=${detail.id}`}><Sparkles className="mr-1.5 h-4 w-4" />Try On</Link>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{productMetaLine({ category: detail.category, subCategory: detail.subCategory, purity: detail.purity, weight: detail.weightGrams })}</p>
              </div>
            </div>

            {/* Similar designs */}
            {similar.length > 0 && (
              <div className="border-t px-6 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Similar designs</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {similar.map((p) => {
                    const im = p.images.find((i) => i.isPrimary) ?? p.images[0];
                    return (
                      <button key={p.id} type="button" onClick={() => { setDetail(p); setDetailImg(0); }} className="group text-left" title={titleCaseName(p.name)}>
                        <div className="aspect-square overflow-hidden rounded-lg border bg-[#ece5da]">
                          {im ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={im.secureUrl} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Gem className="h-5 w-5" /></div>}
                        </div>
                        <p className="mt-1 truncate text-[11px] group-hover:text-primary">{titleCaseName(p.name)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}
    </main>
  );
}
