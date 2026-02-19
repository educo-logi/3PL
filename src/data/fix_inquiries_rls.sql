-- inquiries 테이블의 RLS(Row Level Security) 문제 해결을 위한 스크립트
-- 간단한 해결을 위해 RLS를 비활성화하거나, 모든 사용자에게 권한을 부여합니다.

-- 1. 기존 정책이 있다면 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Allow public insert to inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for all users" ON inquiries;
DROP POLICY IF EXISTS "Enable update for all users" ON inquiries;

-- 2. RLS 활성화 (이미 되어있을 수 있음)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 3. 모든 작업(SELECT, INSERT, UPDATE, DELETE) 허용 정책 생성
-- (관리자 인증이 로컬스토리지 방식이므로 DB 레벨에서는 public 권한이 필요함)
CREATE POLICY "Allow all access to public"
ON inquiries
FOR ALL
USING (true)
WITH CHECK (true);
