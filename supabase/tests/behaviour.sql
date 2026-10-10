-- Behavioural tests for the Mini Closet migration. Run via supabase/tests/run.sh.
-- Every block raises (and aborts the run) on failure.
\set ON_ERROR_STOP 1

-- Helper: run a statement and return the error message (or NULL on success).
create or replace function pg_temp.err(sql text) returns text language plpgsql as $$
begin
  execute sql;
  return null;
exception when others then
  return sqlerrm;
end;
$$;
grant execute on function pg_temp.err(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
-- Test fixture admins (the migration only seeds the real owner address).
insert into public.admin_emails (email) values ('admin1@minicloset.com'), ('admin2@minicloset.com');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin1@MiniCloset.com', now(), '{"full_name":"Arti Chandra"}'),
  ('00000000-0000-0000-0000-00000000000b', 'admin2@minicloset.com', null, '{}'),
  ('00000000-0000-0000-0000-0000000000c1', 'priya@example.com', now(), '{"full_name":"Priya Sharma"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'neha@example.com', now(), '{}');

do $$
begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'admin',
    'confirmed allowlisted user should get admin role';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'customer',
    'unconfirmed allowlisted user must stay customer';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') = 'customer',
    'regular sign-up defaults to customer';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') = 'Priya Sharma',
    'full_name copied from metadata';
  assert (select count(*) from public.products) = 12, 'seed products present';
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$
begin
  assert (select count(*) from public.products) = 12, 'anon can browse active products';
  assert not public.is_admin(), 'anon is not admin';
  assert pg_temp.err('select * from public.orders') like 'permission denied%', 'anon cannot read orders';
  assert pg_temp.err('select * from public.profiles') like 'permission denied%', 'anon cannot read profiles';
  assert pg_temp.err($q$insert into public.products (slug,title,category,mrp,price,sizes) values ('x-y','XY','kurti',10,5,'{M}')$q$)
    like 'permission denied%', 'anon cannot insert products';
  assert pg_temp.err('select * from public.admin_emails') like 'permission denied%', 'allowlist hidden';
end $$;
reset role;

-- Inactive products are hidden from the public.
update public.products set is_active = false where slug = 'ivory-straight-salwar-suit';
set role anon;
do $$ begin
  assert (select count(*) from public.products) = 11, 'inactive product hidden from anon';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Customer A (Priya)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
set role authenticated;
do $$
declare
  v jsonb;
  v_order uuid;
begin
  assert not public.is_admin(), 'customer is not admin';
  assert (select count(*) from public.profiles) = 1, 'customer sees only own profile';
  assert pg_temp.err($q$update public.profiles set role = 'admin' where id = auth.uid()$q$)
    like 'permission denied%', 'role column not writable';
  update public.profiles set full_name = 'Priya S.', phone = '9876543210', pincode = '560001' where id = auth.uid();
  assert (select full_name from public.profiles where id = auth.uid()) = 'Priya S.', 'own profile editable';
  assert pg_temp.err($q$update public.products set price = 1 where slug = 'banarasi-zari-silk-saree'$q$) is null
    and (select price from public.products where slug = 'banarasi-zari-silk-saree') = 4999,
    'customer product update silently affects 0 rows';
  assert pg_temp.err($q$insert into public.products (slug,title,category,mrp,price,sizes) values ('x-y','XY','kurti',10,5,'{M}')$q$)
    like '%row-level security%', 'customer cannot insert products';
  assert pg_temp.err($q$select public.admin_adjust_stock('6f1c2a9e-0001-4a4b-9c1d-000000000007', 5)$q$)
    = 'FORBIDDEN', 'customer cannot adjust stock';
  assert pg_temp.err($q$insert into public.orders (user_id, customer_name, phone, address_line, city, state, pincode) values (auth.uid(),'X','9876543210','Somewhere 1','Pune','MH','411001')$q$)
    like 'permission denied%', 'orders cannot be inserted directly';
  assert pg_temp.err($q$insert into storage.objects (bucket_id, name) values ('product-images', 'hack.jpg')$q$)
    like '%row-level security%', 'customer cannot upload product images';

  -- Wishlist
  insert into public.wishlist_items (user_id, product_id) values (auth.uid(), '6f1c2a9e-0001-4a4b-9c1d-000000000001');
  assert pg_temp.err($q$insert into public.wishlist_items (user_id, product_id) values ('00000000-0000-0000-0000-0000000000c2', '6f1c2a9e-0001-4a4b-9c1d-000000000001')$q$)
    like '%row-level security%', 'cannot write another user''s wishlist';

  -- Successful order: 2 x Banarasi (stock 4) + 1 x Gulabi kurti M, with +91 phone prefix.
  v := public.place_order(
    '[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000007","size":"Free Size","quantity":1},
      {"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000007","size":"Free Size","quantity":1},
      {"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":1}]',
    'Priya Sharma', '+91 98765 43210', '12 MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'Please call before delivery');
  v_order := (v ->> 'id')::uuid;
  assert (v ->> 'total')::numeric = 4999 * 2 + 1299, 'server-side total';
  assert (v ->> 'shipping_fee')::numeric = 0, 'free shipping above threshold';
  assert (select stock from public.products where slug = 'banarasi-zari-silk-saree') = 2, 'stock deducted (merged lines)';
  assert (select stock from public.products where slug = 'gulabi-chikankari-cotton-kurti') = 13, 'stock deducted';
  assert (select phone from public.orders where id = v_order) = '9876543210', 'phone normalised';
  assert (select payment_status from public.orders where id = v_order) = 'pending_cod_verification', 'COD pending';
  assert (select count(*) from public.order_items where order_id = v_order) = 2, 'items snapshotted';
  assert (select unit_price from public.order_items where order_id = v_order and size = 'Free Size') = 4999, 'price snapshot';
  assert (select customer_email from public.orders where id = v_order) = 'priya@example.com', 'email from auth';
  perform set_config('test.order_a', v_order::text, false);

  -- Overselling is impossible and rolls back the whole order.
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":1},{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000007","size":"Free Size","quantity":3}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'INSUFFICIENT_STOCK', 'oversell rejected';
  assert (select stock from public.products where slug = 'gulabi-chikankari-cotton-kurti') = 13, 'partial order rolled back';
  assert (select count(*) from public.orders) = 1, 'no order row left behind';

  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"Free Size","quantity":1}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'SIZE_UNAVAILABLE', 'size validated';
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000005","size":"M","quantity":1}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'PRODUCT_UNAVAILABLE', 'inactive product rejected';
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":1}]','Priya','12345','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'INVALID_PHONE', 'phone validated';
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":1}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','056003')$q$)
    = 'INVALID_PINCODE', 'pincode validated';
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":11}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'INVALID_QUANTITY', 'quantity bounded';
  assert pg_temp.err($q$select public.place_order('[]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038')$q$)
    = 'CART_EMPTY', 'empty cart rejected';
  assert pg_temp.err($q$select public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000001","size":"M","quantity":1}]','Priya','9876543210','12 MG Road','Bengaluru','Karnataka','560038', null, 'online')$q$)
    = 'PAYMENT_METHOD_UNAVAILABLE', 'online payments not yet enabled';

  -- Customers cannot change workflow or totals on their own order.
  update public.orders set status = 'delivered' where id = v_order;
  assert (select status from public.orders where id = v_order) = 'pending', 'customer cannot update status';
  assert pg_temp.err(format('update public.orders set total = 1 where id = %L', v_order))
    like 'permission denied%', 'totals not writable';
end $$;

-- A second pending order to cancel as the customer.
do $$
declare v jsonb;
begin
  v := public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000002","size":"L","quantity":2}]',
    'Priya Sharma', '9876543210', '12 MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038');
  assert (v ->> 'total')::numeric = 999 * 2, 'second order total';
  assert (select stock from public.products where slug = 'neel-block-print-a-line-kurti') = 1, 'stock 3 -> 1';
  perform set_config('test.order_a2', v ->> 'id', false);
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Customer B (Neha) cannot see or cancel A's orders
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;
do $$
begin
  assert (select count(*) from public.orders) = 0, 'B sees none of A''s orders';
  assert (select count(*) from public.order_items) = 0, 'B sees none of A''s items';
  assert (select count(*) from public.wishlist_items) = 0, 'B sees none of A''s wishlist';
  assert pg_temp.err(format('select public.cancel_my_order(%L)', current_setting('test.order_a2')))
    = 'ORDER_NOT_CANCELLABLE', 'B cannot cancel A''s order';
  -- Small order below the free-shipping threshold is not possible with the
  -- seed catalogue (cheapest item is ₹999), so check the threshold edge instead.
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Customer A cancels own pending order -> stock restored
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
set role authenticated;
do $$
begin
  perform public.cancel_my_order(current_setting('test.order_a2')::uuid);
  assert (select status from public.orders where id = current_setting('test.order_a2')::uuid) = 'cancelled', 'cancelled';
  assert (select payment_status from public.orders where id = current_setting('test.order_a2')::uuid) = 'cancelled', 'payment cancelled';
  assert (select stock from public.products where slug = 'neel-block-print-a-line-kurti') = 3, 'stock restored on cancel';
  assert pg_temp.err(format('select public.cancel_my_order(%L)', current_setting('test.order_a2')))
    = 'ORDER_NOT_CANCELLABLE', 'cannot cancel twice';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Unconfirmed allowlisted e-mail is NOT admin
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
do $$ begin
  assert not public.is_admin(), 'unconfirmed admin e-mail is not admin';
  assert pg_temp.err($q$insert into public.products (slug,title,category,mrp,price,sizes) values ('x-y','XY','kurti',10,5,'{M}')$q$)
    like '%row-level security%', 'unconfirmed admin cannot write products';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$
