# Mini Closet by Arti Chandra — Ladies Collection

**Kurti | Suit | Saree | Cord Set** · All India Shipping · Cash on Delivery

A mobile-first e-commerce store for an Indian ethnic-wear boutique, with a
phone-friendly admin dashboard for the owner. Built with **Next.js 16 (App
Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres, Auth, Storage)**,
and made to deploy free on **Vercel + Supabase**.

---

## Contents

1. [Features](#features)
2. [Tech stack & project layout](#tech-stack--project-layout)
3. [Run it locally](#run-it-locally)
4. [Set up Supabase](#set-up-supabase-step-by-step)
5. [Deploy to Vercel](#deploy-to-vercel-free-vercelapp-subdomain)
6. [Using the admin dashboard](#using-the-admin-dashboard)
7. [Security model](#security-model)
8. [Tests & checks](#tests--checks)
9. [What is verified, and what needs your keys](#what-is-verified-and-what-needs-your-keys)
10. [Customising the store](#customising-the-store)
11. [Adding online payments later](#adding-online-payments-later)

---

## Features

**Storefront**

- Brand header with the boutique logo, category navigation (Kurti, Suit, Saree, Cord Set), and an "All India Shipping Available" bar.
- Live search in the header: suggestions as you type, matching product title and category, with keyboard navigation.
- Shop page with live filters (category, text, price range with presets, in-stock only) and sorting. Filters are kept in the URL, so filtered views can be shared.
- Product cards: image, category badge, title, short description, ₹ price with struck-through MRP and % off, an "Only X left" badge when 1–4 are left, an "Out of Stock" badge at 0, a wishlist heart, and **Add to Bag** with a quick size picker.
- Product page: swipeable image gallery, size selector (S, M, L, XL, XXL, Free Size), a quantity selector checked against stock (including what is already in the bag), fabric and care specs, a related-products carousel, and Product JSON-LD for SEO.
- Slide-over bag: live quantities, item count, subtotal, a free-shipping progress bar, remove buttons, and a server re-check of prices and stock each time it opens.
- The bag is saved in `localStorage`, so it survives reloads and the sign-in flow.
- Wishlist: guests get a local wishlist. Signed-in customers get one saved in the database, and their guest items are merged in when they sign in.
- Account menu: sign in, create account, profile, order history, admin dashboard (admins only), and log out.
- **Mandatory sign-in at checkout.** Guests who tap **Checkout** get an inline sign-in / sign-up modal, and their bag is kept.
- Checkout form with validation: full name, Indian mobile (+91 prefixes are accepted), address, city, state/UT, and 6-digit PIN.
- Payment is **Cash on Delivery**. New orders start with status `Pending COD Verification`. An online-payment option is shown as "coming soon".
- Order history with a status timeline, tracking number, a WhatsApp help link, and self-cancellation while the order is still pending.
- Floating WhatsApp button. On a product page it pre-fills *"Hi Mini Closet, I am interested in inquiring about [Product] (Size: [Size])"*; on other pages it uses the general order/shopping message. If the number is not set, it shows a "not configured" indicator instead.
- Help & Support page: shipping (3–7 business days), COD, returns and exchange policy, store hours, contact details and FAQ.
- Polished empty, loading (skeleton), error and 404 states. Touch targets are at least 44 px and the layout follows iOS safe areas.
- Search-engine metadata, Open Graph image, and an app icon made from the logo.

**Admin dashboard (`/admin`)**

- Dashboard: orders awaiting COD verification, orders to ship, today's orders, revenue, recent orders, and a low-stock list.
- Product upload made for phones:
  - **Take photo** opens the camera directly; you can also choose files from the gallery.
  - Photos upload straight to the Supabase Storage bucket `product-images` with live progress bars.
  - Only JPEG, PNG or WebP up to 5 MB are accepted. Large camera photos are resized automatically before upload.
  - You can reorder photos (the first one is the cover) and delete them.
  - Fields: title, category, MRP, offer price (shows the % off), stock, sizes (multi-select), short description, optional fabric/care/details, a **Featured** toggle, and a **Visible in store** toggle.
- Inventory:
  - Quick search, plus filters for category, low stock, out of stock and hidden products.
  - **+ / −** stock buttons use an atomic database function, so stock never goes below zero.
  - You can also type a stock number directly.
  - Featured and visible toggles, edit, and delete with a confirmation step.
- Orders:
  - Filter by status, and search by order number, mobile, PIN or name.
  - Order detail shows the order ID, time, customer, mobile (with Call and WhatsApp buttons), address and PIN, and each item's size, unit price and quantity, plus totals.
  - Status (Pending → Confirmed → Shipped → Delivered / Cancelled), payment status, tracking number and an internal note can all be updated.
  - **Cancelling an order automatically puts its stock back** (exactly once, enforced in the database).

---

## Tech stack & project layout

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Server Components, Server Actions, `proxy.ts` — the Next 16 name for middleware) |
| Language | TypeScript (strict) |
| Styling / icons | Tailwind CSS v4, Lucide React; fonts: Cormorant Garamond, Jost, Dancing Script, Noto Serif Devanagari |
| Backend | Supabase Postgres + Auth (email/password) + Storage |
| Sessions | `@supabase/ssr` — cookie sessions shared by proxy, Server Components, Route Handlers and Client Components |
| Client state | Zustand (bag, wishlist, UI) with `persist` |
| Validation | Zod v4 on the client **and** in every Server Action; constraints repeated in SQL |
| Tests | Vitest (unit + PostgREST integration), SQL behaviour tests on real PostgreSQL |

```
mini-closet/
├── supabase/
│   ├── migrations/20261010000000_mini_closet_init.sql   ← the single SQL migration (schema, RLS, RPCs, storage, seed)
│   └── tests/                                           ← DB behaviour + concurrency tests, PostgREST API tests
├── scripts/
│   ├── generate-seed-sql.mts           ← regenerates the SQL seed block from src/lib/demo-data.ts
│   └── generate-placeholder-images.mjs ← regenerates the demo SVG product illustrations
├── public/
│   ├── brand/  (logo.jpg, banner.jpg)
│   └── products/  (self-contained SVG demo images — replace with real photos from /admin)
└── src/
    ├── proxy.ts                         ← session refresh + /admin, /account, /checkout protection
    ├── app/
    │   ├── layout.tsx                   ← fonts, metadata, providers (user + admin flag from the server)
    │   ├── (store)/                     ← storefront: home, shop, product/[slug], wishlist, checkout,
    │   │                                   account (profile, orders, order detail, password), login, signup, help
    │   ├── admin/                       ← dashboard, products (list/new/edit), orders (list/detail)
    │   ├── auth/callback/route.ts       ← e-mail confirmation & password-reset links
    │   └── api/search/route.ts          ← live search suggestions
    ├── components/  (store/, admin/, account/, orders/, ui/, providers.tsx)
    ├── hooks/       (use-add-to-bag, use-wishlist)
    ├── stores/      (cart, wishlist, ui — Zustand)
    └── lib/
        ├── supabase/ (client.ts, server.ts, proxy.ts)
        ├── actions/  (checkout, cart, account, admin-products, admin-orders — Server Actions)
        ├── data/     (products, orders, mappers — server-only queries)
        ├── auth.ts, validation.ts, cart-logic.ts, catalog.ts, pricing.ts, whatsapp.ts, storage.ts
        ├── constants.ts, store-config.ts (boutique details), demo-data.ts
        └── __tests__/
```

---

## Run it locally

Requirements: Node.js 20.9+ (22 LTS recommended) and npm.

```bash
npm install
cp .env.example .env.local      # fill in your Supabase keys (see next section)
npm run dev                     # http://localhost:3000
```

**Preview mode:** if the Supabase variables are empty, the site still runs. It shows the demo catalogue (the same items the SQL seeds) with a "Preview mode" banner. Browsing, search, filters, bag and wishlist work. Sign-in, checkout and admin show a "Connect Supabase" message.

---

## Set up Supabase (step by step)

### 1. Create the project

1. Sign in at <https://supabase.com> and click **New project** (the Free plan is fine).
2. Choose a name (e.g. `mini-closet`), a strong database password, and the region closest to your customers (e.g. **Mumbai / ap-south-1**).
3. When it is ready, open **Project Settings → API** (or the **Connect** button) and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → optional `SUPABASE_SERVICE_ROLE_KEY`. Server-only, and the app does not need it.

### 2. Set the admin e-mails, then run the SQL migration

1. Open `supabase/migrations/20261010000000_mini_closet_init.sql`.
2. In section **1. Admin allowlist**, replace the placeholders `admin1@minicloset.com` and `admin2@minicloset.com` with the owners' **real** e-mail addresses. They must be able to receive the confirmation e-mail.
3. In Supabase, go to **SQL Editor → New query**, paste the **whole file**, and click **Run**.

   The migration creates:
   - Tables `profiles`, `products`, `orders`, `order_items`, `wishlist_items` and `admin_emails`.
   - Constraints, indexes and triggers.
   - Row-Level Security policies.
   - The `place_order`, `cancel_my_order`, `admin_adjust_stock` and `is_admin` functions.
   - The **`product-images` storage bucket and its policies**.
   - 12 demo products.

   It is safe to run again.

You can change the admins later from the SQL Editor:

```sql
insert into public.admin_emails (email) values ('owner@yourdomain.com');
delete from public.admin_emails where email = 'old@yourdomain.com';
```

### 3. Check the `product-images` bucket

The migration already created it. To confirm, open **Storage** and check that **`product-images`** exists and is marked **Public**, with a 5 MB limit and JPEG/PNG/WebP types allowed. Then open **Storage → Policies**. You should see four policies on `objects`: `product_images_public_read`, `product_images_admin_insert`, `product_images_admin_update` and `product_images_admin_delete`.

<details>
<summary>If your project refused the storage part of the SQL (rare), create it by hand</summary>

1. **Storage → New bucket**:
   - Name `product-images`
   - **Public bucket** on
   - File size limit **5 MB**
   - Allowed MIME types `image/jpeg, image/png, image/webp`
2. Run only this part of the migration (section 8) in the SQL Editor:

```sql
create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
```
</details>

### 4. Configure Auth

1. **Authentication → Sign In / Providers → Email**: keep **Email** enabled.
   - We recommend leaving **Confirm email** on. Admin rights require a confirmed e-mail, so nobody can claim an admin address they don't own.
   - If you turn confirmation off, sign up the admin accounts yourself straight away.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for now. Change it to your Vercel URL after deploying.
   - **Redirect URLs**: add `http://localhost:3000/**` now. After deploying, also add `https://<your-app>.vercel.app/**`.
3. Optional but recommended: Supabase's built-in e-mail sender has a low hourly limit. For real customers, set up custom SMTP under **Authentication → Emails → SMTP Settings** (e.g. Resend, Brevo or Zoho). You can also customise the e-mail templates there.

### 5. Create the admin accounts

Run the app (locally or on Vercel). Then **Create account** with each allowlisted e-mail and click the confirmation link. Once signed in, the account menu shows **Admin dashboard**.

---

## Deploy to Vercel (free `*.vercel.app` subdomain)

1. Push this repository to GitHub (it already is, if you are reading this there).
2. Go to <https://vercel.com/new>, **Import** the repository, and keep the defaults (Vercel detects Next.js; build command `next build`).
3. Before the first deploy, open **Environment Variables** and add these (for *Production*, and *Preview* if you use it):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.vercel.app` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | e.g. `9876543210` (10 digits) or `919876543210` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(optional, never prefixed with `NEXT_PUBLIC_`)* |

4. Click **Deploy**. Vercel gives you a free URL such as `mini-closet.vercel.app`. You can rename the project under **Settings → General → Project Name** to change the subdomain, or add a custom domain later.
5. Back in Supabase, go to **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL.
   - Add `https://<your-app>.vercel.app/**` to **Redirect URLs**.
6. Redeploy whenever you change environment variables (**Deployments → ⋯ → Redeploy**). `NEXT_PUBLIC_*` values are built into the site at build time.

> Free-tier notes: Supabase pauses free projects after about a week with no activity. Open the dashboard to resume. Product photos are optimised by Vercel Image Optimization, which is within Hobby limits for a boutique catalogue.

---

## Using the admin dashboard

- **Add a product from your phone:** open `/admin` → **Add** (bottom bar).
  1. Tap **Take photo** for each angle.
  2. Fill in the title, category, MRP, offer price, stock and sizes.
  3. Tap **Add product**.
- **Restock quickly:** open **Inventory** and use **+ / −** or type a number. At **0** the product shows "Out of Stock" everywhere automatically.
- **Hide vs delete:** the 👁 toggle hides a product without losing it. Delete removes it and its photos; past orders keep their own copy of the title and price.
- **Process a COD order:**
  1. Open the order and use **Call** or **WhatsApp customer** to verify it.
  2. Set it to **Confirmed**.
  3. When it ships, set **Shipped** and add the tracking number.
  4. Set **Delivered** once it arrives. This marks COD payment as **Paid** automatically.
  5. Choosing **Cancelled** asks for confirmation and puts the stock back.

---

## Security model

- **Who is an admin is decided only in the database.** `public.is_admin()` checks the verified JWT user (`auth.uid()`) against the `admin_emails` allowlist, and also requires a **confirmed** e-mail. Nothing the browser controls (local storage, cookies, profile fields, user metadata) can grant admin rights.
- **Three layers protect admin routes:**
  1. `src/proxy.ts` redirects signed-out visitors and non-admins (it calls `is_admin()`).
  2. `app/admin/layout.tsx` checks again on the server (`requireAdmin()`).
  3. Every Server Action calls `assertAdmin()`. Even if all three were bypassed, **RLS** would still reject the write.
- **RLS rules:**
  - **products:** anyone can read active items; only admins can insert, update or delete.
  - **profiles:** each user can read and update only their own row. Grants are column-level, and a trigger blocks any change to `role` or `email`.
  - **orders / order_items:** customers can read only their own. Admins can read everything, but can update only the workflow columns (status, payment status, tracking, note). Totals and items can never be changed through the API.
  - **storage:** anyone can read photos; only admins can write or delete.
- **Orders are placed by one function.** `place_order` is `SECURITY DEFINER` with `search_path = public`. It is the only way to create an order, and it works as follows:
  - Prices come from the `products` table, never from the browser.
  - Each product row is locked with a conditional `UPDATE … WHERE stock >= qty`, processed in a fixed order to avoid deadlocks.
  - The whole order rolls back if any item fails.
  - A test races 6 checkouts for the last unit: exactly one succeeds.
- **Cancelling is safe.** A trigger restores stock exactly once (tracked by `stock_restored`) and blocks reopening a cancelled order.
- **The service-role key is never used by the app** and never reaches the browser. The build was checked for this.
- **Other measures:**
  - `?next=` redirects are limited to paths on this site.
  - Search text is cleaned before it reaches PostgREST filters.
  - Security headers (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.

---

## Tests & checks

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests (validation, bag logic, pricing, filters, WhatsApp links, seed consistency…)
npm run build       # production build
npm run check       # all of the above

npm run test:db     # runs the SQL migration on a throwaway local PostgreSQL (needs PostgreSQL 15+ binaries):
                    #   RLS, admin allowlist, order placement, oversell protection, cancellation stock restore,
                    #   status rules, idempotent re-run, and a 6-way concurrent checkout race
npm run test:api    # the same database behind real PostgREST (downloads it once), exercised with the app's
                    #   own supabase-js queries, RPCs and error mapping
```

---

## What is verified, and what needs your keys

**Verified in this repository's development environment:**

- `npm run lint`, `npm run typecheck`, `npm test` (43 unit tests) and `npm run build` all pass. The build was checked both with and without Supabase variables.
- `npm run test:db` passes on PostgreSQL 16:
  - The migration applies, and applies again cleanly (idempotent).
  - 60+ assertions cover RLS, RPCs, triggers and constraints.
  - In the concurrency test, 6 parallel buyers race for 1 unit and exactly 1 succeeds.
- `npm run test:api` passes (6 end-to-end tests) against **PostgREST 12** using `@supabase/supabase-js`. This covers catalogue search filters, COD order placement and read-back, stock errors, profile role lock, wishlist upserts, and admin stock/order management including cancellation restoring stock.
- The production server was run in a headless browser (Playwright, Chromium), in preview mode, at desktop and mobile sizes. These all worked:
  - Every page renders with no console errors.
  - Size selection is required before adding to the bag.
  - Add to Bag opens the drawer, and the bag survives a reload.
  - Live search suggestions appear.
  - The mobile filters sheet and menu open.
  - There is no horizontal overflow at 390 px.

**Not verified here; needs a real Supabase project and your keys:**

- Supabase Auth itself: sign-up confirmation e-mails, sign-in, password reset, and session cookies in the browser.
  - In the tests above, a locally signed JWT stood in for Supabase Auth, and stub `auth.users` and `storage` tables stood in for Supabase's own schemas.
- The real Storage API: camera/file upload with progress, the public image URLs, and deletion.
- Running the SQL on Supabase itself, in particular the `storage.buckets` insert and the `storage.objects` policies.
- The Vercel deployment and its environment variables.
- WhatsApp deep links opening on a real phone.

After deploying, run through this checklist:

1. Sign up as a customer, confirm the e-mail, add items, and place a COD order.
2. Sign in as an allowlisted admin, upload a product photo from your phone, adjust stock, and move an order through Confirmed → Shipped → Delivered.
3. Cancel a second order and check that the stock comes back.

---

## Customising the store

- **Boutique details:** contact phone and e-mail, address, store hours, Instagram/Facebook links, shipping copy and the return policy all live in `src/lib/store-config.ts`. The phone and e-mail there are placeholders.
- **Brand colours and fonts:** `src/app/globals.css` (`@theme` tokens) and `src/app/layout.tsx`.
- **Logo and banner:** `public/brand/logo.jpg` and `public/brand/banner.jpg`. The site icon is `src/app/icon.png`.
- **Shipping fee:** free from ₹999, otherwise ₹79.
  - The authoritative rule is in the `place_order` SQL function.
  - The on-screen estimate uses `FREE_SHIPPING_THRESHOLD` and `SHIPPING_FEE` in `src/lib/constants.ts`.
  - Change both together; a unit test checks that they match.
- **Demo products:** edit them or delete them from `/admin`. To change the seed itself, edit `src/lib/demo-data.ts` and run `npm run seed:sql`. Demo images are SVG illustrations in `public/products/` and are easy to replace with real photos.

---

## Adding online payments later

The schema is already prepared:

- `orders` has `payment_method` (`cod` | `online`), `payment_status` (`pending`, `paid`, `failed`, `refunded`, …), `payment_provider` and `payment_reference`.
- `place_order` takes a `p_payment_method` parameter. It currently rejects `online`.

A typical Razorpay or Cashfree integration would:

1. Allow `online` in `place_order`, setting `payment_status = 'pending'`.
2. Create the gateway order in a Server Action.
3. Confirm payment in a webhook Route Handler that verifies the signature and marks the order `paid`. This is the one place the server-only service-role key is appropriate.
