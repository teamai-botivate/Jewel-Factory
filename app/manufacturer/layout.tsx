'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import ManufacturerLayout from '@/components/layout/ManufacturerLayout';

export default function ManufacturerRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Login page + the /manufacturer entry (login popup) have no sidebar chrome.
  if (pathname === '/manufacturer/login' || pathname === '/manufacturer') return <>{children}</>;
  return <ManufacturerLayout>{children}</ManufacturerLayout>;
}
