-- Synthetic data only; no Auth HTTP calls/emails. Every test change is rolled
-- back. Run after the atomic-registration migration as the database owner.
BEGIN;
DO $$
DECLARE
  v_id uuid;
  v_request uuid;
  v_email text;
  v_type text;
  v_profile jsonb := '{"company_name":"Registration smoke test","business_number":"000-00-00000","contact_person":"Test contact","contact_phone":"01000000000"}'::jsonb;
  v_count integer;
  v_result jsonb;
  v_phone text;
BEGIN
  FOREACH v_type IN ARRAY ARRAY['warehouse','customer'] LOOP
    v_id := gen_random_uuid(); v_request := gen_random_uuid();
    v_email := '33pl-registration-smoke-' || v_id || '@example.invalid';
    INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
    VALUES (v_id, v_email, now(), jsonb_build_object('user_type',v_type,'registration_version',1,
      'registration_request_id',v_request,'registration_profile',v_profile));
    SELECT count(*) INTO v_count FROM registration_private.emails WHERE auth_user_id=v_id;
    IF v_count <> 1 THEN RAISE EXCEPTION 'SMOKE_PROFILE_MISSING'; END IF;
    IF v_type='warehouse' THEN
      SELECT contact_phone INTO v_phone FROM public.warehouses WHERE auth_user_id=v_id AND status='pending';
    ELSE
      SELECT contact_phone INTO v_phone FROM public.customers WHERE auth_user_id=v_id AND status='pending';
    END IF;
    IF to_regprocedure('public.decrypt_pii(text)') IS NOT NULL THEN v_phone := public.decrypt_pii(v_phone); END IF;
    IF v_phone IS DISTINCT FROM '01000000000' THEN RAISE EXCEPTION 'SMOKE_PHONE_STORAGE_FAILED'; END IF;
  END LOOP;

  v_id := gen_random_uuid(); v_request := gen_random_uuid();
  v_email := '33pl-registration-smoke-' || v_id || '@example.invalid';
  BEGIN
    INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
    VALUES (v_id,v_email,now(),jsonb_build_object('user_type','warehouse','registration_version',1,
      'registration_request_id',v_request,'registration_profile',v_profile || '{"pallet_count":"invalid-number"}'::jsonb));
    RAISE EXCEPTION 'SMOKE_EXPECTED_PROFILE_FAILURE';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;
  IF EXISTS(SELECT 1 FROM auth.users WHERE id=v_id) OR EXISTS(SELECT 1 FROM registration_private.emails WHERE email=v_email) THEN
    RAISE EXCEPTION 'SMOKE_ORPHAN_AFTER_FAILURE';
  END IF;
  -- Retry exactly the failed email and account id with valid profile data.
  INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
  VALUES (v_id,v_email,now(),jsonb_build_object('user_type','warehouse','registration_version',1,
    'registration_request_id',v_request,'registration_profile',v_profile));

  v_id := gen_random_uuid();
  v_email := '33pl-registration-smoke-' || v_id || '@example.invalid';
  INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES(v_id,v_email,now(),'{}');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_id,'role','authenticated')::text,true);
  v_result := public.complete_registration('warehouse',v_profile,gen_random_uuid());
  IF v_result->>'code' <> 'REGISTERED' THEN RAISE EXCEPTION 'SMOKE_RECOVERY_FAILED'; END IF;
  v_result := public.complete_registration('customer',v_profile,gen_random_uuid());
  IF v_result->>'code' <> 'ALREADY_REGISTERED' THEN RAISE EXCEPTION 'SMOKE_CROSS_TYPE_DUPLICATE'; END IF;
END $$;
ROLLBACK;
SELECT
  'PASS: atomic signup, encryption storage, failure/retry and orphan recovery' AS verification,
  NOT EXISTS(SELECT 1 FROM auth.users WHERE email LIKE '33pl-registration-smoke-%@example.invalid') AS no_test_accounts_remaining,
  public.registration_preflight('33pl-registration-smoke-check@example.invalid')->>'version' AS protocol_version;
