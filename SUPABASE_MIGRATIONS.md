# 🔄 Supabase SQL Updates Required

## Current Status
✅ Codebase is ready
⚠️ Database schema needs updates

---

## SQL to Execute in Supabase SQL Editor

Copy and execute these migrations in your Supabase project's SQL Editor:

### 1️⃣ CREATE IMPORTS TABLE + ADD MISSING COLUMNS

```sql
-- =============================================
-- MIGRATION: Add Imports Table & Missing Columns
-- =============================================

-- Create imports table
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  import_date date not null,
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

-- Add missing columns to existing tables
alter table public.shops add column if not exists address text;
alter table public.sales add column if not exists sale_local_date date;
alter table public.cash_flows add column if not exists source text check (source in ('sale', 'import', 'manual'));

-- Create indexes for performance
create index if not exists idx_imports_shop_date on imports(shop_id, import_date desc);
create index if not exists idx_imports_shop_created on imports(shop_id, created_at desc);
create index if not exists idx_sales_local_date on sales(shop_id, sale_local_date desc);
```

---

## What This Does

### ✅ Creates `imports` table
- Tracks all imports/purchases with:
  - `import_date` (local date GMT+7)
  - `supplier_name` (vendor name)
  - `total_cost` (expense amount)
  - `note` (optional notes)

### ✅ Adds columns to existing tables

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `shops` | `address` | text | Store location |
| `sales` | `sale_local_date` | date | GMT+7 date for daily reporting |
| `cash_flows` | `source` | enum | Track where cash came from |

### ✅ Configures Row Level Security (RLS)
- Users can only view/insert their own shop's imports
- Follows existing security pattern

### ✅ Creates Indexes
- Faster queries for imports by shop & date
- Faster queries for sales by local_date

---

## Execution Steps

1. **Open Supabase SQL Editor**
   - Go to your project: https://supabase.com/dashboard
   - Click "SQL Editor"
   - Click "New Query"

2. **Copy & Paste Migration**
   - Copy the SQL block above
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Success**
   - You should see: "Query executed successfully"
   - Check Table Editor to see `imports` table

---

## After Migration

Once executed, the application will:
- ✅ Allow recording imports via `/imports` page
- ✅ Auto-create cash flow entries for expenses
- ✅ Show imports in cashbook (Sheet 5 of Excel export)
- ✅ Support daily revenue reports with proper dates

---

## Fallback (If Migration Fails)

The code has a fallback: if `sale_local_date` column doesn't exist, it calculates dates from `sale_date` on the client side using GMT+7 timezone conversion.

**However**, for best performance and accuracy, execute the migration above.

---

## File Reference
- SQL migration: [supabase/migration_imports.sql](supabase/migration_imports.sql)
- Related changes: 
  - [src/lib/reports.js](src/lib/reports.js) - Uses sale_date with GMT+7 conversion
  - [src/pages/Imports.jsx](src/pages/Imports.jsx) - Uses imports table
  - [src/pages/Cashbook.jsx](src/pages/Cashbook.jsx) - Reads from imports via cash_flows

---

## Checklist
- [ ] Execute migration in Supabase SQL Editor
- [ ] Verify `imports` table created
- [ ] Check columns added to `sales` table
- [ ] Confirm indexes created
- [ ] Test Imports page in app
- [ ] Test Cashbook shows import entries
- [ ] Test Excel export (Sheet 5)

