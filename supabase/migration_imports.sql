-- =============================================
-- MIGRATION: Add Imports Table
-- =============================================

-- Create imports table
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  import_date date not null, -- Local date (GMT+7)
  supplier_name text not null,
  total_cost numeric(15, 0) not null default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.imports enable row level security;

-- RLS policies
create policy "Users can view imports in their shop"
on public.imports for select
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

create policy "Users can insert imports in their shop"
on public.imports for insert
with check (shop_id in (select shop_id from public.profiles where id = auth.uid()));

-- Add missing columns to shops table if not exist
alter table public.shops add column if not exists address text;

-- Add sale_local_date to sales table if not exist
alter table public.sales add column if not exists sale_local_date date;

-- Update cash_flows to have source column
alter table public.cash_flows add column if not exists source text check (source in ('sale', 'import', 'manual'));

-- Create index for faster queries
create index if not exists idx_imports_shop_date on imports(shop_id, import_date desc);
create index if not exists idx_imports_shop_created on imports(shop_id, created_at desc);
