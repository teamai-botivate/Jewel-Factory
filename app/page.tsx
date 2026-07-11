import Link from 'next/link';

export default function RootLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a0824a]">
          Jewel Factory
        </p>
        <h1 className="font-display text-4xl font-normal tracking-tight sm:text-5xl">
          Rebuild in progress
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Clean single-app build. Kiosk lives at <code className="rounded bg-muted px-1">/&lt;storeSlug&gt;</code>;
          staff sign in from the portal.
        </p>
      </div>
      <Link
        href="/portal"
        className="metal-sheen rounded-full px-6 py-2.5 text-sm font-semibold text-[#17120b] transition-transform hover:scale-[1.02]"
      >
        Staff Portal
      </Link>
    </main>
  );
}