declare
  v_order uuid := current_setting('test.order_a')::uuid;
  v_new uuid;
begin
  assert public.is_admin(), 'admin recognised (case-insensitive e-mail)';
  assert (select count(*) from public.products) = 12, 'admin sees inactive products too';
  assert (select count(*) from public.orders) = 2, 'admin sees all orders';
  assert (select count(*) from public.profiles) = 4, 'admin sees all profiles';

  insert into public.products (slug, title, category, mrp, price, stock, sizes)
  values ('test-kurti', 'Test Kurti', 'kurti', 1000, 800, 0, '{M,L}') returning id into v_new;
  assert (select in_stock from public.products where id = v_new) = false, 'out of stock derived from 0';
  assert public.admin_adjust_stock(v_new, 3) = 3, 'stock increment';
  assert (select in_stock from public.products where id = v_new), 'back in stock';
  assert pg_temp.err(format('select public.admin_adjust_stock(%L, -4)', v_new)) = 'STOCK_WOULD_BE_NEGATIVE', 'no negative stock';
  assert public.admin_adjust_stock(v_new, -3) = 0, 'decrement to zero';
  assert pg_temp.err(format('update public.products set price = 2000 where id = %L', v_new))
    like '%products_price_not_above_mrp%', 'offer price cannot exceed MRP';
  assert pg_temp.err(format('update public.products set stock = -1 where id = %L', v_new))
    like '%products_stock_check%', 'stock check constraint';
  assert pg_temp.err(format($q$update public.products set sizes = '{XXXL}' where id = %L$q$, v_new))
    like '%products_sizes_check%', 'sizes constrained';
  delete from public.products where id = v_new;

  insert into storage.objects (bucket_id, name) values ('product-images', 'products/new.jpg');
  delete from storage.objects where name = 'products/new.jpg';

  -- Workflow
  update public.orders set status = 'confirmed' where id = v_order;
  assert (select confirmed_at is not null from public.orders where id = v_order), 'confirmed_at stamped';
  assert pg_temp.err(format('update public.orders set total = 1 where id = %L', v_order))
    like 'permission denied%', 'admin cannot rewrite totals';
  update public.orders set status = 'shipped', tracking_number = 'DTDC123' where id = v_order;
  update public.orders set status = 'cancelled' where id = v_order;
  assert (select stock from public.products where slug = 'banarasi-zari-silk-saree') = 4, 'admin cancel restores stock';
  assert (select stock from public.products where slug = 'gulabi-chikankari-cotton-kurti') = 14, 'admin cancel restores stock 2';
  update public.orders set admin_note = 'Customer requested cancellation' where id = v_order;
  assert (select stock from public.products where slug = 'banarasi-zari-silk-saree') = 4, 'no double restore';
  assert pg_temp.err(format($q$update public.orders set status = 'pending' where id = %L$q$, v_order))
    = 'ORDER_ALREADY_CANCELLED', 'cancelled is terminal';
