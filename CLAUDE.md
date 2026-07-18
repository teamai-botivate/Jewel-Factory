# CLAUDE.md — Jewel Factory (clean rebuild)

Guidance for Claude Code working in this repo.

## What this is

A **clean single-app rebuild** of the old `../LuxeMatch` B2B jewellery platform.
Same features, same UI, zero dead code. Built phase-by-phase from
`../LuxeMatch/JEWEL_FACTORY_SYSTEM_DESIGN.txt` (the blueprint — read it for full context).

**Stack:** Next.js 15 (App Router) + Hono BFF + Prisma (Supabase Postgres) +
Tailwind v4 (CSS-first, no config file) + shadcn/ui (new-york) + lucide + motion.
**Single app** — NO monorepo, NO `packages/*`. Everything under `app/`, `components/`, `lib/`, `hooks/`.

## Actors — MULTI-STORE hierarchy (read SYSTEM_FLOW.txt for the full flow)

> **Terminology (UI name vs code/table):** the DB kept its original table names when
> the hierarchy was added, so watch the mapping:
> - `stores` table + `jf_store` login = **Retailer** (was "Store Owner")
> - `store_managers` table + `jf_manager` login = **HO Manager** (was "Manager")
> - `branches` table = **Store** (a retailer's individual shop) — NEW
> - `branch_managers` table + `jf_branch_manager` login = **Store Manager** — NEW

1. **Manufacturer** — global catalog (Gold only, NO price, auto `JF-XXXX`), approves **Retailer** registrations, receives B2B/kiosk/custom orders. NEVER sees customer data; ships to the **Retailer's fixed HO address**. Portal `/manufacturer/*`.
2. **Retailer** (`stores`) — self-registers → manufacturer approves. Has ONE fixed HO address. Creates its HO Manager, its **Stores (branches)**, and each branch's Store Managers. Portal `/store/*` (login `/store/login`). Branch mgmt at `/store/branches`.
3. **HO Manager** (`store_managers`) — the retailer's head-office manager. Does **ALL approvals** for every branch (kiosk/B2B/custom); can **edit the requirement note**. Portal `/store/*` (login `/store/manager/login`).
4. **Store Manager** (`branch_managers`) — runs ONE branch. Login `/store-manager/login` → that branch's **Kiosk** (customer, no PII) + **Restock** (PIN-walled). Sends orders to HO for approval. Portal `/store-manager/*`.
5. **Customer** — walk-in, NO login, **NO data stored**. The Store Manager helps them on the kiosk. Requirement captured as an editable note only. (Legacy public kiosk `/<storeSlug>/*` still exists but the primary path is the Store Manager's `/store-manager/kiosk`.)

## Core rules (never break)

- **No price, no metal** anywhere (manufacturer form, catalog, kiosk, orders).
- **Auto design number** `JF-0001` via Postgres sequence (`lib/design-number.ts`).
- **Customer PII is NOT stored and never reaches the manufacturer.** Kiosk/custom orders carry only products + qty + an editable `requirementNote`. Customer name/phone are nullable (store manager keeps them outside the system). Manufacturer sees: retailer name, branch name, requirement note, retailer HO ship-to address.
- **The requirement note** (`requirementNote` on kiosk/B2B orders) is written by the Store Manager, **editable by Store Manager AND HO Manager** (PATCH `/store/{kiosk,b2b}-orders/:id/note`), and forwarded to the manufacturer.
- **Restock is PIN-walled** per branch (`branches.restock_pin_hash`, cookie `jf_restock`). Set/reset by Store Manager, HO Manager, or Retailer.
- **Store Manager "My Orders"** (`/store-manager/my-orders`) — their branch's kiosk/custom/restock orders with status (Pending→Approved→**Completed**). Store Manager sets **Completed** (`completedAt`) when the piece reaches the customer/store — a flag, separate from the approval status.
- **Per-order chat** (`order_messages`, polymorphic by `OrderKind`+orderId) — HO Manager ↔ Store Manager, scoped by `storeId`. APIs: `/api/store/messages/:kind/:id` (HO) and `/api/branch-manager/messages/:kind/:id` (Store Manager). Shared UI `components/orders/OrderChat.tsx`.
- **Store Manager storefront = LuxeMatch look** (rich hero + sections), header/nav/branding = Jewel Factory. Gold-only — no blue/diamond stock imagery. Don't simplify it back to a plain dashboard.
- **Owner-approve writes `null`** to `*ApprovedById`/`reviewedById` (owner is not a `StoreManager` row — see `approverIdOrNull` in `lib/api/guards.ts`).
- **Kiosk order items** carry `manufacturerProductId` + snapshots; `product_id` FK is for STORE products only.
- **Branding on kiosk** — store's own logo + name; footer "Powered by AT Jewellers".

## Layout

```
app/
  layout.tsx, page.tsx (landing -> /portal), globals.css
  api/[[...route]]/route.ts   -> mounts lib/api/app.ts (Hono). Exports GET/POST/PATCH/PUT/DELETE.
  portal/                     staff login selector (4 cards: Retailer / HO Manager / Store Manager / Manufacturer)
  manufacturer/               login, dashboard, catalog(+new/[id]), orders(+[id]), kiosk-orders, custom-designs, stores, store-registrations
  store/                      RETAILER + HO MANAGER portal: login/register/forgot/reset, manager/login+forgot+reset, dashboard,
                              pending-approvals (branch + editable note), manufacturer-catalog, b2b-orders, kiosk-orders,
                              custom-designs, intelligence, analytics, profile, managers (HO), branches (stores + branch mgrs + PIN), settings
  store-manager/              STORE MANAGER storefront (login-gated, LuxeMatch-style, real catalog data):
                              home (full-bleed hero + Popular now + Try-On banner + More to explore + rich footer),
                              kiosk, try-on, search, custom-design (image upload), restock (PIN-walled),
                              my-orders (kiosk/custom/restock tabs · status · Mark Completed · per-order chat), CatalogOrderPanel
  [storeSlug]/                LEGACY public kiosk: home, catalog(+[design]), search, try-on, custom-design, checkout(+success)
components/
  ui/           shadcn (51 components)
  auth/         StaffLoginForm, ForgotPasswordForm, ResetPasswordForm
  layout/       ManufacturerLayout, StoreLayout
  manufacturer/ ProductForm (image + tryon upload)
  kiosk/        StoreContext, KioskHeader, ProductCard
  orders/       OrderChat (per-order HO↔Store-Manager chat, reused both sides)
  ar/           ARViewport
lib/
  prisma.ts, env.ts, auth.ts (3 HMAC cookies), password.ts (bcrypt), slug.ts,
  reset-token.ts, email.ts, cloudinary.ts, upload-client.ts, design-number.ts,
  search.ts (embedder+qdrant), ar-engine/ (copied wholesale)
  categories.ts (14-category taxonomy + sub-categories), format.ts (titleCaseName/formatWeight)
  api/  app.ts, envelope.ts, guards.ts, routes/* (incl. branch-manager.ts)
  db/   manufacturer-catalog, manufacturer-dashboard, stores, store-read, store-dashboard,
        orders, custom-design, intelligence, indexing, branches (Branch + BranchManager CRUD)
hooks/  use-api, use-guest-cart, use-b2b-cart, use-try-on-engine
prisma/ schema.prisma, seed.ts
```

## Auth (4 login cookies + 2 PIN cookies)

| Cookie | Role (UI) | Secret | Payload |
|---|---|---|---|
| `jf_manufacturer` | Manufacturer | `MANUFACTURER_SECRET` | `manufacturerId` |
| `jf_store` | Retailer | `STORE_SECRET` | `storeId` (= retailerId) |
| `jf_manager` | HO Manager | `MANAGER_SECRET` | `managerId.storeId` |
| `jf_branch_manager` | Store Manager | `BRANCH_MANAGER_SECRET` (falls back to `MANAGER_SECRET`) | `bmId.branchId.retailerId` |
| `jf_kiosk` | legacy kiosk device unlock | `STORE_SECRET:kiosk` | `storeId` |
| `jf_restock` | branch restock unlock (PIN) | `STORE_SECRET:restock` | `branchId` |

All HMAC-SHA256 (Web Crypto, Edge-safe, `lib/auth.ts`). Passwords bcrypt (`lib/password.ts`, Node-only).
Guards in `lib/api/guards.ts`: `manufacturerGuard`, `storeGuard` (retailer/owner-only), `managerGuard` (owner OR HO manager, sets `isOwner`), `branchManagerGuard` (store manager; sets `branchId` + `branchManagerId` + `storeId`=retailerId for tenancy). Branch-manager API is `/api/branch-manager/*` (`lib/api/routes/branch-manager.ts`), per-route guarded.

## Tenancy

- Store-scoped queries filter by `storeId` (from cookie via guard, never body).
- Manufacturer queries filter by `manufacturerId`.
- Kiosk: `storeSlug` from URL resolves the store server-side (`app/[storeSlug]/layout.tsx` + kiosk API bodies carry `storeSlug`).
- Prisma is the data layer — no service-role RLS-bypass footgun; add checks in code.

## Order flows

- **Kiosk:** customer → `placeKioskOrder` (pendingStoreApproval) → manager approves (`forwardedToManufacturer=true`) → manufacturer (PII stripped, ships to store address).
- **B2B:** store cart → `placeB2bOrder` (pendingManagerApproval) → manager approves → manufacturer → on DELIVERED, `fulfillB2bOrder` materializes into store `Product` table (transactional).
- **Custom design:** kiosk form → `CustomDesignRequest` (PII) → manager approves → `forwardCustomRequest` creates sanitized `CustomDesignOrder` (transactional, atomic) → manufacturer.

## Store registration → approval → email

- Store self-registers at `/store/register` (status `PENDING`, `isActive=false`, no `manufacturerId`) + creates its first manager in the same transaction.
- Manufacturer approves at `/manufacturer/store-registrations` → `approveRegistration` sets `APPROVED` + `isActive=true` + links `manufacturerId`, and returns owner email + slug + manager emails.
- On approve, the store OWNER gets a **store-approved email** (`storeApprovedEmail` in `lib/email.ts`, sent fire-and-forget from `manufacturer-stores.ts`): confirmation + owner/manager login emails + portal URLs + kiosk URL (`/<slug>`) + forgot-password links. **No passwords** in the email (bcrypt-hashed; owner set them at registration). Email only sends if SMTP is configured, else logs to console — never blocks approval.
- Store + managers are NOT hardcoded — only `pnpm db:seed` with `SEED_DEMO_STORE=true` creates the demo store for testing.

## External services (same as old system)

- **Cloudinary** — signed direct upload (`lib/cloudinary.ts`). Buckets: catalog, tryon (png only), logo.
- **Qdrant** — one collection `QDRANT_MANUFACTURER_COLLECTION` (customers search manufacturer catalog).
- **OpenCLIP embedder** — 512-d visual search (`lib/search.ts`, `EMBEDDER_URL`, `POST /embed/image`, Bearer auth). Indexing fire-and-forget on image add.
- **AI-Features service** (separate Python repo: `github.com/teamai-botivate/Jewel-Factory_AI`, deploy on HF Docker Space) — **ONE service for all AI**: `/catalog`, `/transparent`, `/describe` (OpenAI, gated by `x-api-key`=`AI_FEATURES_API_KEY`) **and** `/embed/*` (OpenCLIP, merged in — same contract as the old embedder). Env: `AI_FEATURES_URL` + `AI_FEATURES_API_KEY`. **The embedder is now part of this service** — point `EMBEDDER_URL` at the same Space (`/embed/image` unchanged). If `AI_FEATURES_URL` is unset, the manufacturer "Generate with AI" button is hidden and manual add works as before.
  - **Manufacturer Add Design → "Generate with AI"**: raw photo (temp, not saved) → `/api/manufacturer/ai/{describe,catalog,transparent}` (server proxy `lib/api/routes/manufacturer-ai.ts`, forwards with `x-api-key`) → auto-fills name/description + catalog image + transparent try-on PNG. All editable; regenerate + custom `extraInstructions` supported. Uses the existing `handleImageUpload`/`handleTryonUpload` flow (base64 → File).
- **SMTP** — password reset + store-approval email (`lib/email.ts`; logs to console if unset, never blocks the flow). On Render: use **port 465** (587 is blocked → `ETIMEDOUT`) and the transporter forces **`family: 4`** (Render can't reach Gmail over IPv6 → `ENETUNREACH`). `lib/email.ts` logs `[email] sent to …` / `[email] send FAILED: …` so Render Logs show the real reason.

## Commands

```bash
pnpm install                    # deps + prisma generate
pnpm dev | build | start | typecheck | lint
pnpm db:migrate | db:deploy | db:seed | db:studio | db:generate
SEED_DEMO_STORE=true pnpm db:seed   # + demo store at /demo
pnpm migrate:categories             # map legacy flat categories -> 14-cat taxonomy (existing DB only)
pnpm migrate:branches               # Option-A: default "Main Store" branch per retailer + link old orders (existing DB only)
```

## Setup for a fresh DB

1. `cp .env.example .env` — fill DATABASE_URL + DIRECT_URL (Supabase), secrets (min 32 chars: MANUFACTURER/STORE/MANAGER/**BRANCH_MANAGER**), Cloudinary, Qdrant, EMBEDDER_URL (+ optional AI_FEATURES_URL/AI_FEATURES_API_KEY for AI generate), SMTP. No `NEXT_PUBLIC_SUPABASE_*` — app uses Postgres directly, not Supabase Auth.
2. `pnpm db:deploy` (runs all 5 migrations → full schema, no manual SQL) then `pnpm db:seed` (1 manufacturer + 14 categories).
3. `pnpm dev`.
**Handover / client onboarding: `HANDOVER.md` (zero-to-live). Schema: `DATABASE.md`. Flow: `SYSTEM_FLOW.txt`. Detailed setup: `SETUP_GUIDE.md`. Pending work / checklist: `PENDING.md`.**

## Migrations (5, all Prisma-managed, idempotent)
`0001 jewel_factory` · `kiosk_pin` · `b2b_item_image` · `branch_hierarchy` (branches + branch_managers + branch_id/requirement_note on orders + nullable PII) · `order_messages` (order_messages table + OrderKind/MessageSender enums + completed_at on kiosk/b2b/custom). `pnpm db:deploy` applies all. `migrate:categories`/`migrate:branches` = one-off upgrades for an EXISTING DB only.

## Status

**Multi-store hierarchy + Store Manager storefront + per-order chat: all on branch `retailer-multistore`.**
Retailer → HO Manager → Stores(branches) → Store Managers → Customer. Store Manager has a
full LuxeMatch-style storefront (hero/catalog/try-on/search/custom/restock) + My Orders
(status, Mark Completed, HO chat). HO ↔ Store Manager per-order chat both sides.
**Live DB (Supabase) has all 5 migrations applied** (branch_hierarchy + order_messages done;
`migrate:branches` run once). `master` stays at the pre-hierarchy state — **merge `retailer-multistore` → `master` when handing over.**

**Latest session (all on `retailer-multistore`):**
- **AI Add Design** — manufacturer "Generate with AI" (raw photo → name/description + catalog image + transparent try-on PNG via AI-Features); field order = specs → AI panel → name → rest; new products default **Active**; generated catalog/try-on images click-to-zoom (lightbox). Race-lock on `ensureProductId` (no double product). AI proxy lowercases the HF host (307 body-drop → 502 fix) and surfaces the real upstream error. **AI-Features (`../AI-Features`, HF Space `Botivate2026/ai-workspace`) currently returns OpenAI `429 insufficient_quota` → add OpenAI credit to make generation work.**
- **Transparent try-on prompt** (AI-Features `lib/prompts.py`) — necklace + bangle now render FRONT drape only (open U/V, no back chain/clasp) so 2D overlay sits correctly; regenerate old assets after HF redeploy.
- **Store Manager kiosk + search** — product cards open a detail modal (gallery, specs, description, **Try On** when AR, **Similar designs**); modal image click-to-zoom; close X at card top-right; Try-On page reads `?product=` (auto-select) + `?back=` (Back button to originating page).
- **Login fix** — `StaffLoginForm` resets loading on a server error (wrong creds no longer freeze the button). Affects all 4 logins.
- **HO ↔ Store Manager chat** added on the HO custom-designs page (was only on pending-approvals). Store Manager no longer sees the manufacturer's granular status ("Approved by HO" only).
- **Nav** — removed "Kiosk PIN" from the Retailer/HO sidebar (managed per-Store on Branches); "Stores (Branches)" now visible to the **HO Manager** too; "Store Profile" → "**Retailer Profile**".
- **Order filters (all lists)** — reusable `components/orders/OrderFilters.tsx` + `lib/order-filters.ts`: order-ID search + status dropdown everywhere; **Store (branch) filter** on HO lists (kiosk/custom/b2b) with a branch badge per row; **Retailer filter** on Manufacturer lists (kiosk/custom/orders); Store Manager My Orders searches by order-ID + derived status bucket. HO custom list gained `branch{name}` via `listCustomRequests`.
- **Portal** — "JEWEL FACTORY" text wordmark (was the stale LuxeMatch logo image).

## Gotchas

- Catch-all route MUST export every method incl. **PUT** (password resets use PUT). The old LuxeMatch app 405'd because PUT was missing.
- Manufacturer product delete removes children + detaches store products, else archives (FK-safe).
- ar-engine copied verbatim — `overlayMath.ts` is the shared source of truth; mirror landmarks once then smooth; Y-down camera. Don't fight it.
- Try-on `Calibration` uses snake_case fields (`pivot_x`, `x_offset`, …).
- No price component anywhere — audit before adding product UI.
- **Auth cookies = `SameSite=Lax` + `credentials:'same-origin'`** on every authed fetch; login uses `window.location.assign` (not router.push) so the cookie is committed before the dashboard's first API call. Strict + router.push caused a login→redirect loop.
- **Hono `.use('*', guard)` leaks across sub-apps mounted on the same base.** store-portal + store-catalog apply `storeGuard` PER-ROUTE (not `.use('*')`) so a manager's `/store/dashboard` isn't 401'd by an owner-only wildcard. Only store-ops keeps a wildcard (managerGuard). Don't add a second `.use('*')` on `/store`.
- **SMTP on Render:** port **465** (587 blocked → ETIMEDOUT) + `family: 4` in the transporter (IPv6 unreachable → ENETUNREACH). `family` isn't in nodemailer's TS type — cast `as nodemailer.TransportOptions`.
- **Order-item images:** kiosk items snapshot the image at order time; B2B items snapshot image + design number (migration `20260715120000_b2b_item_image`) — only orders placed AFTER that commit have B2B images. Store list APIs `include: { items: true }`; thumbnails are `h-20 w-20 object-contain` on white.
- **Migrations on Supabase pooler** hit an advisory-lock timeout via `migrate dev`. Workaround used: apply DDL with `prisma db execute --url <DIRECT_URL>`, hand-write the migration file, and insert the `_prisma_migrations` row manually. The `20260717000000_branch_hierarchy` migration is hand-authored + idempotent (IF NOT EXISTS / DROP NOT NULL) so a partial re-run is safe. Render runs `pnpm run start` (`next start`) — migrations are NOT auto-applied; use `pnpm render-start` or Docker to auto-migrate.
- **Terminology trap:** `stores` table = Retailer, `store_managers` = HO Manager, `branches` = Store, `branch_managers` = Store Manager. Don't assume "store" means a shop in code — it's the retailer. New shop-level things go on `branches`.
- **Branch tenancy:** `branchManagerGuard` sets `storeId = retailerId`, so existing retailer-scoped DB helpers work unchanged; `branchId` narrows to the shop. Kiosk/restock orders from a branch carry `branchId` + `branchNameSnapshot`.
- **Kiosk sanitize is a DENYLIST** (`manufacturer-orders.ts sanitizeKiosk`) — it drops `customerName/Phone/Email/deliveryAddress` and lets everything else (incl. `branchNameSnapshot`, `requirementNote`) pass through. Any NEW PII field must be added to the drop-list.
- **`CustomDesignOrder` has NO branch/requirement columns** (only the sanitized snapshot). To surface branch/note on the manufacturer's custom-design view you'd add columns there + copy them in `forwardCustomRequest`.
- **Full-bleed sections:** the store-manager `layout` `<main>` is full-width (no `max-w`). Sections use `max-w-[1400px] mx-auto px-6`. For an edge-to-edge band use `left-1/2 w-screen -translate-x-1/2` — **NOT** `left-1/2 right-1/2 -mx-[50vw]` (that combo collapsed the hero). Non-home store-manager pages add their own `px-4 py-6` since the layout no longer pads.
- **`order_messages` is polymorphic** (`orderKind` + `orderId`, no FK) so one table serves kiosk/b2b/custom chat. Always query it scoped by `storeId`. `OrderChat.tsx` is shared — pass `viewer` ('HO' | 'STORE_MANAGER') and the right `basePath`.
- **`completedAt` is a flag, not a status** — set by the Store Manager via `markKiosk/B2b/CustomCompleted(branchId, id)`. Doesn't touch the approval status enum (avoids clashing with the existing flow).
- **Store Manager storefront images must be gold** (gold-only business). Try-On banner pulls a real catalog piece, not a stock photo; hero background is a gold showroom. Don't reintroduce blue/diamond stock imagery.
- **Order filters are CLIENT-SIDE.** `OrderFilters` (search + status + group dropdown) + `lib/order-filters.ts` (`matchOrder`, `uniqueBranchOptions`, `*_STATUS_OPTIONS`). Pages fetch all orders then filter in a `useMemo`. The "group" dropdown is generic: HO passes the **branch** name (`branchNameSnapshot`), Manufacturer passes the **retailer** name (`storeNameSnapshot`/`storeName`) into `matchOrder`'s `branchName`. If you paginate/switch to server-side, move this into the API query params instead. Store Manager filters on a DERIVED bucket (`bucketOf`/`customBucketOf`), not the raw enum (it never shows manufacturer status).
- **Login handler must reset loading on error.** `StaffLoginForm.submit` sets `setLoading(false)` before the error `return`; only the success path (which `window.location.assign`s away) leaves it true. Don't remove it or wrong creds freeze the button again.
- **AI generation runs on OpenAI** (via AI-Features). A `502` on `/api/manufacturer/ai/*` usually wraps an OpenAI `429 insufficient_quota` — check OpenAI billing, not the app. HF Space `AI_FEATURES_URL` must be **lowercase** (capital host 307-redirects and drops the POST body).
