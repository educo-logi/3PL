-- Disable RLS for warehouses and customers to allow public registration
alter table public.warehouses disable row level security;
alter table public.customers disable row level security;
