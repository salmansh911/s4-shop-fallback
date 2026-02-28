alter table if exists public.users
  add column if not exists medusa_customer_id text;

create table if not exists public.checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  medusa_customer_id text,
  order_number text not null,
  payment_method text not null check (payment_method in ('stripe', 'cod')),
  status text not null check (status in ('pending_payment', 'paid', 'failed')),
  items jsonb not null,
  subtotal numeric(12,2) not null,
  customer_email text not null,
  delivery_details jsonb not null,
  medusa_order_id text,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_checkout_attempts_user_id on public.checkout_attempts(user_id);
create index if not exists idx_checkout_attempts_order_number on public.checkout_attempts(order_number);
create index if not exists idx_checkout_attempts_status on public.checkout_attempts(status);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  status text not null check (status in ('processed', 'ignored')),
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.order_email_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  email_type text not null check (email_type in ('stripe_paid', 'cod_placed')),
  sent_at timestamptz not null default now(),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique(order_id, email_type)
);

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'site',
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_marketing_leads_email_source
  on public.marketing_leads(lower(email), source);

create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id text,
  order_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_events_event_name_created_at
  on public.marketing_events(event_name, created_at desc);
