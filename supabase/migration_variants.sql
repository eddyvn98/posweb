-- =============================================
-- MIGRATION: Add Product Variants Support
-- =============================================

-- 1. Add columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- 2. Create index for faster lookup of variants
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);

-- 3. Update comments for documentation
COMMENT ON COLUMN public.products.parent_id IS 'ID of the parent product if this is a variant';
COMMENT ON COLUMN public.products.attributes IS 'JSON object containing variant attributes (e.g., {"Size": "L", "Color": "Red"})';

-- Note: No changes needed to triggers! 
-- The existing on_inventory_log_created and on_sale_item_created 
-- will work perfectly with variants because they treat them as regular products.
