-- Create a view to display viewing pass details with user email and company name
-- Run this in the Supabase SQL Editor

drop view if exists public.viewing_passes_details;

create or replace view public.viewing_passes_details as
select
  coalesce(w.company_name, c.company_name, 'Unknown') as company_name,
  u.email as user_email,
  vp.*,
  case
    when w.company_name is not null then 'warehouse'
    when c.company_name is not null then 'customer'
    else 'unknown'
  end as user_type
from public.viewing_passes vp
join auth.users u on vp.user_id = u.id
left join public.warehouses w on u.email = w.email
left join public.customers c on u.email = c.email;

-- Grant access to the view (optional, depending on who needs to see it)
-- grant select on public.viewing_passes_details to authenticated;
-- grant select on public.viewing_passes_details to service_role;

comment on view public.viewing_passes_details is 'View combining viewing passes with user email and company name for easier administration.';
