'use client';

import { ArrowLeft, Boxes, ClipboardCheck, Factory, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';

import { StaffLoginForm } from '@/components/auth/StaffLoginForm';
import { Wordmark } from '@/components/landing/Wordmark';
import { useDocumentIdentity } from '@/hooks/use-document-identity';

export function ManufacturerLoginScreen() {
  useDocumentIdentity('Manufacturer Sign In');

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-5 text-[#26221e] sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl overflow-hidden rounded-[24px] border border-[#e5dfd5] bg-white shadow-[0_24px_80px_rgba(55,43,27,0.09)] sm:min-h-[calc(100vh-4rem)]">
        <section className="hidden w-[46%] flex-col justify-between border-r border-[#e8e2d9] bg-[#f2eee7] p-10 lg:flex">
          <Wordmark href="/" size="md" />
          <div className="max-w-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#c99d37] text-white shadow-[0_8px_22px_rgba(174,127,30,0.2)]"><Factory className="h-5 w-5" /></span>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b722b]">Manufacturer workspace</p>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight">Catalog control, retailer approvals, and fulfilment.</h1>
            <p className="mt-4 text-sm leading-6 text-[#746b62]">A private operational workspace for the Jewel Factory manufacturing team.</p>
            <div className="mt-8 grid gap-3 text-sm text-[#504942]">
              <Feature icon={Boxes} text="Manage the master jewellery catalog" />
              <Feature icon={ClipboardCheck} text="Review and approve retailer registrations" />
              <Feature icon={Truck} text="Track production and fulfilment" />
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-[#887e74]"><ShieldCheck className="h-4 w-4 text-[#a77d31]" /> Restricted to authorized manufacturer staff</p>
        </section>

        <section className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Wordmark href="/" size="sm" />
              <span className="rounded-full border border-[#eadfca] bg-[#fbf6ea] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9a7229]">Private access</span>
            </div>
            <div className="mb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b722b]">Welcome back</p>
              <h2 className="mt-2 font-display text-3xl font-medium">Manufacturer sign in</h2>
              <p className="mt-2 text-sm leading-6 text-[#756c63]">Use your Jewel Factory administrator credentials to continue.</p>
            </div>
            <div className="rounded-2xl border border-[#e6e0d7] bg-[#fffdfa] p-5 sm:p-6">
              <StaffLoginForm
                bare
                title=""
                subtitle=""
                loginPath="/api/manufacturer/login"
                redirectTo="/manufacturer/dashboard"
              />
            </div>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#756c63] transition-colors hover:text-[#9a7229]"><ArrowLeft className="h-3.5 w-3.5" /> Back to Jewel Factory</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Boxes; text: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2d7c4] bg-white/70 text-[#a77d31]"><Icon className="h-4 w-4" /></span><span>{text}</span></div>;
}
