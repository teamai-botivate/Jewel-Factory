'use client';

import { createContext, useContext } from 'react';

export type KioskStore = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logoUrl: string | null;
  tagline: string | null;
};

const StoreContext = createContext<KioskStore | null>(null);

export function StoreProvider({ store, children }: { store: KioskStore; children: React.ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useKioskStore(): KioskStore {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useKioskStore must be used within a StoreProvider');
  return s;
}
