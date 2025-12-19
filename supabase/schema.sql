-- Supabase 스키마 및 RLS 예시

-- 1) profiles
create table if not exists public.profiles (
  id uuid primary key,
  email text unique not null,
  user_type text not null check (user_type in ('warehouse','customer','admin')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- 2) warehouses
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  company_name text,
  business_number text,
  representative text,
  phone text,
  contact_person text,
  contact_phone text,
  email text,
  location text,
  city text,
  dong text,
  total_area text,
  warehouse_count text,
  warehouse_area text,
  available_area text,
  pallet_count text,
  experience text,
  storage_types jsonb,
  delivery_companies jsonb,
  other_delivery_company text,
  solutions jsonb,
  other_solution text,
  products jsonb,
  is_premium boolean default false,
  premium_end_at timestamptz,
  submitted_at timestamptz default now(),
  approved_at timestamptz
);

-- 3) customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  company_name text,
  location text,
  city text,
  dong text,
  representative text,
  phone text,
  contact_person text,
  contact_phone text,
  email text,
  required_area text,
  required_area_unit text,
  pallet_count text,
  monthly_volume text,
  desired_delivery jsonb,
  products jsonb,
  is_premium boolean default false,
  premium_end_at timestamptz,
  submitted_at timestamptz default now(),
  approved_at timestamptz
);

-- 4) viewing_passes (열람권: 패키지/연장/사용 이력까지 저장)
create table if not exists public.viewing_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_type text,
  price integer,
  total_count integer,
  remaining_count integer,
  purchase_date timestamptz default now(),
  expires_at timestamptz,
  extended_at timestamptz,
  extension_price integer,
  used_history jsonb default '[]'::jsonb,
  viewed_items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 5) premium_applications (패키지/금액/승인일 포함)
create table if not exists public.premium_applications (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('warehouse','customer')),
  item_id uuid not null,
  applied_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  package_type text,
  amount integer,
  start_at timestamptz,
  end_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz default now()
);

-- 6) views (열람 로그)
create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('warehouse','customer')),
  item_id uuid not null,
  viewed_at timestamptz default now()
);

-- 7) favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('warehouse','customer')),
  item_id uuid not null,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.warehouses enable row level security;
alter table public.customers enable row level security;
alter table public.viewing_passes enable row level security;
alter table public.premium_applications enable row level security;
alter table public.views enable row level security;
alter table public.favorites enable row level security;

-- 기본 정책 (자기 소유 접근)
create policy if not exists "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy if not exists "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

create policy if not exists "warehouses_self_crud" on public.warehouses
  for all using (auth.uid() = owner_id);

create policy if not exists "customers_self_crud" on public.customers
  for all using (auth.uid() = owner_id);

create policy if not exists "viewing_passes_self_crud" on public.viewing_passes
  for all using (auth.uid() = user_id);

create policy if not exists "views_self_select_insert" on public.views
  for select using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "favorites_self_crud" on public.favorites
  for all using (auth.uid() = user_id);

-- 공개 노출 정책 (승인된 것만)
create policy if not exists "warehouses_public_approved" on public.warehouses
  for select using (status = 'approved');

create policy if not exists "customers_public_approved" on public.customers
  for select using (status = 'approved');

-- 관리자 접근 (예: auth.jwt()에 role=admin 클레임 사용)
-- 실제 운영 시 Edge Function 또는 서비스 롤 키로 관리 권장

-- 서비스 롤(Edge Function)에서 상태 변경 가능하도록, 서비스 롤에는 제한 없음

-- 시스템/트리거용 삽입 허용 (auth.uid()가 없는 경우도 통과)
create policy if not exists "profiles_system_insert" on public.profiles
  for insert
  with check (auth.uid() = id or auth.uid() is null);

create policy if not exists "warehouses_system_insert" on public.warehouses
  for insert
  with check (auth.uid() = owner_id or auth.uid() is null);

create policy if not exists "customers_system_insert" on public.customers
  for insert
  with check (auth.uid() = owner_id or auth.uid() is null);

-- 신규 Auth 사용자 생성 시 profiles + warehouses/customers에 pending 행 자동 삽입
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  utype text := coalesce(meta->>'userType', 'customer');
  company text := coalesce(meta->>'company_name', '미입력');
  loc text := meta->>'location';
  city text := meta->>'city';
  dong text := meta->>'dong';
begin
  -- 프로필 upsert
  insert into public.profiles (id, email, user_type, status)
  values (new.id, new.email, utype, 'pending')
  on conflict (id) do update
    set email = excluded.email,
        user_type = excluded.user_type;

  -- 유형별 기본 행 삽입
  if utype = 'warehouse' then
    insert into public.warehouses (owner_id, status, company_name, location, city, dong, submitted_at)
    values (new.id, 'pending', company, loc, city, dong, now())
    on conflict (owner_id) do nothing;
  elsif utype = 'customer' then
    insert into public.customers (owner_id, status, company_name, location, city, dong, submitted_at)
    values (new.id, 'pending', company, loc, city, dong, now())
    on conflict (owner_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

