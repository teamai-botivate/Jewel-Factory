'use client';

import { Gem, PencilLine, Package, ArrowRight, Sparkles, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { useStoreManager } from './layout';

export default function StoreManagerHome() {
  const me = useStoreManager();

  return (
    <div className="space-y-10">
      {/* Hero — same look as the old customer kiosk landing */}
      <section className="relative -mx-4 flex min-h-[46vh] flex-col justify-center overflow-hidden bg-[#211711] px-6 py-14 text-white sm:min-h-[52vh] sm:px-10 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#e4cf8f]">AI Jewellery Showroom</p>
          <h1 className="mt-3 break-words font-display text-4xl font-normal leading-tight sm:text-5xl md:text-6xl">{me.retailer.name}</h1>
          {me.retailer.tagline && <p className="mt-3 max-w-lg text-lg text-white/70">{me.retailer.tagline}</p>}
          <p className="mt-2 max-w-lg text-white/60">
            {me.branch.name} · Show the customer our collection, try pieces on with AR, or match with a photo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/store-manager/kiosk" className="metal-sheen inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#17120b]">
              Explore Catalogue <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/store-manager/try-on" className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/[0.08] px-6 py-3 text-sm font-medium text-white hover:bg-white/[0.14]">
              <Sparkles className="h-4 w-4" /> Virtual Try-On
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card href="/store-manager/kiosk" icon={Gem} title="Catalog" desc="Browse with the customer & place their order." />
          <Card href="/store-manager/search" icon={Search} title="Search by Photo" desc="Find a matching design from a photo." />
          <Card href="/store-manager/try-on" icon={Sparkles} title="Virtual Try-On" desc="Let the customer try pieces on with AR." />
          <Card href="/store-manager/custom-design" icon={PencilLine} title="Custom Design" desc="Capture a custom requirement for HO." />
          <Card href="/store-manager/restock" icon={Package} title="Restock" desc="Order stock for this store." locked={me.branch.hasRestockPin} />
        </div>
      </section>
    </div>
  );
}

function Card({ href, icon: Icon, title, desc, locked }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; locked?: boolean }) {
  return (
    <Link href={href} className="group flex flex-col rounded-2xl border border-[#e4d8c6] bg-[#FBF9F5] p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        {locked && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"><ShieldCheck className="h-3 w-3" />PIN</span>}
      </div>
      <h2 className="mt-3 font-medium">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Open<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}
