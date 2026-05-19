-- ============================================================
-- 20240519_encryption_and_audit.sql
-- 1. 관리자 감사 로그(Audit Log) 테이블 생성
-- 2. pgcrypto 기반 암/복호화 함수 생성
-- 3. 테이블 PII 컬럼 암호화 트리거 및 뷰 생성
-- ============================================================

-- 1. 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 암호화 키 설정 (실제 운영 환경에서는 vault 또는 안전한 환경 변수 사용 권장)
-- 여기서는 편의를 위해 고정 키를 사용합니다.
CREATE OR REPLACE FUNCTION public.get_encryption_key() RETURNS text AS $$
    SELECT '3pl_secure_key_2024_!@#'::text;
$$ LANGUAGE sql IMMUTABLE;

-- 3. 암/복호화 헬퍼 함수
CREATE OR REPLACE FUNCTION public.encrypt_pii(val text) RETURNS text AS $$
BEGIN
    IF val IS NULL OR val = '' THEN
        RETURN val;
    END IF;
    -- base64 인코딩을 통해 VARCHAR 필드에 안전하게 저장
    RETURN encode(pgp_sym_encrypt(val, public.get_encryption_key()), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_pii(val text) RETURNS text AS $$
BEGIN
    IF val IS NULL OR val = '' THEN
        RETURN val;
    END IF;
    -- base64 디코딩 후 복호화 (복호화 실패 시 원본 반환하여 기존 데이터 깨짐 방지)
    BEGIN
        RETURN pgp_sym_decrypt(decode(val, 'base64'), public.get_encryption_key());
    EXCEPTION WHEN OTHERS THEN
        RETURN val;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 자동 암호화 트리거 함수
CREATE OR REPLACE FUNCTION public.auto_encrypt_pii_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone THEN
        NEW.phone := public.encrypt_pii(NEW.phone);
    END IF;
    
    IF TG_OP = 'INSERT' OR NEW.contact_person IS DISTINCT FROM OLD.contact_person THEN
        NEW.contact_person := public.encrypt_pii(NEW.contact_person);
    END IF;

    IF TG_OP = 'INSERT' OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone THEN
        NEW.contact_phone := public.encrypt_pii(NEW.contact_phone);
    END IF;

    IF TG_OP = 'INSERT' OR NEW.representative IS DISTINCT FROM OLD.representative THEN
        NEW.representative := public.encrypt_pii(NEW.representative);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 트리거 적용 (Warehouses & Customers)
DROP TRIGGER IF EXISTS encrypt_pii_warehouses ON public.warehouses;
CREATE TRIGGER encrypt_pii_warehouses
BEFORE INSERT OR UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.auto_encrypt_pii_trigger();

DROP TRIGGER IF EXISTS encrypt_pii_customers ON public.customers;
CREATE TRIGGER encrypt_pii_customers
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.auto_encrypt_pii_trigger();

-- 6. 기존 데이터 마이그레이션 (1회성 암호화 실행)
-- 이미 암호화된 데이터를 다시 암호화하지 않도록 유의
UPDATE public.warehouses 
SET 
    phone = phone, -- 트리거가 작동하여 자동으로 암호화됨
    contact_person = contact_person,
    contact_phone = contact_phone,
    representative = representative
WHERE phone IS NOT NULL OR contact_person IS NOT NULL OR contact_phone IS NOT NULL OR representative IS NOT NULL;

UPDATE public.customers 
SET 
    phone = phone,
    contact_person = contact_person,
    contact_phone = contact_phone,
    representative = representative
WHERE phone IS NOT NULL OR contact_person IS NOT NULL OR contact_phone IS NOT NULL OR representative IS NOT NULL;


-- 7. 관리자용 복호화 뷰 생성 (Admin Dashboard용)
CREATE OR REPLACE VIEW public.vw_admin_warehouses AS
SELECT
    id, user_type, status, submitted_at, approved_at, company_name, business_number,
    public.decrypt_pii(representative) as representative,
    public.decrypt_pii(phone) as phone,
    public.decrypt_pii(contact_person) as contact_person,
    public.decrypt_pii(contact_phone) as contact_phone,
    email, password, location, city, dong, total_area, total_area_unit,
    warehouse_count, warehouse_area, warehouse_area_unit, available_area,
    available_area_unit, pallet_count, experience, storage_types,
    delivery_companies, other_delivery_company, solutions, other_solution,
    products, auth_user_id
FROM public.warehouses;

CREATE OR REPLACE VIEW public.vw_admin_customers AS
SELECT
    id, user_type, status, submitted_at, approved_at, company_name,
    public.decrypt_pii(representative) as representative,
    location, city, dong,
    public.decrypt_pii(phone) as phone,
    public.decrypt_pii(contact_person) as contact_person,
    public.decrypt_pii(contact_phone) as contact_phone,
    email, password, required_area, required_area_unit,
    monthly_volume, pallet_count, desired_delivery, products, auth_user_id
FROM public.customers;

GRANT SELECT ON public.vw_admin_warehouses TO authenticated;
GRANT SELECT ON public.vw_admin_customers TO authenticated;

-- 8. 감사 로그(Audit Log) 테이블
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'VIEW_PII', 'DOWNLOAD_EXCEL'
    target_table VARCHAR(50),    -- e.g., 'warehouses', 'customers'
    target_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_admin());

