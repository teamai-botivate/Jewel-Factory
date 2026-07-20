'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ManufacturerLoginScreen } from '@/components/auth/ManufacturerLoginScreen';

export function ManufacturerEntryClient() {
  const [state, setState] = useState<'checking' | 'login'>('checking');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/manufacturer/me', { cache: 'no-store', credentials: 'same-origin' });
        if (res.ok) { window.location.assign('/manufacturer/dashboard'); return; }
      } catch { /* fall through to login */ }
      setState('login');
    })();
  }, []);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f3] text-[#8d8379]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return <ManufacturerLoginScreen />;
}
