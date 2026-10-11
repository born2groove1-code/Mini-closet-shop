-- Adds XS, XXXL, 4XL and 5XL to the allowed product sizes.
-- Run once in Supabase → SQL Editor on a database set up before this change.
-- Safe to re-run.
alter table public.products drop constraint if exists products_sizes_check;
alter table public.products add constraint products_sizes_check
  check (cardinality(sizes) >= 1
         and sizes <@ array['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL', 'Free Size']::text[]);
