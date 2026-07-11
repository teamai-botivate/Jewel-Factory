'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

function SuccessInner() {
  const slug = useParams().storeSlug as string;
  const order = useSearchParams().get('order');
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-medium">Order placed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thank you! Your order{order ? ` (${order})` : ''} has been received. Store staff will review and contact you shortly.
      </p>
      <Link href={`/${slug}/catalog`} className="mt-6"><Button className="metal-sheen text-[#17120b] font-semibold">Continue Shopping</Button></Link>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense><SuccessInner /></Suspense>;
}
