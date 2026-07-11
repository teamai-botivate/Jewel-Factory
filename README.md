# Jewel Factory

Clean single-app rebuild of the B2B jewellery platform. Next.js 15 (App Router) +
Hono BFF + Prisma (Supabase Postgres) + Tailwind v4 + shadcn/ui.

Four actors, one app:
- **Manufacturer** — global catalog (Gold only, no price, auto `JF-XXXX` design numbers), approves stores, receives orders (never sees customer data).
- **Store Owner** — self-registers → manufacturer approves → dashboard, branding, fixed address, managers, B2B restock orders.
- **Store Manager** — approves kiosk / B2B / custom-design orders before they reach the manufacturer.
- **Customer** — no login. In-store kiosk at `/<storeSlug>/…` (URL-path tenancy): browse, AR try-on, visual search, order, custom-design requests.

## Setup

```bash
pnpm install                # installs deps + generates Prisma client
cp .env.example .env        # fill in DATABASE_URL, secrets, Cloudinary, Qdrant, EMBEDDER_URL, SMTP
pnpm db:migrate             # create tables on a fresh Supabase Postgres
pnpm db:seed                # seed 1 manufacturer + categories (+ demo store if SEED_DEMO_STORE=true)
pnpm dev                    # http://localhost:3000
```

Seed a demo store for local testing:
```bash
SEED_DEMO_STORE=true pnpm db:seed
# then visit http://localhost:3000/demo   (kiosk)
```

## Routes

- `/` — landing → `/portal`
- `/portal` — staff login selector (owner / manager / manufacturer)
- `/manufacturer/*` — manufacturer portal
- `/store/*` — store owner + manager portal (login/register/dashboard/orders/profile/managers/intelligence)
- `/<storeSlug>/*` — customer kiosk (home/catalog/detail/search/try-on/custom-design/checkout)

## Key invariants (do not break)

- **No price, no metal** anywhere on customer/store/manufacturer surfaces.
- **Auto design number** `JF-0001` via Postgres sequence.
- **Customer PII never reaches the manufacturer** — kiosk/custom orders are sanitized; manufacturer ships to the **store's fixed address** only.
- **Owner-approve writes `null`** to `*_approved_by` FK columns (owner is not a `store_manager`).
- **3 cookies, 3 secrets** — manufacturer / store / manager, all HMAC (Edge-safe); bcrypt passwords.

## External services (unchanged from the old system)

- **Cloudinary** — image storage (signed direct upload).
- **Qdrant** — vector DB for similar-image search (manufacturer collection).
- **OpenCLIP embedder** — 512-d image vectors (HF Space in prod).
- **SMTP** — password-reset emails (optional; logs to console if unset).

## Scripts

```bash
pnpm dev | build | start | typecheck | lint
pnpm db:migrate | db:deploy | db:seed | db:studio | db:generate
```

See `../LuxeMatch/JEWEL_FACTORY_SYSTEM_DESIGN.txt` for the full blueprint.
