import Link from 'next/link';

export const metadata = { title: 'Settings' };

export default function StoreSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
      <div className="rounded-xl border bg-card divide-y">
        <Link href="/store/profile" className="block px-4 py-3 hover:bg-muted/30">
          <p className="text-sm font-medium">Store Profile & Branding</p>
          <p className="text-xs text-muted-foreground">Name, fixed address, logo, tagline.</p>
        </Link>
        <Link href="/store/managers" className="block px-4 py-3 hover:bg-muted/30">
          <p className="text-sm font-medium">Managers</p>
          <p className="text-xs text-muted-foreground">Add or remove store managers.</p>
        </Link>
      </div>
    </div>
  );
}
