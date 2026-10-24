create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  initials text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

create table public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10, 3) not null,
  compare_at numeric(10, 3),
  colorway text not null,
  swatch text not null,
  sizes text[] not null,
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  is_visible boolean not null default true,
  rating numeric(3, 1) not null default 0,
  review_count integer not null default 0,
  description text not null,
  image_url text,
  variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create sequence public.order_ref_sequence start with 100000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'Submitted',
  total numeric(10, 3) not null,
  shipping_fee numeric(10, 3) not null default 2,
  shipping_name text not null,
  phone text not null,
  governorate text not null,
  wilayat text not null,
  postal_code text not null,
  language text not null default 'en',
  promo_code text,
  discount_amount numeric(10, 3) not null default 0,
  transfer_receipt text,
  customer_name text not null default '',
  customer_email text not null default '',
  items jsonb not null,
  created_at timestamptz not null default now()
);

create table public.wishlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  product_name text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null check (char_length(body) >= 3),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percentage integer not null check (percentage between 1 and 100),
  categories text[] not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  notify_email text not null default '',
  notify_phone text not null default '',
  transfer_details text not null default '',
  shipping_fee numeric(10, 3) not null default 2
);

insert into public.store_settings (id, notify_email, notify_phone, transfer_details)
values (
  1,
  'demo@girliesglam.com',
  '+96879162199',
  E'Bank: Bank Muscat\nAccount name: Girlies Glam\nAccount number: 0300 0000 0000\nPhone transfer: +968 7916 2199'
);

insert into public.discounts (code, percentage, categories, starts_at, ends_at, is_enabled)
values (
  'GLAM10',
  10,
  array['Cotton Makhwar','Italy Silk Makhwar','Digital Cotton Liberty','Cotton Amoudi Makhwar','Makhwar Scarfs','Earrings','Full Sets','Necklace','Bracelet','Rings'],
  '2026-01-01T00:00:00Z',
  '2027-12-31T23:59:00Z',
  true
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  first_word text := split_part(full_name, ' ', 1);
  second_word text := split_part(full_name, ' ', 2);
  initials text := upper(substr(first_word, 1, 1) || substr(second_word, 1, 1));
begin
  if initials = '' then
    initials := 'GG';
  end if;
  insert into public.profiles (id, name, email, initials, is_admin)
  values (
    new.id,
    full_name,
    new.email,
    initials,
    lower(new.email) = 'demo@girliesglam.com'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin and not private.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_profile
before update on public.profiles
for each row execute function private.protect_profile();

create or replace function private.prepare_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product public.products%rowtype;
  rebuilt jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  eligible numeric := 0;
  promo public.discounts%rowtype;
  qty integer;
  fee numeric := 2;
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'You can only place your own order';
  end if;
  if tg_op = 'INSERT' then
    new.status := 'Submitted';
  end if;

  for item in select value from jsonb_array_elements(coalesce(new.items, '[]'::jsonb))
  loop
    select * into product from public.products where id = item->>'productId' and is_visible;
    if not found then
      raise exception 'A product in your bag is no longer available';
    end if;
    qty := greatest(1, least(10, coalesce((item->>'qty')::integer, 1)));
    subtotal := subtotal + product.price * qty;
    rebuilt := rebuilt || jsonb_build_array(jsonb_build_object(
      'productId', product.id,
      'name', product.name,
      'size', coalesce(item->>'size', 'One Size'),
      'qty', qty,
      'price', product.price,
      'colorway', coalesce(item->>'colorway', product.colorway),
      'category', product.category
    ));
  end loop;

  new.items := rebuilt;
  select shipping_fee into fee from public.store_settings where id = 1;
  if fee is null then fee := 2; end if;

  if new.promo_code is not null and length(trim(new.promo_code)) > 0 then
    select * into promo from public.discounts
    where upper(code) = upper(trim(new.promo_code))
      and is_enabled
      and now() >= starts_at
      and now() <= ends_at;
    if not found then
      raise exception 'This promo code cannot be applied';
    end if;
    for item in select value from jsonb_array_elements(rebuilt)
    loop
      if item->>'category' = any (promo.categories) then
        eligible := eligible + (item->>'price')::numeric * (item->>'qty')::integer;
      end if;
    end loop;
    new.promo_code := promo.code;
    new.discount_amount := round(eligible * promo.percentage / 100.0, 3);
  else
    new.promo_code := null;
    new.discount_amount := 0;
  end if;

  new.shipping_fee := fee;
  new.total := greatest(0, round(subtotal - new.discount_amount + fee, 3));
  if new.order_ref is null or new.order_ref = '' then
    new.order_ref := 'GG-' || nextval('public.order_ref_sequence')::text;
  end if;
  return new;
end;
$$;

create trigger prepare_order
before insert on public.orders
for each row execute function private.prepare_order();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist enable row level security;
alter table public.reviews enable row level security;
alter table public.discounts enable row level security;
alter table public.store_settings enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or private.is_admin());
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid() or private.is_admin())
with check (id = auth.uid() or private.is_admin());