end $$;
reset role;

-- Delivered COD order flips payment to paid and cannot be cancelled.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;
do $$
declare v jsonb;
begin
  v := public.place_order('[{"product_id":"6f1c2a9e-0001-4a4b-9c1d-000000000010","size":"S","quantity":1}]',
    'Neha Verma', '7012345678', 'Flat 4B, Lake View Apartments', 'Kolkata', 'West Bengal', '700091');
  perform set_config('test.order_b', v ->> 'id', false);
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$
declare v_order uuid := current_setting('test.order_b')::uuid;
begin
  update public.orders set status = 'delivered' where id = v_order;
  assert (select payment_status from public.orders where id = v_order) = 'paid', 'COD collected on delivery';
  assert pg_temp.err(format($q$update public.orders set status = 'cancelled' where id = %L$q$, v_order))
    = 'ORDER_ALREADY_DELIVERED', 'delivered cannot be cancelled';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Allowlist changes propagate to profile roles
-- ---------------------------------------------------------------------------
insert into public.admin_emails (email) values ('priya@example.com');
do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') = 'admin', 'promoted';
end $$;
delete from public.admin_emails where email = 'priya@example.com';
do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') = 'customer', 'demoted';
end $$;

-- E-mail confirmation of an allowlisted address grants admin.
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'admin', 'admin after confirm';
end $$;

\echo 'behaviour.sql: all assertions passed'
