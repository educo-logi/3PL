-- ============================================================
-- 33PL 보안 리미디에이션 마이그레이션
-- 실행 위치: Supabase SQL Editor
-- 전략: 신규 가입자만 Supabase Auth 적용 (기존 5명 현행 유지)
-- ============================================================

-- ============================================================
-- 1. auth_user_id 컬럼 추가 (Supabase Auth 연동)
-- ============================================================
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- auth_user_id 인덱스 (로그인 시 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_warehouses_auth_user_id ON public.warehouses(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- ============================================================
-- 2. 관리자 확인용 DB 함수
-- auth.jwt()의 app_metadata에서 role을 확인합니다.
-- Supabase 대시보드 → Authentication → Users → 관리자 계정 선택
-- → app_metadata에 {"role": "admin"} 설정 필요
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. warehouses 테이블 RLS 정책 재설계
-- ============================================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read/write for all" ON public.warehouses;
DROP POLICY IF EXISTS "select_warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "insert_warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "update_warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "delete_warehouses" ON public.warehouses;

-- RLS 활성화  
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증된 사용자 또는 anon 모두 읽기 허용 (검색 페이지 동작 필요)
-- 단, password 컬럼은 application 레벨에서 select 시 제외하도록 강제
CREATE POLICY "select_warehouses" ON public.warehouses
  FOR SELECT USING (true);

-- INSERT: 회원가입을 위해 anon + authenticated 모두 허용
CREATE POLICY "insert_warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (true);

-- UPDATE: 본인(auth_user_id 일치) 또는 관리자만
-- 레거시 사용자(auth_user_id IS NULL)는 anon으로 접근하므로 임시 허용
CREATE POLICY "update_warehouses" ON public.warehouses
  FOR UPDATE USING (
    auth.uid() = auth_user_id   -- 새 사용자: Supabase Auth 본인 확인
    OR is_admin()               -- 관리자
    OR auth_user_id IS NULL     -- 레거시 사용자 (임시 - 마이그레이션 후 제거)
  );

-- DELETE: 관리자만
CREATE POLICY "delete_warehouses" ON public.warehouses
  FOR DELETE USING (is_admin());

-- ============================================================
-- 4. customers 테이블 RLS 정책 재설계 (동일 패턴)
-- ============================================================
DROP POLICY IF EXISTS "Enable read/write for all" ON public.customers;
DROP POLICY IF EXISTS "select_customers" ON public.customers;
DROP POLICY IF EXISTS "insert_customers" ON public.customers;
DROP POLICY IF EXISTS "update_customers" ON public.customers;
DROP POLICY IF EXISTS "delete_customers" ON public.customers;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "insert_customers" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "update_customers" ON public.customers
  FOR UPDATE USING (
    auth.uid() = auth_user_id
    OR is_admin()
    OR auth_user_id IS NULL
  );

CREATE POLICY "delete_customers" ON public.customers
  FOR DELETE USING (is_admin());

-- ============================================================
-- 5. viewing_passes 테이블 RLS 재활성화
-- (force_open_rls.sql에서 비활성화된 것을 복구)
-- ============================================================
ALTER TABLE public.viewing_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own passes" ON public.viewing_passes;
DROP POLICY IF EXISTS "Users can insert own passes" ON public.viewing_passes;
DROP POLICY IF EXISTS "Users can update own passes" ON public.viewing_passes;
DROP POLICY IF EXISTS "select_viewing_passes" ON public.viewing_passes;
DROP POLICY IF EXISTS "insert_viewing_passes" ON public.viewing_passes;
DROP POLICY IF EXISTS "update_viewing_passes" ON public.viewing_passes;

-- viewing_passes: 전체 SELECT 허용 (user_id 기반 필터링은 앱 레벨에서)
-- anon 사용자(레거시)도 접근 가능해야 하므로
CREATE POLICY "select_viewing_passes" ON public.viewing_passes
  FOR SELECT USING (true);

CREATE POLICY "insert_viewing_passes" ON public.viewing_passes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "update_viewing_passes" ON public.viewing_passes
  FOR UPDATE USING (true);

-- ============================================================
-- 6. viewing_history 테이블 RLS 재활성화
-- ============================================================
ALTER TABLE public.viewing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON public.viewing_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.viewing_history;
DROP POLICY IF EXISTS "select_viewing_history" ON public.viewing_history;
DROP POLICY IF EXISTS "insert_viewing_history" ON public.viewing_history;

CREATE POLICY "select_viewing_history" ON public.viewing_history
  FOR SELECT USING (true);

CREATE POLICY "insert_viewing_history" ON public.viewing_history
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 7. payment_history 테이블 RLS (존재하는 경우)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "select_payment_history" ON public.payment_history';
    EXECUTE 'DROP POLICY IF EXISTS "insert_payment_history" ON public.payment_history';
    
    EXECUTE 'CREATE POLICY "select_payment_history" ON public.payment_history FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "insert_payment_history" ON public.payment_history FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- ============================================================
-- 완료 메모
-- ============================================================
COMMENT ON COLUMN public.warehouses.auth_user_id IS 'Supabase Auth user ID (신규 가입자만). 레거시 사용자는 NULL.';
COMMENT ON COLUMN public.customers.auth_user_id IS 'Supabase Auth user ID (신규 가입자만). 레거시 사용자는 NULL.';
COMMENT ON FUNCTION public.is_admin() IS '현재 JWT의 app_metadata.role이 admin인지 확인';