create policy products_read on public.products for select to anon, authenticated
using (is_visible or private.is_admin());
create policy products_write on public.products for all to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy orders_select on public.orders for select to authenticated
using (user_id = auth.uid() or private.is_admin());
create policy orders_insert on public.orders for insert to authenticated
with check (user_id = auth.uid());
create policy orders_update on public.orders for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy wishlist_own on public.wishlist for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reviews_read on public.reviews for select to anon, authenticated
using (moderation_status = 'visible' or user_id = auth.uid() or private.is_admin());
create policy reviews_insert on public.reviews for insert to authenticated
with check (user_id = auth.uid() and moderation_status = 'pending');
create policy reviews_moderate on public.reviews for update to authenticated
using (private.is_admin())
with check (private.is_admin());
create policy reviews_delete on public.reviews for delete to authenticated
using (private.is_admin());

create policy discounts_admin on public.discounts for all to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy settings_read on public.store_settings for select to anon, authenticated
using (true);
create policy settings_update on public.store_settings for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create or replace function private.lookup_promo(p_code text, p_lines jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  promo public.discounts%rowtype;
  item jsonb;
  product public.products%rowtype;
  eligible numeric := 0;
  qty integer;
begin
  select * into promo from public.discounts
  where upper(code) = upper(trim(coalesce(p_code, '')))
    and is_enabled
    and now() >= starts_at
    and now() <= ends_at;
  if not found then
    return jsonb_build_object('valid', false, 'message', 'This promo code cannot be applied.');
  end if;
  for item in select value from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb))
  loop
    select * into product from public.products where id = item->>'productId' and is_visible;
    if found and product.category = any (promo.categories) then
      qty := greatest(1, least(10, coalesce((item->>'qty')::integer, 1)));
      eligible := eligible + product.price * qty;
    end if;
  end loop;
  if eligible <= 0 then
    return jsonb_build_object('valid', false, 'message', 'This code does not apply to the items in your bag.');
  end if;
  return jsonb_build_object(
    'valid', true,
    'message', 'Code applied',
    'code', promo.code,
    'percentage', promo.percentage,
    'eligibleSubtotal', round(eligible, 3),
    'discountAmount', round(eligible * promo.percentage / 100.0, 3)
  );
end;
$$;

create or replace function public.validate_promo(p_code text, p_lines jsonb)
returns jsonb
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.lookup_promo(p_code, p_lines);
$$;

