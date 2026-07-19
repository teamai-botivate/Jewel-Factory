'use client';

import { ArrowRight, Gem, Sparkles, ShieldCheck, Building2, Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LoginModal } from '@/components/landing/LoginModal';
import { RegisterPromptModal } from '@/components/landing/RegisterPromptModal';
import { titleCaseName, formatWeight } from '@/lib/format';

type ShowcaseProduct = {
  id: string; designNumber?: string; name: string;
  category: string | null; subCategory?: string | null;
  purity?: string | null; weightGrams?: string | null; description?: string | null;
  hasTryon: boolean;
  images: { secureUrl: string; isPrimary: boolean }[];
};

const FEATURES = [
  { icon: Gem, title: 'Gold-only catalog', desc: 'One manufacturer catalog, auto design numbers, no price clutter — quotes stay with the store.' },
  { icon: Sparkles, title: 'AR virtual try-on', desc: 'Customers see how a piece looks on them, right at the store kiosk.' },
  { icon: Search, title: 'Similar-design search', desc: 'Upload a photo and instantly find matching designs in the catalog by visual similarity.' },
  { icon: ShieldCheck, title: 'Customer privacy', desc: 'Walk-in customer details never leave the store — the manufacturer only sees products.' },
  { icon: Building2, title: 'Multi-store ready', desc: 'One retailer, many stores — approvals, restock and orders tracked end to end.' },
];

export default function LandingPage() {
  const [showcase, setShowcase] = useState<ShowcaseProduct[] | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detail, setDetail] = useState<ShowcaseProduct | null>(null);
  const [detailImg, setDetailImg] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/kiosk/catalog', { cache: 'no-store' });
        const json = (await res.json()) as { data?: ShowcaseProduct[] };
        setShowcase((json.data ?? []).slice(0, 8));
      } catch { setShowcase([]); }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-xl font-medium tracking-[0.15em] text-foreground">
            JEWEL <span className="text-[#c9a84c]">FACTORY</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#showcase" className="text-sm text-foreground/80 hover:text-foreground">Catalog</a>
            <Link href="/about" className="text-sm text-foreground/80 hover:text-foreground">About</Link>
            <button onClick={() => setShowLogin(true)} className="text-sm text-foreground/80 hover:text-foreground">Login</button>
            <Link href="/store/register" className="metal-sheen rounded-full px-4 py-2 text-sm font-semibold text-[#17120b]">
              Register here
            </Link>
          </nav>

          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-black/5 bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#showcase" onClick={() => setMenuOpen(false)} className="text-sm">Catalog</a>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm">About</Link>
              <button onClick={() => { setMenuOpen(false); setShowLogin(true); }} className="text-left text-sm">Login</button>
              <Link href="/store/register" onClick={() => setMenuOpen(false)} className="metal-sheen inline-block rounded-full px-4 py-2 text-center text-sm font-semibold text-[#17120b]">
                Register here
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a0824a]">
            Intelligent gold jewellery — made for you
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-normal tracking-tight text-balance sm:text-6xl">
            Welcome to Jewel Factory
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            The B2B platform that connects a gold-jewellery manufacturer to its
            retailer network and their in-store customers — catalog, AR try-on,
            orders and approvals, all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setShowLogin(true)} className="metal-sheen inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#17120b]">
              Login <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/store/register" className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5">
              Register here
            </Link>
          </div>
        </div>
      </section>

      {/* Featured showcase (real catalog, no price) */}
      <section id="showcase" className="border-t border-black/5 bg-[#fbf9f5]/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a0824a]">Featured designs</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">A glimpse of the collection</h2>
            <p className="mt-2 text-sm text-muted-foreground">Register or sign in to browse the full catalog and place orders.</p>
          </div>

          {showcase === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#ece5da]" />
              ))}
            </div>
          ) : showcase.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Catalog coming soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {showcase.map((p) => {
                const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
                return (
                  <button key={p.id} type="button" onClick={() => { setDetail(p); setDetailImg(0); }} className="group overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md" title="View details">
                    <div className="relative aspect-[3/4] bg-[#ece5da]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.secureUrl} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Gem className="h-8 w-8" /></div>}
                      {p.hasTryon && (
                        <span className="metal-sheen absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#17120b]">
                          <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />AR
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{p.name}</p>
                      {p.category && <p className="truncate text-xs text-muted-foreground">{p.category}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link href="/store/register" className="metal-sheen inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#17120b]">
              See the full catalog — Register <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Jewel Factory */}
      <section className="border-t border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a0824a]">Why Jewel Factory</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">Built for gold jewellery, end to end</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/about" className="luxury-link-underline text-sm font-medium text-primary">Learn how it works →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-[#fbf9f5]/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="text-[#C9A84C]">Jewel</span> Factory
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <button onClick={() => setShowLogin(true)} className="hover:text-foreground">Login</button>
            <Link href="/store/register" className="hover:text-foreground">Register</Link>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Powered by Jewel Factory</p>
        </div>
      </footer>

      {/* Product detail modal (public — ends with a Register/Login CTA) */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8" onClick={() => setDetail(null)}>
          <div className="relative w-full max-w-3xl rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} aria-label="Close" className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"><X className="h-4 w-4" /></button>
            <div className="grid md:grid-cols-2">
              {/* Gallery */}
              <div className="bg-[#ece5da] p-4 md:rounded-l-2xl">
                <div className="aspect-square overflow-hidden rounded-xl bg-white">
                  {detail.images[detailImg] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.images[detailImg].secureUrl} alt={detail.name} onClick={() => setZoom(detail.images[detailImg].secureUrl)} className="h-full w-full cursor-zoom-in object-contain" title="Click to enlarge" />
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
                  {detail.designNumber && <p className="mt-0.5 text-sm text-muted-foreground">Design {detail.designNumber}</p>}
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
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Register or sign in to order this design and browse the full catalog.</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Link href="/store/register" className="metal-sheen inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#17120b]">Register here</Link>
                    <button onClick={() => { setDetail(null); setShowLogin(true); }} className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5">Login</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen image zoom */}
      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <button type="button" onClick={() => setZoom(null)} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"><X className="h-5 w-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="preview" onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" />
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <RegisterPromptModal />
    </div>
  );
}
