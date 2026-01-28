-- Change item_id column in viewing_history to TEXT to support both UUIDs (Supabase) and numeric IDs (Sample Data)
ALTER TABLE viewing_history 
ALTER COLUMN item_id TYPE text USING item_id::text;

-- Ensure item_type is also text
ALTER TABLE viewing_history 
ALTER COLUMN item_type TYPE text;

-- Add comment
COMMENT ON COLUMN viewing_history.item_id IS 'Support both UUID and numeric IDs via text type';
