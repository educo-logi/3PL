-- 열람권(Viewing Passes) 테이블 생성 (이미 있으면 건너뜀)
create table if not exists public.viewing_passes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  package_type text default 'basic', -- 'basic', 'premium', 'deluxe'
  remaining_count integer default 0,
  total_count integer default 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 열람 이력(Viewing History) 테이블 생성 (이미 있으면 건너뜀)
create table if not exists public.viewing_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id uuid not null, -- 창고 또는 고객사 ID
  item_type text not null, -- 'warehouse' or 'customer'
  item_name text, -- 당시의 업체명 (기록용)
  viewed_at timestamp with time zone default now()
);

-- RLS (Row Level Security) 설정
-- 테이블이 이미 존재하더라도 RLS는 켜두는 것이 안전
alter table public.viewing_passes enable row level security;
alter table public.viewing_history enable row level security;

-- 기존 정책이 있다면 삭제하고 다시 생성 (에러 방지)
drop policy if exists "Users can view own passes" on public.viewing_passes;
create policy "Users can view own passes"
  on public.viewing_passes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view own history" on public.viewing_history;
create policy "Users can view own history"
  on public.viewing_history for select
  using (auth.uid() = user_id);

-- 인서트/업데이트 정책
drop policy if exists "Users can insert own passes" on public.viewing_passes;
create policy "Users can insert own passes"
  on public.viewing_passes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own passes" on public.viewing_passes;
create policy "Users can update own passes"
  on public.viewing_passes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.viewing_history;
create policy "Users can insert own history"
  on public.viewing_history for insert
  with check (auth.uid() = user_id);
