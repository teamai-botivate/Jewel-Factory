'use client';

import { Store, Gem, X } from 'lucide-react';

import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

/**
 * Landing-page login popup. Two columns: Retailer (Head Office) and Store
 * Manager, each with an embedded compact login form (reuses StaffLoginForm in
 * `bare` mode). Manufacturer login is intentionally NOT here — it is reached
 * only by visiting /manufacturer directly.
 */
export function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-1.5 text-foreground/70 hover:bg-black/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="text-[#C9A84C]">Jewel</span> Factory
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium">Sign in</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Choose your account type.</p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Retailer (Head Office) */}
          <div className="rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Retailer</p>
                <p className="text-xs text-muted-foreground">Head Office — approvals, stores, orders</p>
              </div>
            </div>
            <StaffLoginForm
              bare
              brandWordmark={false}
              title=""
              subtitle=""
              loginPath="/api/store/login"
              redirectTo="/store/dashboard"
              forgotHref="/store/forgot-password"
              footerLinks={[{ prompt: 'New retailer?', label: 'Register here', href: '/store/register' }]}
            />
          </div>

          {/* Store Manager */}
          <div className="rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Gem className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Store Manager</p>
                <p className="text-xs text-muted-foreground">Run your store — kiosk, try-on, restock</p>
              </div>
            </div>
            <StaffLoginForm
              bare
              brandWordmark={false}
              title=""
              subtitle=""
              loginPath="/api/branch-manager/login"
              redirectTo="/store-manager"
              footerLinks={[{ prompt: 'No account?', label: 'Ask your Retailer to add you', href: '/store/login' }]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