grant usage on schema private to anon, authenticated;
revoke all on function private.lookup_promo(text, jsonb) from public;
revoke all on function public.validate_promo(text, jsonb) from public;
grant execute on function private.lookup_promo(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.validate_promo(text, jsonb) to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on sequence public.order_ref_sequence to authenticated, service_role;

insert into public.products (id, name, category, price, compare_at, colorway, swatch, sizes, is_new, is_bestseller, is_visible, rating, review_count, description, image_url, variants) values
('PRD-001', 'Lilac Cotton Makhwar', 'Cotton Makhwar', 23.485, null, 'Sky', '#D9A8DE', array['Small','Medium','Large','X Large']::text[], false, true, true, 4.3, 476, 'The lilac cotton makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-002', 'Cloud Cotton Makhwar', 'Cotton Makhwar', 18.095, null, 'Sky', '#F7D9A0', array['Small','Medium','Large','X Large']::text[], false, false, true, 4, 130, 'The cloud cotton makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-003', 'Heart Cotton Makhwar', 'Cotton Makhwar', 12.705, null, 'Sky', '#B8C9F0', array['Small','Medium','Large','X Large']::text[], false, false, true, 5, 264, 'The heart cotton makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-004', 'Sparkle Cotton Makhwar', 'Cotton Makhwar', 29.645, 41.58, 'Blush', '#F5B8C8', array['Small','Medium','Large','X Large']::text[], false, false, true, 4.7, 282, 'The sparkle cotton makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-005', 'Butter Cotton Makhwar', 'Cotton Makhwar', 23.87, 35.805, 'Cream', '#E7B8E9', array['Small','Medium','Large','X Large']::text[], false, false, true, 3.9, 250, 'The butter cotton makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-006', 'Silk Rose Makhwar', 'Italy Silk Makhwar', 9.625, null, 'Blush', '#FCE29B', array['Small','Medium','Large','X Large']::text[], false, true, true, 3.9, 417, 'The silk rose makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-007', 'Silk Lavender Makhwar', 'Italy Silk Makhwar', 26.565, null, 'Blush', '#C4A6E0', array['Small','Medium','Large','X Large']::text[], true, false, true, 4.9, 71, 'The silk lavender makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-008', 'Silk Pearl Makhwar', 'Italy Silk Makhwar', 21.175, 26.95, 'Lilac', '#F6A6C8', array['Small','Medium','Large','X Large']::text[], false, false, true, 4.3, 72, 'The silk pearl makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-009', 'Silk Blossom Makhwar', 'Italy Silk Makhwar', 15.4, null, 'Blush', '#D9A8DE', array['Small','Medium','Large','X Large']::text[], true, false, true, 4.4, 339, 'The silk blossom makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-010', 'Liberty Bloom Makhwar', 'Digital Cotton Liberty', 29.645, 40.81, 'Lilac', '#F7D9A0', array['Small','Medium','Large','X Large']::text[], true, false, true, 4, 421, 'The liberty bloom makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/digital-cotton-liberty-pink-green.jpeg', '[{"colorway":"Collage","swatch":"#d7b4e4","imageUrl":"/products/digital-cotton-liberty-collage.jpeg"}]'::jsonb),
('PRD-011', 'Liberty Garden Makhwar', 'Digital Cotton Liberty', 24.255, 35.42, 'Berry', '#B8C9F0', array['Small','Medium','Large','X Large']::text[], false, false, true, 4.3, 390, 'The liberty garden makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/digital-cotton-liberty-teal-lavender.jpeg', '[]'::jsonb),
('PRD-012', 'Liberty Petal Makhwar', 'Digital Cotton Liberty', 18.865, null, 'Sky', '#F5B8C8', array['Small','Medium','Large','X Large']::text[], false, false, true, 3.9, 350, 'The liberty petal makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/digital-cotton-liberty-rose-lavender.jpeg', '[]'::jsonb),
('PRD-013', 'Liberty Sky Makhwar', 'Digital Cotton Liberty', 13.475, null, 'Sky', '#E7B8E9', array['Small','Medium','Large','X Large']::text[], false, true, true, 4.8, 484, 'The liberty sky makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/digital-cotton-liberty-champagne-gold.jpeg', '[]'::jsonb),
('PRD-014', 'Liberty Rose Makhwar', 'Digital Cotton Liberty', 30.03, null, 'Sky', '#FCE29B', array['Small','Medium','Large','X Large']::text[], false, false, true, 4.5, 138, 'The liberty rose makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/digital-cotton-liberty-blush-berry.jpeg', '[]'::jsonb),
('PRD-015', 'Amoudi Blush Makhwar', 'Cotton Amoudi Makhwar', 15.785, null, 'Blush', '#C4A6E0', array['Small','Medium','Large','X Large']::text[], false, true, true, 4, 23, 'The amoudi blush makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-016', 'Amoudi Lilac Makhwar', 'Cotton Amoudi Makhwar', 10.395, null, 'Blush', '#F6A6C8', array['Small','Medium','Large','X Large']::text[], false, false, true, 5, 157, 'The amoudi lilac makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-017', 'Amoudi Cream Makhwar', 'Cotton Amoudi Makhwar', 27.335, null, 'Blush', '#D9A8DE', array['Small','Medium','Large','X Large']::text[], true, false, true, 4.7, 291, 'The amoudi cream makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-018', 'Amoudi Berry Makhwar', 'Cotton Amoudi Makhwar', 21.56, 26.565, 'Cream', '#F7D9A0', array['Small','Medium','Large','X Large']::text[], true, false, true, 4.8, 85, 'The amoudi berry makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-019', 'Amoudi Sky Makhwar', 'Cotton Amoudi Makhwar', 16.17, 21.175, 'Sky', '#B8C9F0', array['Small','Medium','Large','X Large']::text[], false, false, true, 3.9, 54, 'The amoudi sky makhwar is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[]'::jsonb),
('PRD-020', 'Makhwar Scarf — Jewel Tones', 'Makhwar Scarfs', 24.255, null, 'Lilac', '#F5B8C8', array['One Size']::text[], true, false, true, 4.9, 445, 'The makhwar scarf — jewel tones is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/makhwar-scarfs-jewel-tones.jpeg', '[]'::jsonb),
('PRD-021', 'Makhwar Scarf — Soft Pastels', 'Makhwar Scarfs', 18.865, null, 'Lilac', '#E7B8E9', array['One Size']::text[], false, false, true, 4.6, 98, 'The makhwar scarf — soft pastels is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', '/products/makhwar-scarfs-soft-pastels.jpeg', '[]'::jsonb),
('PRD-022', 'Pearl Drop Earrings', 'Earrings', 23.1, null, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 3.9, 293, 'The pearl drop earrings is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-023', 'Crystal Hoop Earrings', 'Earrings', 17.71, 23.1, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 4.2, 171, 'The crystal hoop earrings is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-024', 'Rose Gold Full Set', 'Full Sets', 21.945, 33.88, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 4.1, 110, 'The rose gold full set is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-025', 'Pearl Glow Full Set', 'Full Sets', 16.555, 28.49, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 3.8, 243, 'The pearl glow full set is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-026', 'Layered Pearl Necklace', 'Necklace', 20.79, 31.57, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 4.9, 182, 'The layered pearl necklace is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-027', 'Heart Charm Necklace', 'Necklace', 15.4, null, 'Silver', '#d9d9e2', array['One Size']::text[], true, false, true, 4.7, 365, 'The heart charm necklace is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-028', 'Blush Tennis Bracelet', 'Bracelet', 19.635, 29.645, 'Silver', '#d9d9e2', array['One Size']::text[], false, false, true, 4.5, 255, 'The blush tennis bracelet is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-029', 'Dainty Charm Bracelet', 'Bracelet', 14.245, null, 'Silver', '#d9d9e2', array['One Size']::text[], false, true, true, 4.7, 212, 'The dainty charm bracelet is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-030', 'Petal Stack Ring', 'Rings', 18.865, null, 'Silver', '#d9d9e2', array['6','7','8','9']::text[], false, false, true, 4, 163, 'The petal stack ring is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb),
('PRD-031', 'Twinkle Signet Ring', 'Rings', 13.09, null, 'Silver', '#d9d9e2', array['6','7','8','9']::text[], false, true, true, 4.7, 60, 'The twinkle signet ring is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.', null, '[{"colorway":"Gold","swatch":"#e8b04b","imageUrl":null},{"colorway":"Golden Rose","swatch":"#e8a0b4","imageUrl":null}]'::jsonb)
on conflict (id) do nothing;
