'use client';

import { Camera, Loader2, Upload, Search as SearchIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductCard, type KioskProduct } from '@/components/kiosk/ProductCard';

export default function KioskSearchPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<KioskProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    setResults(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      try {
        const res = await fetch('/api/kiosk/search/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const json = (await res.json()) as { data?: KioskProduct[]; error?: { message: string } };
        if (!res.ok || json.error) { setError(json.error?.message ?? 'Search failed'); return; }
        setResults(json.data!);
      } catch { setError('Network error'); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
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
          <p className="mb-4 text-sm font-medium">{results.length} similar piece{results.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </main>
  );
}
