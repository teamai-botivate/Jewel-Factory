'use client';

import { Gem, PencilLine, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { useStoreManager } from './layout';

export default function StoreManagerHome() {
  const me = useStoreManager();

  const cards = [
    {
      href: '/store-manager/kiosk',
      icon: Gem,
      title: 'Kiosk',
      desc: 'Browse the catalog with a customer and place their order. No PIN — hand the device to the customer.',
      cta: 'Open kiosk',
    },
    {
      href: '/store-manager/custom-design',
      icon: PencilLine,
      title: 'Custom Design',
      desc: "Capture a customer's custom requirement and send it to Head Office for approval.",
      cta: 'New request',
    },
    {
      href: '/store-manager/restock',
      icon: Package,
      title: 'Restock',
      desc: 'Order stock for this store from the manufacturer catalog. PIN-protected — for staff only.',
      cta: 'Restock',
      locked: me.branch.hasRestockPin,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Welcome, {me.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{me.retailer.name} · {me.branch.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, desc, cta, locked }) => (
          <Link key={href} href={href} className="group flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              {locked && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"><ShieldCheck className="h-3 w-3" />PIN</span>}
            </div>
            <h2 className="mt-3 font-medium">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">{cta}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
