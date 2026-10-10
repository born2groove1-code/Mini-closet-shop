-- =============================================================================
-- Mini Closet by Arti Chandra — complete database migration
-- Ladies Collection: Kurti | Suit | Saree | Cord Set
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It is written to be re-runnable: tables use IF NOT EXISTS, functions use
-- CREATE OR REPLACE, policies are dropped and recreated, seed rows use
-- ON CONFLICT DO NOTHING.
--
-- Contents
--   1. Admin allowlist + is_admin()
--   2. profiles (+ auth.users triggers, role lock)
--   3. products
--   4. wishlist_items
--   5. orders / order_items (+ status guard & automatic stock restore)
--   6. RPCs: place_order, cancel_my_order, admin_adjust_stock
--   7. Row-Level Security policies and grants
--   8. Storage bucket `product-images` + storage policies
--   9. Seed data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Admin allowlist
--    Replace the placeholder addresses with the owners' real e-mail addresses
--    (they must be able to receive the Supabase confirmation e-mail).
--    Manage later with:
--      insert into public.admin_emails (email) values ('owner@example.com');
--      delete from public.admin_emails where email = 'old@example.com';
-- -----------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email      text primary key check (email = lower(btrim(email)) and email like '%@%'),
  created_at timestamptz not null default now()
);

insert into public.admin_emails (email) values
  ('admin1@minicloset.com'),
  ('admin2@minicloset.com')
on conflict (email) do nothing;

-- The single source of truth for admin status. Checks the *verified* JWT
-- subject (auth.uid()) against the allowlist and requires a confirmed e-mail,
-- so nothing the client controls (local storage, cookies, profile fields,
-- user_metadata) can grant admin rights.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text check (full_name is null or char_length(full_name) <= 120),
  phone        text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  address_line text check (address_line is null or char_length(address_line) <= 300),
  city         text check (city is null or char_length(city) <= 80),
  state        text check (state is null or char_length(state) <= 80),
  pincode      text check (pincode is null or pincode ~ '^[1-9][0-9]{5}$'),
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every sign-up gets a profile with the default "customer" role. The role is
-- informational (shown in the UI); authorization always goes through is_admin().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), ''),
    case
      when new.email_confirmed_at is not null
       and exists (select 1 from public.admin_emails a where a.email = lower(new.email))
      then 'admin' else 'customer'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile e-mail/role in sync when a user confirms or changes e-mail.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
     set email = lower(new.email),
         role = case
           when new.email_confirmed_at is not null
            and exists (select 1 from public.admin_emails a where a.email = lower(new.email))
           then 'admin' else 'customer'
         end
   where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_user_updated();

-- Keep profile roles in sync when the allowlist itself changes.
create or replace function public.sync_admin_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
     set role = case
       when u.email_confirmed_at is not null
        and exists (select 1 from public.admin_emails a where a.email = lower(u.email))
       then 'admin' else 'customer'
     end
    from auth.users u
   where u.id = p.id;
  return null;
end;
$$;

drop trigger if exists admin_emails_sync_roles on public.admin_emails;
create trigger admin_emails_sync_roles
  after insert or update or delete on public.admin_emails
  for each statement execute function public.sync_admin_roles();

-- Belt and braces: even if column grants are loosened by mistake, API roles
-- can never change a profile's role or e-mail.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.role is distinct from old.role or new.email is distinct from old.email
          or new.id is distinct from old.id) then
    raise exception 'PROFILE_FIELD_LOCKED' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- -----------------------------------------------------------------------------
-- 3. Products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  title       text not null check (char_length(btrim(title)) between 2 and 120),
  category    text not null check (category in ('kurti', 'suit', 'saree', 'cord-set')),
  description text not null default '' check (char_length(description) <= 500),
  details     text not null default '' check (char_length(details) <= 4000),
  fabric      text not null default '' check (char_length(fabric) <= 200),
  care        text not null default '' check (char_length(care) <= 500),
  mrp         numeric(10, 2) not null check (mrp >= 0),
  price       numeric(10, 2) not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  sizes       text[] not null default '{}'
              check (cardinality(sizes) >= 1
                     and sizes <@ array['S', 'M', 'L', 'XL', 'XXL', 'Free Size']::text[]),
  images      text[] not null default '{}' check (cardinality(images) <= 8),
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  -- "Out of Stock" is derived automatically from the quantity.
  in_stock    boolean generated always as (stock > 0) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint products_price_not_above_mrp check (price <= mrp)
);

