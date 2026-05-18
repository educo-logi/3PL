-- ============================================================
-- 20240518_secure_data_views.sql
-- 개인정보 보호 강화를 위한 RLS 정책 및 Public View 생성
-- ============================================================

-- 1. warehouses 테이블의 안전한 Public View 생성 (연락처, 비밀번호 등 민감 정보 제외)
CREATE OR REPLACE VIEW public.vw_public_warehouses AS
SELECT
    id,
    user_type,
    status,
    submitted_at,
    approved_at,
    company_name,
    -- business_number 제외
    -- representative 제외
    -- phone 제외
    -- contact_person 제외
    -- contact_phone 제외
    -- email 제외
    -- password 제외
    location,
    city,
    dong,
    total_area,
    total_area_unit,
    warehouse_count,
    warehouse_area,
    warehouse_area_unit,
    available_area,
    available_area_unit,
    pallet_count,
    experience,
    storage_types,
    delivery_companies,
    other_delivery_company,
    solutions,
    other_solution,
    products,
    auth_user_id
FROM public.warehouses;

-- 2. customers 테이블의 안전한 Public View 생성 (연락처, 비밀번호 등 민감 정보 제외)
CREATE OR REPLACE VIEW public.vw_public_customers AS
SELECT
    id,
    user_type,
    status,
    submitted_at,
    approved_at,
    company_name,
    -- representative 제외
    -- phone 제외
    -- contact_person 제외
    -- contact_phone 제외
    -- email 제외
    -- password 제외
    location,
    city,
    dong,
    required_area,
    required_area_unit,
    monthly_volume,
    pallet_count,
    desired_delivery,
    products,
    auth_user_id
FROM public.customers;

-- 권한 부여 (Anon 및 Authenticated 사용자가 뷰를 읽을 수 있도록 허용)
GRANT SELECT ON public.vw_public_warehouses TO anon, authenticated;
GRANT SELECT ON public.vw_public_customers TO anon, authenticated;

-- ============================================================
-- 3. 열람권 보유/관리자/본인 여부를 확인하고 상세 정보를 반환하는 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_secure_contact_info(
    p_item_id UUID,
    p_item_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- RLS를 우회하여 내부 데이터를 읽기 위해 사용
AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
    v_is_owner BOOLEAN := false;
    v_has_viewed BOOLEAN := false;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    -- 관리자 권한 확인
    v_is_admin := public.is_admin();

    -- 열람 기록 확인 (viewing_history)
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.viewing_history
            WHERE user_id = v_user_id
              AND item_id = p_item_id
              AND item_type = p_item_type
        ) INTO v_has_viewed;
    END IF;

    IF p_item_type = 'warehouse' THEN
        -- 본인 확인
        IF v_user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.warehouses
                WHERE id = p_item_id AND auth_user_id = v_user_id
            ) INTO v_is_owner;
        END IF;

        IF v_is_admin OR v_is_owner OR v_has_viewed THEN
            SELECT json_build_object(
                'email', email,
                'phone', phone,
                'contact_person', contact_person,
                'contact_phone', contact_phone,
                'representative', representative,
                'business_number', business_number
            ) INTO v_result
            FROM public.warehouses
            WHERE id = p_item_id;
            RETURN v_result;
        ELSE
            RETURN NULL; -- 권한 없음
        END IF;

    ELSIF p_item_type = 'customer' THEN
        -- 본인 확인
        IF v_user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.customers
                WHERE id = p_item_id AND auth_user_id = v_user_id
            ) INTO v_is_owner;
        END IF;

        IF v_is_admin OR v_is_owner OR v_has_viewed THEN
            SELECT json_build_object(
                'email', email,
                'phone', phone,
                'contact_person', contact_person,
                'contact_phone', contact_phone,
                'representative', representative
            ) INTO v_result
            FROM public.customers
            WHERE id = p_item_id;
            RETURN v_result;
        ELSE
            RETURN NULL; -- 권한 없음
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_secure_contact_info(UUID, TEXT) TO anon, authenticated;

-- ============================================================
-- 4. 기존 테이블의 RLS 정책 강화 (직접 조회 차단)
-- ============================================================

-- Warehouses
DROP POLICY IF EXISTS "select_warehouses" ON public.warehouses;
CREATE POLICY "select_warehouses" ON public.warehouses
FOR SELECT USING (
    auth.uid() = auth_user_id 
    OR public.is_admin()
);

-- Customers
DROP POLICY IF EXISTS "select_customers" ON public.customers;
CREATE POLICY "select_customers" ON public.customers
FOR SELECT USING (
    auth.uid() = auth_user_id 
    OR public.is_admin()
);

-- 참고: 레거시 사용자(auth_user_id IS NULL)의 경우 위 정책에 의해 직접 조회가 막힙니다.
-- 단, AdminDashboard는 is_admin()으로 모두 조회할 수 있으며,
-- Search 페이지는 vw_public_* 뷰를 통해 접근하므로 문제가 없습니다.
-- 레거시 사용자 본인이 로그인 후 자신의 데이터를 보려면 마이그레이션이 완전히 완료되어 auth_user_id가 매핑되어야 합니다.
-- (임시로 OR auth_user_id IS NULL 을 SELECT에 넣는 것은 취약점을 부활시키므로 제외합니다.)
