-- 프리미엄 신청 관리 테이블 추가

-- 1. warehouses 테이블에 프리미엄 필드 추가
ALTER TABLE public.warehouses
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS premium_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. customers 테이블에 프리미엄 필드 추가
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS premium_updated_at TIMESTAMP WITH TIME ZONE;

-- 3. premium_applications 테이블 신규 추가
CREATE TABLE IF NOT EXISTS public.premium_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'warehouse' or 'customer'
    item_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.premium_applications ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 신청 내역 조회 가능
CREATE POLICY "Enable read for users own applications" ON public.premium_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- 모든 사용자가 프리미엄 업체 조회는 가능해야 하므로 Read All 허용할 필요성에 따라 (필수는 아님 - 창고/고객사 테이블의 필드로 판단하므로)

-- 관리자 기능을 위한 조회 (임시: 모두 읽기 가능)
CREATE POLICY "Enable read for all" ON public.premium_applications
    FOR SELECT
    USING (true);

-- 삽입 (자신의 신청만)
CREATE POLICY "Enable insert for authenticated users only" ON public.premium_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
