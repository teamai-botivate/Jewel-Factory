'use client';

import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Wordmark } from '@/components/landing/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ForgotPasswordForm({
  title,
  apiPath,
  backHref,
}: {
  title: string;
  apiPath: string; // e.g. /api/store/forgot-password
  backHref: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true); // always show success (anti-enumeration)
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_32rem_at_50%_-10%,rgba(201,168,76,0.16),transparent_60%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JF.avif" alt="" aria-hidden className="pointer-events-none absolute -right-16 top-10 hidden w-[28rem] max-w-none opacity-[0.04] lg:block" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <Wordmark href="/" size="sm" />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Jewel Factory</span><span className="sm:hidden">Home</span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-5 rounded-3xl border bg-card p-6 shadow-xl sm:p-8">
          <div className="text-center">
            {sent && (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <MailCheck className="h-6 w-6" />
              </div>
            )}
            <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {sent
                ? 'If an account exists, a reset link has been sent to that email.'
                : 'Enter your email and we will send a reset link.'}
            </p>
          </div>

          {!sent && (
            <form onSubmit={submit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="h-11 w-full metal-sheen text-[#17120b] font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href={backHref} className="font-medium text-primary underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
