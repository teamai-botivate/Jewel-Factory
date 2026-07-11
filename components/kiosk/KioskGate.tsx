'use client';

import { Lock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKioskStore } from './StoreContext';

/**
 * Device gate for the kiosk. If the store has a kiosk PIN set and this device
 * isn't unlocked, it shows a PIN screen instead of the kiosk. Once unlocked
 * (8h cookie), the store's staff hand the device to customers.
 */
export function KioskGate({ children }: { children: React.ReactNode }) {
  const store = useKioskStore();
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function checkStatus() {
    try {
      const res = await fetch(`/api/kiosk/lock-status/${store.slug}`, { cache: 'no-store' });
      const json = (await res.json()) as { data?: { requiresPin: boolean; unlocked: boolean } };
      if (json.data && (!json.data.requiresPin || json.data.unlocked)) setState('open');
      else setState('locked');
    } catch {
      setState('open'); // fail open — don't brick the kiosk on a network blip
    }
  }

  useEffect(() => { void checkStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/kiosk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, pin }),
      });
      if (!res.ok) { setError('Incorrect PIN. Ask store staff.'); return; }
      setState('open');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (state === 'locked') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <form onSubmit={unlock} className="w-full max-w-xs space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-medium">{store.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the store PIN to start the kiosk.</p>
          </div>
          <Input
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="Store PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="text-center tracking-widest"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="metal-sheen w-full text-[#17120b] font-semibold">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlock'}
          </Button>
          <p className="text-[11px] text-muted-foreground">This device stays unlocked for 8 hours.</p>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
