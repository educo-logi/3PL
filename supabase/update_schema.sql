-- Update viewing_passes table to match the new code structure
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Add total_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'total_count') THEN
        ALTER TABLE public.viewing_passes ADD COLUMN total_count integer default 0;
    END IF;

    -- 2. Rename expiry_date to expires_at if the old column exists and new one doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'expiry_date') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'expires_at') THEN
        ALTER TABLE public.viewing_passes RENAME COLUMN expiry_date TO expires_at;
    END IF;
END $$;
