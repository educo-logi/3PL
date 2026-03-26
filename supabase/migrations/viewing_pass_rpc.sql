-- ============================================================
-- 열람권 원자적 차감 함수 (Race Condition 해결)
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1. use_viewing_pass: 열람권 사용 (원자적 트랜잭션)
-- 
-- 하나의 DB 함수 안에서 다음을 원자적으로 수행:
--   1) 이미 열람한 항목인지 확인
--   2) 유효한 열람권 찾기 (만료 안 된 것 중 잔여 횟수 > 0)
--   3) remaining_count를 1 차감 (행 잠금으로 동시성 방어)
--   4) viewing_history 기록 INSERT
-- 
-- 클라이언트에서 별도로 SELECT → UPDATE 하지 않으므로
-- Race Condition이 구조적으로 불가능합니다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.use_viewing_pass(
  p_user_id UUID,
  p_item_id UUID,
  p_item_type TEXT,
  p_item_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass_id UUID;
  v_new_remaining INTEGER;
  v_package_type TEXT;
  v_already_viewed BOOLEAN;
BEGIN
  -- 1. 이미 열람한 항목인지 확인
  SELECT EXISTS(
    SELECT 1 FROM public.viewing_history
    WHERE user_id = p_user_id
      AND item_id = p_item_id
      AND item_type = p_item_type
  ) INTO v_already_viewed;

  IF v_already_viewed THEN
    RETURN json_build_object(
      'success', true,
      'already_viewed', true,
      'remaining_count', NULL
    );
  END IF;

  -- 2. 유효한 열람권을 찾아 원자적으로 차감
  --    FOR UPDATE: 행 잠금으로 동시 접근 방어
  --    remaining_count > 0 AND 만료되지 않은 것만
  --    만료 임박한 것부터 소진 (FIFO)
  UPDATE public.viewing_passes
  SET
    remaining_count = remaining_count - 1,
    updated_at = now()
  WHERE id = (
    SELECT id
    FROM public.viewing_passes
    WHERE user_id = p_user_id
      AND remaining_count > 0
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED  -- 다른 트랜잭션이 잠금 중이면 건너뜀
  )
  RETURNING id, remaining_count, package_type
  INTO v_pass_id, v_new_remaining, v_package_type;

  -- 유효한 열람권이 없는 경우
  IF v_pass_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사용 가능한 열람권이 없습니다.',
      'remaining_count', NULL
    );
  END IF;

  -- 3. 열람 이력 기록
  INSERT INTO public.viewing_history (user_id, item_id, item_type, item_name)
  VALUES (p_user_id, p_item_id, p_item_type, p_item_name);

  -- 4. 성공 응답
  RETURN json_build_object(
    'success', true,
    'already_viewed', false,
    'remaining_count', v_new_remaining,
    'package_type', v_package_type,
    'pass_id', v_pass_id
  );
END;
$$;

-- 함수 설명
COMMENT ON FUNCTION public.use_viewing_pass(UUID, UUID, TEXT, TEXT)
IS '열람권을 원자적으로 차감하고 열람 이력을 기록합니다. Race Condition을 방지하기 위해 FOR UPDATE SKIP LOCKED 사용.';

-- ============================================================
-- 2. purchase_viewing_pass: 열람권 구매 (원자적 트랜잭션)
-- 
-- 기존 열람권이 있으면 횟수/기간 추가
-- 없으면 신규 생성
-- 결제 이력도 함께 기록
-- ============================================================

CREATE OR REPLACE FUNCTION public.purchase_viewing_pass(
  p_user_id UUID,
  p_package_type TEXT DEFAULT 'basic',
  p_count INTEGER DEFAULT 10,
  p_validity_months INTEGER DEFAULT 12,
  p_price INTEGER DEFAULT 50000,
  p_order_id TEXT DEFAULT NULL,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_result RECORD;
  v_new_expiry TIMESTAMPTZ;
  v_base_date TIMESTAMPTZ;
BEGIN
  -- 1. 기존 열람권 확인 (행 잠금)
  SELECT * INTO v_existing
  FROM public.viewing_passes
  WHERE user_id = p_user_id
  LIMIT 1
  FOR UPDATE;

  IF v_existing IS NOT NULL THEN
    -- 기존 열람권 존재: 횟수 추가 + 기간 연장
    v_base_date := GREATEST(v_existing.expires_at, now());
    v_new_expiry := v_base_date + (p_validity_months || ' months')::INTERVAL;

    UPDATE public.viewing_passes
    SET
      remaining_count = remaining_count + p_count,
      total_count = total_count + p_count,
      expires_at = v_new_expiry,
      updated_at = now()
    WHERE id = v_existing.id
    RETURNING * INTO v_result;
  ELSE
    -- 신규 열람권 생성
    v_new_expiry := now() + (p_validity_months || ' months')::INTERVAL;

    INSERT INTO public.viewing_passes (
      user_id, package_type, remaining_count, total_count, expires_at
    ) VALUES (
      p_user_id, p_package_type, p_count, p_count, v_new_expiry
    )
    RETURNING * INTO v_result;
  END IF;

  -- 2. 결제 이력 저장
  INSERT INTO public.payment_history (
    user_id, amount, package_type, status, order_id, receipt_url
  ) VALUES (
    p_user_id, p_price, p_package_type, 'success', p_order_id, p_receipt_url
  );

  -- 3. 성공 응답
  RETURN json_build_object(
    'success', true,
    'pass_id', v_result.id,
    'remaining_count', v_result.remaining_count,
    'total_count', v_result.total_count,
    'expires_at', v_result.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.purchase_viewing_pass(UUID, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT)
IS '열람권을 원자적으로 구매/추가합니다. 기존 열람권이 있으면 횟수와 기간을 추가하고, 없으면 신규 생성합니다.';
