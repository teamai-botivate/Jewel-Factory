'use client';

import { Search, Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { useKioskStore } from './StoreContext';
import { useGuestCart } from '@/hooks/use-guest-cart';

export function KioskHeader() {
  const store = useKioskStore();
  const cart = useGuestCart();
  const base = `/${store.slug}`;

  return (
    <header className="fixed top-0 z-50 w-full">
      {/* Store branding strip */}
      <div className="flex items-center justify-between bg-[#191511] px-4 py-1.5 text-[11px]">
        <div className="flex items-center gap-2 text-[#e4cf8f]">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="h-5 w-auto object-contain" />
          ) : null}
          <span className="font-semibold text-[#f8e7af]">{store.name}</span>
          {store.city && <span className="text-[#c9b98b]">· {store.city}</span>}
        </div>
        <span className="text-[#5a4f38]">Powered by AT Jewellers</span>
      </div>

      {/* Nav bar */}
      <div className="flex h-14 items-center justify-between border-b bg-[#fbf8f1]/90 px-4 backdrop-blur-lg">
        <Link href={base} className="font-display text-lg font-medium tracking-tight">{store.name}</Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href={`${base}/catalog`} className="luxury-link-underline">Catalog</Link>
          <Link href={`${base}/custom-design`} className="luxury-link-underline">Custom Design</Link>
          <Link href={`${base}/try-on`} className="luxury-link-underline">Try-On</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href={`${base}/search`} className="text-foreground/70 hover:text-foreground"><Search className="h-5 w-5" /></Link>
          <Link href={`${base}/checkout`} className="relative text-foreground/70 hover:text-foreground">
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{cart.count}</span>}
          </Link>
          <Link href={`${base}/try-on`} className="metal-sheen hidden rounded-full px-3 py-1.5 text-xs font-semibold text-[#17120b] sm:inline-flex sm:items-center">
            <Sparkles className="mr-1 h-3.5 w-3.5" />Try On
          </Link>
        </div>
      </div>
    </header>
  );
}
