-- ============================================================
-- 33PL 주소 체계 고도화 마이그레이션 (도로명/지번 주소 분리 저장)
-- 실행 위치: Supabase SQL Editor
-- ============================================================

-- warehouses 테이블에 road_address, jibun_address 추가
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS road_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jibun_address VARCHAR(255);

-- customers 테이블에 road_address, jibun_address 추가
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS road_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jibun_address VARCHAR(255);

-- (선택) 기존 detail_address 에서 추출하는 작업은 복잡하므로 
-- 신규/수정 시에만 적용하기 위해 생략합니다. 기존 detail_address는 fallback으로 사용됨.
