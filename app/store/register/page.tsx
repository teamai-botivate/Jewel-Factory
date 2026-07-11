'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FormState {
  name: string;
  ownerName: string;
  ownerPhone: string;
  email: string;
  password: string;
  logoUrl: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressLandmark: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
  managerPhone: string;
}

const INITIAL: FormState = {
  name: '', ownerName: '', ownerPhone: '', email: '', password: '', logoUrl: '',
  addressStreet: '', addressCity: '', addressState: '', addressPincode: '', addressLandmark: '',
  managerName: '', managerEmail: '', managerPassword: '', managerPhone: '',
};

export default function StoreRegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.managerPassword.length < 6) return setError('Manager password must be at least 6 characters.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/store/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 409) return setError('Email already registered.');
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        return setError(json?.error?.message ?? 'Registration failed. Please try again.');
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-3 py-10">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Registration submitted</h2>
          <p className="text-sm text-muted-foreground">
            You will receive access after the manufacturer reviews and approves your store.
          </p>
          <Link href="/store/login" className="mt-2 inline-block text-sm font-medium underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-3 py-10">
      <form onSubmit={submit} className="w-full max-w-xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="text-[#C9A84C]">Jewel</span> Factory · Store Registration
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Register your store</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submit your details for manufacturer approval.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Store Details</h2>
          <Input placeholder="Store name" value={form.name} onChange={set('name')} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Owner name" value={form.ownerName} onChange={set('ownerName')} required />
            <Input type="tel" placeholder="Owner phone" value={form.ownerPhone} onChange={set('ownerPhone')} required />
          </div>
          <Input type="email" autoComplete="email" placeholder="Store email (used for login)" value={form.email} onChange={set('email')} required />
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} required className="pr-10" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input placeholder="Logo URL (optional)" value={form.logoUrl} onChange={set('logoUrl')} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fixed Delivery Address</h2>
          <Input placeholder="Street address" value={form.addressStreet} onChange={set('addressStreet')} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="City" value={form.addressCity} onChange={set('addressCity')} required />
            <Input placeholder="State" value={form.addressState} onChange={set('addressState')} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Pincode" value={form.addressPincode} onChange={set('addressPincode')} required />
            <Input placeholder="Landmark (optional)" value={form.addressLandmark} onChange={set('addressLandmark')} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Manager Account</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Manager name" value={form.managerName} onChange={set('managerName')} required />
            <Input type="tel" placeholder="Manager phone (optional)" value={form.managerPhone} onChange={set('managerPhone')} />
          </div>
          <Input type="email" autoComplete="off" placeholder="Manager email" value={form.managerEmail} onChange={set('managerEmail')} required />
          <div className="relative">
            <Input type={showManagerPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Manager password (min 6 characters)" value={form.managerPassword} onChange={set('managerPassword')} required className="pr-10" />
            <button type="button" onClick={() => setShowManagerPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showManagerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </section>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <Button type="submit" className="h-11 w-full metal-sheen text-[#17120b] font-semibold" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit registration'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already approved?{' '}
          <Link href="/store/login" className="font-medium underline underline-offset-4">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
