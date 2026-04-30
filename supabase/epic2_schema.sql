-- =============================================
-- EPIC 2: DATA MODEL (PRODUCTS, SALES, CASHBOOK)
-- =============================================

-- 1. PRODUCTS & INVENTORY
-- ---------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  barcode text not null,
  name text not null,
  price numeric(15, 0) not null default 0, -- Giá bán
  cost_price numeric(15, 0) not null default 0, -- Giá vốn
  stock_quantity integer not null default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(shop_id, barcode) -- Mã vạch là duy nhất trong 1 shop
);

alter table public.products enable row level security;

create policy "Users can view products in their shop"
on public.products for select
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

create policy "Users can manage products in their shop"
on public.products for all
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

-- Inventory Logs
create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  change_amount integer not null, -- Số lượng thay đổi (+ nhập, - bán)
  current_stock integer not null, -- Tồn kho SAU khi thay đổi (snapshot)
  type text check (type in ('import', 'sale', 'adjustment', 'void')) not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inventory_logs enable row level security;

create policy "Users can view inventory logs in their shop"
on public.inventory_logs for select
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

-- 2. SALES (APPEND-ONLY)
-- ---------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null, -- Mã phiếu (Ex: HD-001)
  total_amount numeric(15, 0) not null default 0,
  payment_method text default 'cash',
  sale_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  
  -- Metadata cho reporting
  is_void boolean default false,
  void_reason text,
  void_at timestamp with time zone
);

alter table public.sales enable row level security;

-- Policy: Chỉ xem và thêm, KHÔNG SỬA/XOÁ (trừ khi void - update soft delete)
create policy "Users can view sales in their shop"
on public.sales for select
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

create policy "Users can insert sales in their shop"
on public.sales for insert
with check (shop_id in (select shop_id from public.profiles where id = auth.uid()));

create policy "Users can update void status only"
on public.sales for update
using (shop_id in (select shop_id from public.profiles where id = auth.uid()))
with check (shop_id in (select shop_id from public.profiles where id = auth.uid())); 
-- Note: Thực tế update policy cần chặt hơn nếu muốn strict append-only, nhưng cần cho Void logic.

-- Sale Items
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  price numeric(15, 0) not null, -- Giá tại thời điểm bán
  product_name text not null -- Snapshot tên sp
);

alter table public.sale_items enable row level security;

create policy "Users can view sale items in their shop"
on public.sale_items for select
using (
  sale_id in (select id from public.sales where shop_id in (select shop_id from public.profiles where id = auth.uid()))
);

create policy "Users can insert sale items"
on public.sale_items for insert
with check (
  sale_id in (select id from public.sales where shop_id in (select shop_id from public.profiles where id = auth.uid()))
);

-- 3. CASHBOOK (SỔ QUỸ)
-- ---------------------------------------------
create table public.cash_flows (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  amount numeric(15, 0) not null,
  type text check (type in ('in', 'out')) not null,
  category text default 'sale', -- sale, expense, import, adjustment
  description text,
  ref_id uuid, -- Reference to sale_id if applicable
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cash_flows enable row level security;

create policy "Users can view cash flows in their shop"
on public.cash_flows for select
using (shop_id in (select shop_id from public.profiles where id = auth.uid()));

create policy "Users can insert cash flows in their shop"
on public.cash_flows for insert
with check (shop_id in (select shop_id from public.profiles where id = auth.uid()));


-- 4. TRIGGERS & BUSINESS LOGIC
-- ---------------------------------------------

-- Trigger: Auto create cash flow when Sale created
create or replace function public.handle_new_sale()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.cash_flows (shop_id, amount, type, category, description, ref_id, created_at)
  values (
    new.shop_id,
    new.total_amount,
    'in',
    'sale',
    'Thu tiền bán hàng đơn ' || new.code,
    new.id,
    new.sale_date
  );
  return new;
end;
$$;

create trigger on_sale_created
  after insert on public.sales
  for each row execute procedure public.handle_new_sale();


-- Trigger: Subtract stock when Sale Item created
-- Note: Simplified. Production would need to handle Inventory Log creation first.
-- Here we do: Sale Item -> Update Product Stock Direct (for MVP speed) OR Create Log?
-- Let's do: Sale Item -> Create Inventory Log -> Trigger update Stock.

-- Step 1: Trigger on Inventory Log to update Product Stock
create or replace function public.update_stock_from_log()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.products
  set stock_quantity = stock_quantity + new.change_amount
  where id = new.product_id;
  return new;
end;
$$;

create trigger on_inventory_log_created
  after insert on public.inventory_logs
  for each row execute procedure public.update_stock_from_log();

-- Step 2: Trigger on Sale Item to create Inventory Log
create or replace function public.handle_new_sale_item()
returns trigger
language plpgsql
security definer
as $$
declare
  v_shop_id uuid;
  v_current_stock integer;
begin
  -- Get shop_id from sale
  select shop_id into v_shop_id from public.sales where id = new.sale_id;
  
  -- Get current stock
  select stock_quantity into v_current_stock from public.products where id = new.product_id;

  -- Create log (Sale = subtract stock)
  insert into public.inventory_logs (shop_id, product_id, change_amount, current_stock, type, note)
  values (
    v_shop_id,
    new.product_id,
    -new.quantity, -- Negative for sale
    v_current_stock - new.quantity,
    'sale',
    'Bán hàng'
  );
  
  return new;
end;
$$;

create trigger on_sale_item_created
  after insert on public.sale_items
  for each row execute procedure public.handle_new_sale_item();