-- 9. 감사 로그 기록용 RPC 함수
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action text,
    p_target_table text DEFAULT NULL,
    p_target_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF public.is_admin() THEN
        INSERT INTO public.admin_audit_logs (admin_id, action, target_table, target_id)
        VALUES (auth.uid(), p_action, p_target_table, p_target_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. get_secure_contact_info 함수 수정 (복호화 적용 및 로깅 추가)
CREATE OR REPLACE FUNCTION public.get_secure_contact_info(
    p_item_id UUID,
    p_item_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
    v_is_owner BOOLEAN := false;
    v_has_viewed BOOLEAN := false;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    v_is_admin := public.is_admin();

    -- 관리자인 경우 감사 로그 남기기
    IF v_is_admin THEN
        PERFORM public.log_admin_action('VIEW_PII_MODAL', p_item_type, p_item_id);
    END IF;

    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.viewing_history
            WHERE user_id = v_user_id
              AND item_id = p_item_id
              AND item_type = p_item_type
        ) INTO v_has_viewed;
    END IF;

    IF p_item_type = 'warehouse' THEN
        IF v_user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.warehouses
                WHERE id = p_item_id AND auth_user_id = v_user_id
            ) INTO v_is_owner;
        END IF;

        IF v_is_admin OR v_is_owner OR v_has_viewed THEN
            SELECT json_build_object(
                'email', email,
                'phone', public.decrypt_pii(phone),
                'contact_person', public.decrypt_pii(contact_person),
                'contact_phone', public.decrypt_pii(contact_phone),
                'representative', public.decrypt_pii(representative),
                'business_number', business_number
            ) INTO v_result
            FROM public.warehouses
            WHERE id = p_item_id;
            RETURN v_result;
        END IF;

    ELSIF p_item_type = 'customer' THEN
        IF v_user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.customers
                WHERE id = p_item_id AND auth_user_id = v_user_id
            ) INTO v_is_owner;
        END IF;

        IF v_is_admin OR v_is_owner OR v_has_viewed THEN
            SELECT json_build_object(
                'email', email,
                'phone', public.decrypt_pii(phone),
                'contact_person', public.decrypt_pii(contact_person),
                'contact_phone', public.decrypt_pii(contact_phone),
                'representative', public.decrypt_pii(representative)
            ) INTO v_result
            FROM public.customers
            WHERE id = p_item_id;
            RETURN v_result;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;
