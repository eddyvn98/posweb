-- Create shops table
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for shops
alter table public.shops enable row level security;

-- Create profiles table linked to auth.users and public.shops
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete restrict,
  role text check (role in ('owner', 'staff')) default 'staff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- SHOP POLICIES
create policy "Users can view their own shop"
on public.shops for select
using (
  id in (
    select shop_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can insert shop (during signup)"
on public.shops for insert
with check (true);

-- PROFILE POLICIES
create policy "Users can view their own profile"
on public.profiles for select
using (
  id = auth.uid()
);

create policy "Users can insert their own profile (during signup)"
on public.profiles for insert
with check (
  id = auth.uid()
);

-- FUNCTION to handle new user signup (auto create shop for MVP)
-- NOTE: In a real generic SaaS, we might want a separate flow.
-- For this MVP, we assume user signs up = new shop owner.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_shop_id uuid;
begin
  -- 1. Create a new shop for this user
  insert into public.shops (name)
  values ('Cửa hàng của ' || new.email)
  returning id into new_shop_id;

  -- 2. Create profile linking user to shop
  insert into public.profiles (id, shop_id, role)
  values (new.id, new_shop_id, 'owner');

  return new;
end;
$$;

-- TRIGGER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
