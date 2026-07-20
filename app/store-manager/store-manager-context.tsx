'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type StoreManagerMe = {
  id: string;
  name: string;
  email: string;
  branch: { id: string; name: string; hasRestockPin: boolean };
  retailer: { id: string; name: string; logoUrl: string | null; tagline: string | null; city: string | null };
};

const StoreManagerContext = createContext<StoreManagerMe | null>(null);

export function StoreManagerProvider({ children, value }: { children: ReactNode; value: StoreManagerMe }) {
  return <StoreManagerContext.Provider value={value}>{children}</StoreManagerContext.Provider>;
}

export function useStoreManager(): StoreManagerMe {
  const value = useContext(StoreManagerContext);
  if (!value) throw new Error('useStoreManager outside provider');
  return value;
}
