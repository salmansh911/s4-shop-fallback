create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('customer', 'admin')),
  restaurant_name text not null,
  email text unique,
  phone text,
  delivery_address jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('ramadan', 'japanese', 'premium_beef', 'general')),
  price numeric(12,2) not null,
  unit text not null,
  description text,
  image_url text,
  certifications jsonb,
  stock_level integer not null default 0,
  stock_status text not null default 'In Stock' check (stock_status in ('In Stock', 'Low Stock', 'Pre-order')),
  ai_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_number text unique not null,
  items jsonb not null,
  total_amount numeric(12,2) not null,
  deposit_amount numeric(12,2) not null,
  deposit_paid boolean not null default false,
  delivery_date date,
  status text not null check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered')),
  special_instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
