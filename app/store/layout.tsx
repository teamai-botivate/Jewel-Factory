'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import StoreLayout from '@/components/layout/StoreLayout';

// Public auth pages have no sidebar chrome.
const BARE = [
  '/store/login',
  '/store/register',
  '/store/forgot-password',
  '/store/reset-password',
  '/store/manager/login',
  '/store/manager/forgot-password',
  '/store/manager/reset-password',
];

export default function StoreRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (BARE.includes(pathname)) return <>{children}</>;
  return <StoreLayout>{children}</StoreLayout>;
}