create index if not exists products_category_idx on public.products (category) where is_active;
create index if not exists products_featured_idx on public.products (is_featured) where is_active;
create index if not exists products_created_idx on public.products (created_at desc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Wishlist (persistent for signed-in customers)
-- -----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 5. Orders
--    payment_method / payment_status / payment_provider / payment_reference
--    are ready for an online gateway (Razorpay, Cashfree, Stripe …) later.
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      bigint generated always as identity (start with 10001) unique,
  user_id           uuid references auth.users (id) on delete set null,
  customer_name     text not null check (char_length(btrim(customer_name)) between 2 and 120),
  customer_email    text,
  phone             text not null check (phone ~ '^[6-9][0-9]{9}$'),
  address_line      text not null check (char_length(btrim(address_line)) between 5 and 300),
  city              text not null check (char_length(btrim(city)) between 2 and 80),
  state             text not null check (char_length(btrim(state)) between 2 and 80),
  pincode           text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  notes             text check (notes is null or char_length(notes) <= 500),
  subtotal          numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_fee      numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  total             numeric(12, 2) not null default 0 check (total >= 0),
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method    text not null default 'cod' check (payment_method in ('cod', 'online')),
  payment_status    text not null default 'pending_cod_verification'
                    check (payment_status in ('pending_cod_verification', 'pending', 'paid',
                                              'failed', 'refunded', 'cancelled')),
  payment_provider  text,
  payment_reference text,
  tracking_number   text check (tracking_number is null or char_length(tracking_number) <= 80),
  admin_note        text check (admin_note is null or char_length(admin_note) <= 1000),
  stock_restored    boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  confirmed_at      timestamptz,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

-- Historical snapshot: title, size and unit price are frozen at order time.
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_title text not null,
  product_slug  text,
  product_image text,
  category      text,
  size          text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  unit_mrp      numeric(10, 2) check (unit_mrp is null or unit_mrp >= 0),
  quantity      integer not null check (quantity between 1 and 10),
  line_total    numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Status guard + cancellation safeguard. Runs for every update path (admin
-- dashboard, customer cancellation, SQL editor), so stock is always restored
-- exactly once when an order becomes "cancelled".
create or replace function public.orders_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'cancelled' then
      raise exception 'ORDER_ALREADY_CANCELLED' using errcode = 'P0001',
        hint = 'Cancelled orders cannot be reopened; place a new order instead.';
    end if;
    if old.status = 'delivered' and new.status = 'cancelled' then
      raise exception 'ORDER_ALREADY_DELIVERED' using errcode = 'P0001',
        hint = 'Delivered orders cannot be cancelled. Handle returns separately.';
    end if;

    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'shipped'   then new.shipped_at   := coalesce(new.shipped_at, now());
      when 'delivered' then
        new.delivered_at := coalesce(new.delivered_at, now());
        -- Cash collected on delivery.
        if new.payment_method = 'cod' and new.payment_status = 'pending_cod_verification' then
          new.payment_status := 'paid';
        end if;
      when 'cancelled' then
        new.cancelled_at := now();
        if new.payment_status in ('pending_cod_verification', 'pending') then
          new.payment_status := 'cancelled';
        end if;
      else null;
    end case;
  end if;

  if new.status = 'cancelled' and not old.stock_restored then
    update public.products p
       set stock = p.stock + q.qty
      from (
        select oi.product_id, sum(oi.quantity)::int as qty
          from public.order_items oi
         where oi.order_id = new.id and oi.product_id is not null
         group by oi.product_id
      ) q
     where p.id = q.product_id;
    new.stock_restored := true;
  end if;

  -- Immutable after placement (protects totals even from admin API calls).
  new.order_number := old.order_number;
  new.user_id      := old.user_id;
  new.subtotal     := old.subtotal;
  new.shipping_fee := old.shipping_fee;
  new.total        := old.total;
  new.created_at   := old.created_at;
  return new;
end;
$$;

drop trigger if exists orders_guard_update on public.orders;
create trigger orders_guard_update
  before update on public.orders
  for each row execute function public.orders_before_update();

-- -----------------------------------------------------------------------------
-- 6. RPCs
-- -----------------------------------------------------------------------------

-- Atomic order placement. Prices come from the products table (never from the
-- client); each product row is locked by the conditional UPDATE so concurrent
-- checkouts cannot oversell. Any failure rolls back the whole order.
-- p_items: [{"product_id": "<uuid>", "size": "M", "quantity": 2}, ...]
create or replace function public.place_order(
  p_items          jsonb,
  p_customer_name  text,
  p_phone          text,
  p_address_line   text,
  p_city           text,
  p_state          text,
  p_pincode        text,
  p_notes          text default null,
  p_payment_method text default 'cod'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_email        text;
  v_order_id     uuid;
  v_order_number bigint;
  v_subtotal     numeric(12, 2) := 0;
  v_shipping     numeric(10, 2);
  v_line         record;
  v_product      public.products%rowtype;
  v_products     public.products[] := '{}';
  v_sizes        text[] := '{}';
  v_quantities   integer[] := '{}';
  v_phone        text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  i              integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  -- Accept +91 / 0 prefixes, store the bare 10-digit mobile number.
  if char_length(v_phone) = 12 and left(v_phone, 2) = '91' then
    v_phone := right(v_phone, 10);
  elsif char_length(v_phone) = 11 and left(v_phone, 1) = '0' then
    v_phone := right(v_phone, 10);
  end if;

  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;
  if coalesce(btrim(p_pincode), '') !~ '^[1-9][0-9]{5}$' then
    raise exception 'INVALID_PINCODE' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_customer_name, ''))) not between 2 and 120
     or char_length(btrim(coalesce(p_address_line, ''))) not between 5 and 300
     or char_length(btrim(coalesce(p_city, ''))) not between 2 and 80
     or char_length(btrim(coalesce(p_state, ''))) not between 2 and 80 then
    raise exception 'INVALID_ADDRESS' using errcode = '22023';
  end if;
  if p_payment_method is distinct from 'cod' then
    -- Online payments are modelled in the schema but not enabled yet.
    raise exception 'PAYMENT_METHOD_UNAVAILABLE' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'CART_EMPTY' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'CART_TOO_LARGE' using errcode = '22023';
  end if;

  -- Pass 1: lock + decrement stock with authoritative prices. Duplicate lines
  -- are merged and rows are processed in a stable order (prevents deadlocks).
  -- The conditional UPDATE takes a row lock and re-checks stock after any
  -- concurrent checkout commits, so inventory can never be oversold.
  for v_line in
    select (e ->> 'product_id')::uuid as product_id,
           e ->> 'size' as size,
           sum((e ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(p_items) e
     group by 1, 2
     order by 1, 2
  loop
    if v_line.product_id is null or v_line.size is null then
      raise exception 'INVALID_ITEM' using errcode = '22023';
    end if;
    if v_line.quantity is null or v_line.quantity < 1 or v_line.quantity > 10 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    update public.products
       set stock = stock - v_line.quantity
     where id = v_line.product_id
       and is_active
       and v_line.size = any (sizes)
       and stock >= v_line.quantity
    returning * into v_product;

    if not found then
      select * into v_product from public.products where id = v_line.product_id;
      if not found or not v_product.is_active then
        raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001',
          detail = coalesce(v_product.title, v_line.product_id::text);
      elsif not (v_line.size = any (v_product.sizes)) then
        raise exception 'SIZE_UNAVAILABLE' using errcode = 'P0001',
          detail = v_product.title || ' (' || v_line.size || ')';
      else
        raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001',
          detail = v_product.title, hint = v_product.stock::text;
      end if;
    end if;

    v_products   := v_products || v_product;
    v_sizes      := v_sizes || v_line.size;
    v_quantities := v_quantities || v_line.quantity;
    v_subtotal   := v_subtotal + v_product.price * v_line.quantity;
  end loop;

  -- Shipping rule (mirrored in src/lib/constants.ts): free from Rs 999, else Rs 79.
  v_shipping := case when v_subtotal >= 999 then 0 else 79 end;

  select email into v_email from auth.users where id = v_uid;

  insert into public.orders (
    user_id, customer_name, customer_email, phone, address_line, city, state,
    pincode, notes, subtotal, shipping_fee, total, payment_method, payment_status
  ) values (
    v_uid, btrim(p_customer_name), v_email, v_phone, btrim(p_address_line), btrim(p_city),
    btrim(p_state), btrim(p_pincode), nullif(left(btrim(coalesce(p_notes, '')), 500), ''),
    v_subtotal, v_shipping, v_subtotal + v_shipping, 'cod', 'pending_cod_verification'
  )
  returning id, order_number into v_order_id, v_order_number;

  -- Pass 2: historical snapshot of each line.
  for i in 1 .. coalesce(array_length(v_products, 1), 0) loop
    insert into public.order_items (
      order_id, product_id, product_title, product_slug, product_image, category,
      size, unit_price, unit_mrp, quantity
    ) values (
      v_order_id, v_products[i].id, v_products[i].title, v_products[i].slug,
      v_products[i].images[1], v_products[i].category, v_sizes[i], v_products[i].price,
      v_products[i].mrp, v_quantities[i]
    );
  end loop;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping,
    'total', v_subtotal + v_shipping
  );
end;
$$;

-- Customers may cancel their own order while it is still pending.
-- The orders trigger restores stock.
create or replace function public.cancel_my_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and user_id = auth.uid()
     and status = 'pending';

  if not found then
    raise exception 'ORDER_NOT_CANCELLABLE' using errcode = 'P0001';
  end if;
  return true;
end;
$$;

-- Admin quick stock +/- : atomic and can never go below zero.
create or replace function public.admin_adjust_stock(p_product_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 10000 then
    raise exception 'INVALID_DELTA' using errcode = '22023';
  end if;

  update public.products
     set stock = stock + p_delta
   where id = p_product_id
     and stock + p_delta >= 0
  returning stock into v_stock;

  if not found then
    if exists (select 1 from public.products where id = p_product_id) then
      raise exception 'STOCK_WOULD_BE_NEGATIVE' using errcode = '23514';
    end if;
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
  end if;
  return v_stock;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Row-Level Security & grants
-- -----------------------------------------------------------------------------
alter table public.admin_emails   enable row level security;
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- Start from zero privileges for API roles, then grant the minimum.
revoke all on public.admin_emails, public.profiles, public.products,
              public.wishlist_items, public.orders, public.order_items
  from anon, authenticated;

-- admin_emails: no API access at all (managed from the SQL editor).

-- profiles: own row only; role/e-mail are not client-writable.
grant select on public.profiles to authenticated;
grant update (full_name, phone, address_line, city, state, pincode) on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- products: public read of active items; writes for admins only.
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated
  using (public.is_admin());

-- wishlist_items: each customer manages their own list.
grant select, insert, delete on public.wishlist_items to authenticated;

drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own" on public.wishlist_items
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own" on public.wishlist_items
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own" on public.wishlist_items
  for delete to authenticated using (user_id = auth.uid());

-- orders: customers read their own; admins read all and update workflow
-- columns only. Inserts happen exclusively through place_order().
grant select on public.orders to authenticated;
grant update (status, payment_status, tracking_number, admin_note) on public.orders to authenticated;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items: visible with the parent order; immutable from the API.
grant select on public.order_items to authenticated;

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Function privileges (Postgres grants EXECUTE to PUBLIC by default).
revoke all on function public.is_admin() from public;
revoke all on function public.place_order(jsonb, text, text, text, text, text, text, text, text) from public;
revoke all on function public.cancel_my_order(uuid) from public;
revoke all on function public.admin_adjust_stock(uuid, integer) from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_user_updated() from public;
revoke all on function public.sync_admin_roles() from public;
revoke all on function public.orders_before_update() from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.place_order(jsonb, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_adjust_stock(uuid, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Storage: `product-images` bucket (public read, admin write, 5 MB,
--    JPEG/PNG/WebP only)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 9. Seed data (demo catalogue — edit or delete freely from /admin)
--    Generated from src/lib/demo-data.ts with `npm run seed:sql`.
-- -----------------------------------------------------------------------------
-- BEGIN SEED
insert into public.products
  (id, slug, title, category, description, details, fabric, care, mrp, price, stock, sizes, images, is_featured, is_active, created_at)
values
  ('6f1c2a9e-0001-4a4b-9c1d-000000000001', 'gulabi-chikankari-cotton-kurti', 'Gulabi Chikankari Cotton Kurti', 'kurti',
   'Soft rose cotton kurti with hand-done Lucknowi chikankari on the yoke and sleeves.',
   'A breezy straight-cut kurti finished with delicate shadow-work chikankari. Three-quarter sleeves, side slits and a calf length that pairs beautifully with palazzos or churidars.',
   '100% Cotton', 'Gentle hand wash in cold water. Dry in shade. Warm iron on reverse.',
   1899, 1299, 14, array['S', 'M', 'L', 'XL', 'XXL']::text[], array['/products/kurti-rose.svg', '/products/kurti-rose-detail.svg']::text[], true, true, '2026-01-01T00:00:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000002', 'neel-block-print-a-line-kurti', 'Neel Block Print A-Line Kurti', 'kurti',
   'Indigo hand block-printed A-line kurti from Jaipur with mandarin collar.',
   'Printed by artisans using traditional wooden blocks and natural indigo. Flared A-line silhouette, mandarin collar and wooden buttons on the placket.',
   'Cambric Cotton', 'Wash separately in cold water. Do not bleach. Dry in shade.',
   1499, 999, 3, array['M', 'L', 'XL']::text[], array['/products/kurti-indigo.svg', '/products/kurti-indigo-detail.svg']::text[], false, true, '2025-12-31T23:59:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000003', 'zari-butti-festive-silk-kurti', 'Zari Butti Festive Silk Kurti', 'kurti',
   'Wine art-silk kurti with woven zari buttis and a gota-trimmed hem.',
   'A festive straight kurti woven with antique-gold zari buttis. Finished with gota lace on the hem and sleeves; lined for comfort.',
   'Art Silk with Cotton Lining', 'Dry clean only.',
   2499, 1799, 8, array['S', 'M', 'L', 'XL']::text[], array['/products/kurti-wine.svg', '/products/kurti-wine-detail.svg']::text[], true, true, '2025-12-31T23:58:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000004', 'mehendi-anarkali-suit-set', 'Mehendi Anarkali Suit Set', 'suit',
   'Olive-green flared anarkali with churidar and a sheer gold-edged dupatta.',
   'A graceful floor-grazing anarkali with a sequinned yoke, paired with a matching churidar and organza dupatta edged in gold lace. Ideal for mehendi and haldi functions.',
   'Georgette Anarkali, Santoon Churidar, Organza Dupatta', 'Dry clean recommended.',
   4299, 2999, 6, array['S', 'M', 'L', 'XL', 'XXL']::text[], array['/products/suit-mehendi.svg', '/products/suit-mehendi-detail.svg']::text[], true, true, '2025-12-31T23:57:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000005', 'ivory-straight-salwar-suit', 'Ivory Straight Salwar Suit', 'suit',
   'Ivory straight suit with rose thread embroidery, salwar and mulmul dupatta.',
   'An elegant straight-cut kameez with tonal rose resham embroidery, matching salwar with tassel drawstring and a soft printed mulmul dupatta.',
   'Cotton Silk Kameez, Cotton Salwar, Mulmul Dupatta', 'Hand wash in cold water separately. Dry in shade.',
   3499, 2499, 0, array['M', 'L', 'XL']::text[], array['/products/suit-ivory.svg', '/products/suit-ivory-detail.svg']::text[], false, true, '2025-12-31T23:56:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000006', 'rani-pink-palazzo-suit', 'Rani Pink Palazzo Suit', 'suit',
   'Rani pink kurta with mirror-work neckline, palazzo and bandhani dupatta.',
   'A celebratory three-piece set with hand-placed mirror work, wide-leg palazzo and a vibrant bandhani dupatta. Comfortable for long festive days.',
   'Rayon Kurta & Palazzo, Chiffon Dupatta', 'Hand wash cold. Do not wring. Dry in shade.',
   3199, 2199, 11, array['S', 'M', 'L', 'XL', 'XXL']::text[], array['/products/suit-rani.svg', '/products/suit-rani-detail.svg']::text[], false, true, '2025-12-31T23:55:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000007', 'banarasi-zari-silk-saree', 'Banarasi Zari Silk Saree', 'saree',
   'Magenta Banarasi silk saree with antique gold zari border and rich pallu.',
   'A timeless Banarasi drape woven with antique-gold zari florals, a broad border and an elaborate pallu. Comes with an unstitched running blouse piece.',
   'Banarasi Art Silk (5.5 m saree + 0.8 m blouse piece)', 'Dry clean only. Store wrapped in muslin.',
   6999, 4999, 4, array['Free Size']::text[], array['/products/saree-banarasi.svg', '/products/saree-banarasi-detail.svg']::text[], true, true, '2025-12-31T23:54:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000008', 'peach-georgette-floral-saree', 'Peach Georgette Floral Saree', 'saree',
   'Lightweight peach georgette saree with printed florals and satin border.',
   'Flowing, featherlight georgette printed with soft florals and finished with a satin border. Effortless for day functions and office celebrations.',
   'Georgette (5.5 m saree + 0.8 m blouse piece)', 'Dry clean recommended. Low iron.',
   2799, 1899, 9, array['Free Size']::text[], array['/products/saree-peach.svg', '/products/saree-peach-detail.svg']::text[], false, true, '2025-12-31T23:53:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000009', 'kanjeevaram-temple-border-saree', 'Kanjeevaram Temple Border Saree', 'saree',
   'Emerald soft-silk saree with contrast temple border in rose and gold.',
   'Inspired by South Indian Kanjeevaram weaves: a lustrous emerald body with contrast rose temple border and gold zari checks on the pallu.',
   'Soft Silk (5.5 m saree + 0.8 m blouse piece)', 'Dry clean only.',
   5499, 3999, 2, array['Free Size']::text[], array['/products/saree-emerald.svg', '/products/saree-emerald-detail.svg']::text[], true, true, '2025-12-31T23:52:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000010', 'marigold-printed-cord-set', 'Marigold Printed Cord Set', 'cord-set',
   'Marigold-yellow printed shirt top with straight pants — easy festive casual.',
   'A relaxed button-down top with ethnic motifs and matching straight-leg pants with an elasticated waist and pockets.',
   'Rayon Slub', 'Machine wash gentle, cold. Dry in shade.',
   2299, 1599, 12, array['S', 'M', 'L', 'XL']::text[], array['/products/cordset-marigold.svg', '/products/cordset-marigold-detail.svg']::text[], true, true, '2025-12-31T23:51:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000011', 'lavender-chanderi-cord-set', 'Lavender Chanderi Cord Set', 'cord-set',
   'Lavender Chanderi kurta-top with flared palazzo and delicate gota detailing.',
   'Sheer-luxe Chanderi top with gota-patti neckline, paired with a flowing palazzo. Fully lined.',
   'Chanderi Silk with Cotton Lining', 'Dry clean recommended.',
   2999, 2199, 5, array['S', 'M', 'L', 'XL', 'XXL']::text[], array['/products/cordset-lavender.svg', '/products/cordset-lavender-detail.svg']::text[], false, true, '2025-12-31T23:50:00.000Z'),
  ('6f1c2a9e-0001-4a4b-9c1d-000000000012', 'ajrakh-print-co-ord-set', 'Ajrakh Print Co-ord Set', 'cord-set',
   'Earthy madder-red Ajrakh co-ord with kaftan top and tapered pants.',
   'Hand block-printed Ajrakh from Kutch on soft cotton. Relaxed kaftan top with tassel tie and tapered pants with side pockets.',
   'Modal Cotton', 'Hand wash cold separately. Colours may bleed slightly in first wash.',
   2599, 1799, 1, array['Free Size']::text[], array['/products/cordset-ajrakh.svg', '/products/cordset-ajrakh-detail.svg']::text[], false, true, '2025-12-31T23:49:00.000Z')
on conflict (slug) do nothing;
-- END SEED
