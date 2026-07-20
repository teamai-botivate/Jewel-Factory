'use client';

import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Wordmark } from '@/components/landing/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FooterLink = { label: string; prompt?: string; href: string };

export function StaffLoginForm({
  title,
  subtitle,
  loginPath,
  redirectTo,
  footerLinks = [],
  forgotHref,
  bare = false,
}: {
  title: string;
  subtitle: string;
  loginPath: string; // e.g. /api/store/login
  redirectTo: string; // e.g. /store/dashboard
  /** @deprecated no longer used — the wordmark now lives in the page top bar. */
  brandWordmark?: boolean;
  footerLinks?: FooterLink[];
  forgotHref?: string;
  // bare = render just the form (no full-screen wrapper/background) so it can be
  // embedded inside a modal (e.g. the landing-page login popup).
  bare?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(loginPath, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | { data?: unknown }
        | null;
      if (!res.ok || (json && 'error' in json && json.error)) {
        setError(
          json && 'error' in json && json.error?.message
            ? json.error.message
            : 'Invalid email or password',
        );
        setLoading(false); // reset so the user can correct credentials and retry
        return;
      }
      // Full-page navigation (not router.push) so the just-set auth cookie is
      // committed and sent on the dashboard's first API call. Keep loading true
      // through the redirect.
      window.location.assign(redirectTo);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  const form = (
      <form
        onSubmit={submit}
        className={bare ? 'w-full space-y-4' : 'w-full max-w-sm space-y-5 rounded-3xl border bg-card p-6 shadow-xl sm:p-8'}
      >
        {(title || subtitle) && (
          <div className="text-center">
            {title && <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        <div className="space-y-3">
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {forgotHref && (
          <div className="text-right">
            <Link href={forgotHref} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              Forgot password?
            </Link>
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <Button type="submit" className="h-11 w-full metal-sheen text-[#17120b] font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
        </Button>

        {footerLinks.map((f) => (
          <p key={f.href} className="text-center text-sm text-muted-foreground">
            {f.prompt ? `${f.prompt} ` : ''}
            <Link href={f.href} className="font-medium underline underline-offset-4">
              {f.label}
            </Link>
          </p>
        ))}
      </form>
  );

  if (bare) return form;
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Soft gold glow backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_32rem_at_50%_-10%,rgba(201,168,76,0.16),transparent_60%)]" />
      {/* Faint JF monogram watermark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JF.avif" alt="" aria-hidden className="pointer-events-none absolute -right-16 top-10 hidden w-[28rem] max-w-none opacity-[0.04] lg:block" />

      {/* Top bar — wordmark + back to Jewel Factory */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <Wordmark href="/" size="sm" />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Jewel Factory</span><span className="sm:hidden">Home</span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{form}</div>
      </div>
    </div>
  );
}
