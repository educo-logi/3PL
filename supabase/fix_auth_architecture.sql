-- CRITICAL FIX: Align viewing_passes with Custom Auth Architecture
-- Run this in Supabase SQL Editor

-- 1. Disable RLS for viewing_passes and viewing_history
-- Since we are not using Supabase Auth (auth.uid), we relying on client-side ID logic for now.
-- In a real production app, we would implement custom claims or move auth to Supabase Auth completely.
alter table public.viewing_passes disable row level security;
alter table public.viewing_history disable row level security;

-- 2. Drop Foreign Key Constraints to auth.users
-- Because our user_ids come from 'warehouses' or 'customers' tables, not auth.users
alter table public.viewing_passes drop constraint if exists viewing_passes_user_id_fkey;
alter table public.viewing_history drop constraint if exists viewing_history_user_id_fkey;

-- 3. Update the view to join with the correct tables (warehouses and customers) using the UUID
drop view if exists public.viewing_passes_details;

create or replace view public.viewing_passes_details as
select
  coalesce(w.company_name, c.company_name, 'Unknown') as company_name,
  coalesce(w.email, c.email, 'Unknown') as user_email,
  vp.*,
  case
    when w.id is not null then 'warehouse'
    when c.id is not null then 'customer'
    else 'unknown'
  end as user_type
from public.viewing_passes vp
left join public.warehouses w on vp.user_id = w.id
left join public.customers c on vp.user_id = c.id;

-- 4. Ensure total_count exists (Redundant safety check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'total_count') THEN
        ALTER TABLE public.viewing_passes ADD COLUMN total_count integer default 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'expiry_date') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'viewing_passes' AND column_name = 'expires_at') THEN
        ALTER TABLE public.viewing_passes RENAME COLUMN expiry_date TO expires_at;
    END IF;
END $$;
