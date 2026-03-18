-- Customers 테이블에 사업자등록번호(business_number) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'business_number'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN business_number VARCHAR(50);
        COMMENT ON COLUMN public.customers.business_number IS '사업자 등록번호';
    END IF;
END $$;
