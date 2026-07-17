# Jewel Factory — Database Reference

Poora database ka naksha. **Source of truth = `prisma/schema.prisma`** — ye file
usko plain language me samjhati hai. Fresh DB banane ke liye kuch manual nahi:
`pnpm db:deploy` saari migrations chala ke ye poora schema bana deta hai.

- **DB:** PostgreSQL (Supabase). ORM: **Prisma**. Supabase Auth use NAHI — sirf Postgres.
- **IDs:** sab `uuid`. **Timestamps:** `created_at` / `updated_at` har table pe.
- **Columns:** code me camelCase, DB me snake_case (`@map`).

---

## ⚠️ TERMINOLOGY TRAP (sabse zaroori — yaad rakho)

Hierarchy baad me add hui, isliye table naam UI naam se alag hain:

| DB table | Code model | UI / asli matlab |
|---|---|---|
| `stores` | `Store` | **Retailer** (business jo manufacturer se deal karta hai) |
| `store_managers` | `StoreManager` | **HO Manager** (Head-Office, saare approvals) |
| `branches` | `Branch` | **Store** (retailer ki ek dukaan/branch) |
| `branch_managers` | `BranchManager` | **Store Manager** (ek branch chalata hai) |

> Code me "store" ka matlab **Retailer** hai, dukaan nahi. Dukaan = `branch`.

---

## Hierarchy (kaun kis se juda)

```
manufacturers (1)
  └─ stores [RETAILER] (many)        stores.manufacturer_id → manufacturers.id (null jab tak approve na ho)
       ├─ store_managers [HO] (many) store_managers.store_id → stores.id
       └─ branches [STORE] (many)    branches.retailer_id → stores.id
            └─ branch_managers [STORE MGR] (many)  branch_managers.branch_id → branches.id
```

Customer ka koi table nahi — walk-in, PII store nahi hota.

---

## Tables — group ke hisaab se

### AUTH / IDENTITY
| Table | Kya |
|---|---|
| `manufacturers` | Global admin. email + bcrypt password. |
| `stores` (**Retailer**) | slug (kiosk), email+password, registration_status (PENDING/APPROVED/REJECTED), branding (logo/tagline), fixed HO address, kiosk_pin_hash. |
| `store_managers` (**HO Manager**) | store_id, email+password. Unique (store_id, email). |
| `branches` (**Store**) | retailer_id, name, fixed address, phone, **restock_pin_hash**, is_active. |
| `branch_managers` (**Store Manager**) | branch_id, email+password. Unique (branch_id, email). |
| `password_reset_tokens` | email + role + hashed token + expiry. Owner/HO reset. |

### MANUFACTURER CATALOG (global, gold-only, no price)
| Table | Kya |
|---|---|
| `manufacturer_products` | design_number (JF-XXXX unique), name, category, sub_category, weight, purity, has_tryon, status (DRAFT/ACTIVE/ARCHIVED). |
| `manufacturer_product_images` | product_id, cloudinary url, is_primary, sort. |
| `manufacturer_product_embeddings` | product_id, qdrant_point_id — photo-search index. |

### STORE RETAIL CATALOG (B2B delivery pe materialize)
| Table | Kya |
|---|---|
| `products` | store_id (retailer), copied-from manufacturer product on B2B delivery. slug, stock. |
| `product_images` | product_id, url, is_primary. |
| `product_tryon_assets` | try-on PNG — manufacturer product YA store product ka. |

### ORDERS — 3 types (sab HO approval se manufacturer tak)
| Table | Kya |
|---|---|
| `kiosk_orders` | Customer order (Store Manager ne kiosk pe banaya). **branch_id**, branch_name_snapshot, **requirement_note** (editable), **completed_at** (Store Mgr marks). Customer PII **optional/nullable** (system me nahi rakhte). pending_store_approval gate. |
| `kiosk_order_items` | product snapshots (manufacturer_product_id + name/image/category). |
| `kiosk_order_status_history` | status timeline. |
| `b2b_orders` | Restock order (branch → HO → manufacturer). branch_id, branch_name_snapshot, requirement_note, completed_at, pending_manager_approval gate, fulfillment. |
| `b2b_order_items` | product snapshots + design number + image. |
| `b2b_order_status_history` | status timeline. |
| `custom_design_requests` | Custom requirement (branch se). branch_id, specs, reference image, status (PENDING/APPROVED/REJECTED/FORWARDED), completed_at. Customer PII nullable. |
| `custom_design_orders` | Sanitized order to manufacturer (NO customer PII, NO branch/note cols — post-approval artifact). |

### CHAT (naya)
| Table | Kya |
|---|---|
| `order_messages` | **Per-order chat HO ↔ Store Manager.** Polymorphic: (order_kind = KIOSK/B2B/CUSTOM, order_id). sender (HO/STORE_MANAGER), sender_name, body. Scoped by store_id (retailer). Ek table teeno order-types ke liye. |

### TAXONOMY + INTELLIGENCE
| Table | Kya |
|---|---|
| `categories` | 14 categories (source: `lib/categories.ts`). Lookup only. |
| `product_views` / `tryon_events` / `product_sales` | store-scoped analytics signals. |

---

## Enums
`RegistrationStatus`(PENDING/APPROVED/REJECTED) · `ProductStatus`(DRAFT/ACTIVE/ARCHIVED) ·
`OrderStatus`(PENDING/CONFIRMED/PACKED/SHIPPED/DELIVERED/CANCELLED) ·
`CustomStatus` · `CustomOrderStatus` · `JewelleryType` · `ResetRole` ·
**`OrderKind`**(KIOSK/B2B/CUSTOM) · **`MessageSender`**(HO/STORE_MANAGER)

---

## Migrations (order me — `pnpm db:deploy` sab chalata hai)

| # | Folder | Kya add |
|---|---|---|
| 1 | `20260711060610_jewel_factory` | Poora initial schema (manufacturers, stores, managers, catalog, 3 order types, categories, intelligence). |
| 2 | `20260711120000_kiosk_pin` | `stores.kiosk_pin_hash`. |
| 3 | `20260715120000_b2b_item_image` | b2b_order_items image + design snapshots. |
| 4 | `20260717000000_branch_hierarchy` | **branches + branch_managers** tables; orders pe branch_id + requirement_note; kiosk/custom PII nullable. |
| 5 | `20260718000000_order_messages` | **order_messages** table + enums; kiosk/b2b/custom pe completed_at. |

Sab hand-authored + **idempotent** (IF NOT EXISTS / DROP NOT NULL) — partial re-run safe.

### Fresh DB
```bash
pnpm db:deploy   # migrations 1→5, poora schema
pnpm db:seed     # manufacturer + 14 categories
```

### Existing DB ko upgrade (sirf tab jab pehle se data ho)
```bash
pnpm db:deploy            # nayi migrations
pnpm migrate:categories   # purani flat categories → 14-cat taxonomy
pnpm migrate:branches     # har retailer me default "Main Store" branch + purane orders link
```

> Supabase pooler pe `prisma migrate dev` advisory-lock pe atak sakta hai; isliye
> `pnpm db:deploy` (migrate deploy) use karo. Migrations idempotent hain toh safe.

---

## Tenancy (isolation rule)
- Retailer-scoped queries: `storeId` (retailer id) se filter.
- Branch-scoped (Store Manager): `branchId` (guard cookie se; storeId = retailerId bhi set).
- Manufacturer: global catalog.
- `order_messages`: `storeId` se scoped — HO aur Store Manager sirf apne orders ke messages dekh sakte.
- Customer PII kabhi manufacturer tak nahi jaata.
