import type { Metadata } from 'next';

import { ManufacturerEntryClient } from './ManufacturerEntryClient';

export const metadata: Metadata = { title: 'Manufacturer Sign In' };

export default function ManufacturerEntryPage() {
  return <ManufacturerEntryClient />;
}
