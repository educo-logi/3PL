-- Apply as postgres, in SQL Editor, AFTER reviewing registration_preflight.sql.
-- Any conflict/error aborts the whole migration; never merge/delete accounts.
BEGIN;
LOCK TABLE auth.users IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.warehouses, public.customers IN SHARE ROW EXCLUSIVE MODE;

-- Columns needed by both the existing forms and the new server writer.
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS road_address varchar(255),
  ADD COLUMN IF NOT EXISTS jibun_address varchar(255),
  ADD COLUMN IF NOT EXISTS detail_address varchar(255);
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_number varchar(50),
  ADD COLUMN IF NOT EXISTS road_address varchar(255),
  ADD COLUMN IF NOT EXISTS jibun_address varchar(255),
  ADD COLUMN IF NOT EXISTS detail_address varchar(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim(email)) FROM (
      SELECT email FROM public.warehouses UNION ALL SELECT email FROM public.customers
    ) p GROUP BY lower(btrim(email)) HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'REGISTRATION_EMAIL_CONFLICT: resolve existing conflicts before applying'; END IF;
  IF EXISTS (
    SELECT auth_user_id FROM (
      SELECT auth_user_id FROM public.warehouses UNION ALL SELECT auth_user_id FROM public.customers
    ) p WHERE auth_user_id IS NOT NULL GROUP BY auth_user_id HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'REGISTRATION_AUTH_LINK_CONFLICT'; END IF;
  IF EXISTS (
    SELECT 1 FROM (
      SELECT email, auth_user_id FROM public.warehouses UNION ALL SELECT email, auth_user_id FROM public.customers
    ) p LEFT JOIN auth.users u ON u.id = p.auth_user_id
    WHERE btrim(coalesce(p.email, '')) = '' OR (p.auth_user_id IS NOT NULL AND
      (u.id IS NULL OR lower(btrim(u.email)) IS DISTINCT FROM lower(btrim(p.email))))
  ) THEN RAISE EXCEPTION 'REGISTRATION_INVALID_EMAIL_OR_AUTH_LINK'; END IF;
END $$;

-- Existing production PII triggers produce ~97+ character ciphertext, while
-- the original contact_phone/phone columns allow only 50. Preserve the two
-- dependent admin views (definition, owner, options, ACLs and comments) while
-- widening ciphertext storage. Never disable encryption or truncate values.
DO $$
DECLARE
  v_views jsonb;
  v_view jsonb;
  v_grant jsonb;
  v_column jsonb;
  v_table text;
  v_column_name text;
  v_crypto_schema text;
BEGIN
  IF to_regprocedure('public.encrypt_pii(text)') IS NULL THEN RETURN; END IF;
  SELECT n.nspname INTO STRICT v_crypto_schema FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pgcrypto';
  -- Nested calls inherit the atomic writer's empty search_path. Pin the legacy
  -- crypto helpers to the actual extension schema so they still resolve pgp_*.
  EXECUTE format('ALTER FUNCTION public.encrypt_pii(text) SET search_path TO pg_catalog, %I', v_crypto_schema);
  IF to_regprocedure('public.decrypt_pii(text)') IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.decrypt_pii(text) SET search_path TO pg_catalog, %I', v_crypto_schema);
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', v.relname, 'schema', n.nspname, 'definition', pg_get_viewdef(v.oid, false),
    'owner', pg_get_userbyid(v.relowner), 'options', coalesce(array_to_string(v.reloptions, ', '), ''),
    'comment', obj_description(v.oid, 'pg_class'),
    'grants', (SELECT coalesce(jsonb_agg(jsonb_build_object('role', CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,
      'privilege', x.privilege_type, 'grantable', x.is_grantable)), '[]'::jsonb)
      FROM aclexplode(coalesce(v.relacl, acldefault('r', v.relowner))) x WHERE x.grantee <> v.relowner),
    'columns', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', a.attname, 'comment', col_description(v.oid, a.attnum))), '[]'::jsonb)
      FROM pg_catalog.pg_attribute a WHERE a.attrelid = v.oid AND a.attnum > 0 AND NOT a.attisdropped),
    'column_grants', (SELECT coalesce(jsonb_agg(jsonb_build_object('column', a.attname,
      'role', CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,
      'privilege', x.privilege_type, 'grantable', x.is_grantable)), '[]'::jsonb)
      FROM pg_catalog.pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl) x
      WHERE a.attrelid = v.oid AND a.attnum > 0 AND NOT a.attisdropped AND x.grantee <> v.relowner)
  )), '[]'::jsonb) INTO v_views FROM pg_catalog.pg_class v JOIN pg_catalog.pg_namespace n ON n.oid = v.relnamespace
  WHERE v.oid IN (SELECT r.ev_class FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_rewrite r ON r.oid = d.objid
    JOIN pg_catalog.pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE d.refobjid IN ('public.warehouses'::regclass, 'public.customers'::regclass)
    AND a.attname IN ('phone','contact_phone','contact_person','representative')) AND v.relkind = 'v';
  FOR v_view IN SELECT value FROM jsonb_array_elements(v_views) LOOP
    IF v_view->>'schema' <> 'public' OR v_view->>'name' NOT IN ('vw_admin_warehouses','vw_admin_customers') THEN
      RAISE EXCEPTION 'REGISTRATION_UNEXPECTED_PII_DEPENDENT_VIEW';
    END IF;
    EXECUTE format('DROP VIEW public.%I', v_view->>'name'); -- no CASCADE
  END LOOP;
  FOREACH v_table IN ARRAY ARRAY['warehouses','customers'] LOOP
    FOREACH v_column_name IN ARRAY ARRAY['phone','contact_phone','contact_person','representative'] LOOP
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE text', v_table, v_column_name);
    END LOOP;
  END LOOP;
  FOR v_view IN SELECT value FROM jsonb_array_elements(v_views) LOOP
    EXECUTE format('CREATE VIEW public.%I %s AS %s', v_view->>'name',
      CASE WHEN v_view->>'options' = '' THEN '' ELSE 'WITH (' || (v_view->>'options') || ')' END, v_view->>'definition');
    EXECUTE format('ALTER VIEW public.%I OWNER TO %I', v_view->>'name', v_view->>'owner');
    -- Remove any default grants on the newly created view before replaying its
    -- exact former ACL; no recipient receives additional access.
    FOR v_grant IN SELECT jsonb_build_object('role', CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END)
      FROM pg_catalog.pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
      WHERE c.oid = format('public.%I', v_view->>'name')::regclass AND x.grantee <> c.relowner LOOP
      EXECUTE format('REVOKE ALL ON public.%I FROM %s', v_view->>'name',
        CASE WHEN v_grant->>'role' = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(v_grant->>'role') END);
    END LOOP;
    FOR v_grant IN SELECT value FROM jsonb_array_elements(v_view->'grants') LOOP
      EXECUTE format('GRANT %s ON public.%I TO %s %s', v_grant->>'privilege', v_view->>'name',
        CASE WHEN v_grant->>'role' = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(v_grant->>'role') END,
        CASE WHEN (v_grant->>'grantable')::boolean THEN 'WITH GRANT OPTION' ELSE '' END);
    END LOOP;
    FOR v_grant IN SELECT value FROM jsonb_array_elements(v_view->'column_grants') LOOP
      EXECUTE format('GRANT %s (%I) ON public.%I TO %s %s', v_grant->>'privilege', v_grant->>'column', v_view->>'name',
        CASE WHEN v_grant->>'role' = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(v_grant->>'role') END,
        CASE WHEN (v_grant->>'grantable')::boolean THEN 'WITH GRANT OPTION' ELSE '' END);
    END LOOP;
    EXECUTE format('COMMENT ON VIEW public.%I IS %L', v_view->>'name', v_view->>'comment');
    FOR v_column IN SELECT value FROM jsonb_array_elements(v_view->'columns') LOOP
      EXECUTE format('COMMENT ON COLUMN public.%I.%I IS %L', v_view->>'name', v_column->>'name', v_column->>'comment');
    END LOOP;
  END LOOP;
END $$;

UPDATE public.warehouses SET email = lower(btrim(email)) WHERE email IS DISTINCT FROM lower(btrim(email));
UPDATE public.customers SET email = lower(btrim(email)) WHERE email IS DISTINCT FROM lower(btrim(email));

-- A single unique index arbitrates cross-table races, including concurrent Auth
-- signups, authenticated recovery, and administrative profile inserts.
CREATE SCHEMA IF NOT EXISTS registration_private;
REVOKE ALL ON SCHEMA registration_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS registration_private.emails (
  email text PRIMARY KEY,
  user_type text NOT NULL CHECK (user_type IN ('warehouse', 'customer')),
  profile_id uuid NOT NULL,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id uuid,
  UNIQUE (user_type, profile_id)
);
ALTER TABLE registration_private.emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON registration_private.emails FROM PUBLIC, anon, authenticated;
INSERT INTO registration_private.emails(email, user_type, profile_id, auth_user_id)
SELECT email, 'warehouse', id, auth_user_id FROM public.warehouses
UNION ALL SELECT email, 'customer', id, auth_user_id FROM public.customers
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION registration_private.guard_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_type text := CASE TG_TABLE_NAME WHEN 'warehouses' THEN 'warehouse' ELSE 'customer' END;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_setting('role', true) IN ('anon', 'authenticated') AND
       NOT (coalesce(auth.uid() = OLD.auth_user_id, false) OR
         coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin') THEN
      RAISE EXCEPTION 'REGISTRATION_NOT_OWNER' USING ERRCODE = '42501';
    END IF;
    DELETE FROM registration_private.emails WHERE email = OLD.email
      AND user_type = v_type AND profile_id = OLD.id;
    RETURN OLD;
  END IF;
  NEW.email := lower(btrim(NEW.email));
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('role', true) IN ('anon', 'authenticated') AND
       NOT (coalesce(auth.uid() = OLD.auth_user_id, false) OR
         coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin') THEN
      RAISE EXCEPTION 'REGISTRATION_NOT_OWNER' USING ERRCODE = '42501';
    END IF;
    IF current_setting('role', true) IN ('anon', 'authenticated') AND
       coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'admin' AND
       (NEW.status IS DISTINCT FROM OLD.status OR NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
      RAISE EXCEPTION 'REGISTRATION_APPROVAL_ADMIN_REQUIRED' USING ERRCODE = '42501';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.user_type IS DISTINCT FROM OLD.user_type
      OR (NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id AND NOT
        (NEW.auth_user_id IS NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.auth_user_id))) THEN
      RAISE EXCEPTION 'REGISTRATION_IDENTITY_IMMUTABLE';
    END IF;
    UPDATE registration_private.emails SET auth_user_id = NEW.auth_user_id
      WHERE email = OLD.email AND user_type = v_type AND profile_id = OLD.id;
    RETURN NEW;
  END IF;
  IF NEW.email IS NULL OR NEW.email = '' THEN RAISE EXCEPTION 'REGISTRATION_EMAIL_REQUIRED'; END IF;
  NEW.user_type := v_type;
  IF NEW.auth_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = NEW.auth_user_id AND lower(btrim(email)) = NEW.email
  ) THEN RAISE EXCEPTION 'REGISTRATION_AUTH_LINK_MISMATCH'; END IF;
  BEGIN
    INSERT INTO registration_private.emails(email, user_type, profile_id, auth_user_id)
      VALUES (NEW.email, v_type, NEW.id, NEW.auth_user_id);
  EXCEPTION WHEN unique_violation THEN
    -- Do not include the conflicting email in the Auth/Postgres error detail.
    RAISE EXCEPTION 'REGISTRATION_EMAIL_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION registration_private.guard_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS registration_identity_guard ON public.warehouses;
CREATE TRIGGER registration_identity_guard BEFORE INSERT OR UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION registration_private.guard_profile();
DROP TRIGGER IF EXISTS registration_identity_guard ON public.customers;
CREATE TRIGGER registration_identity_guard BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION registration_private.guard_profile();
DROP TRIGGER IF EXISTS registration_identity_delete ON public.warehouses;
CREATE TRIGGER registration_identity_delete AFTER DELETE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION registration_private.guard_profile();
DROP TRIGGER IF EXISTS registration_identity_delete ON public.customers;
CREATE TRIGGER registration_identity_delete AFTER DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION registration_private.guard_profile();

CREATE OR REPLACE FUNCTION registration_private.write_profile(
  p_user_id uuid, p_user_type text, p_profile jsonb, p_request_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user auth.users;
  v_email text;
  v_existing registration_private.emails;
  v_fields text[] := ARRAY['company_name','business_number','contact_person','contact_phone',
    'representative','phone','location','city','dong','road_address','jibun_address',
    'detail_address','pallet_count','products'];
  v_table text;
  v_payload jsonb;
  v_columns text;
  v_key text;
BEGIN
  SELECT * INTO STRICT v_user FROM auth.users WHERE id = p_user_id FOR UPDATE;
  IF p_user_type IS NULL OR p_user_type NOT IN ('warehouse', 'customer') OR p_request_id IS NULL
    OR jsonb_typeof(p_profile) IS DISTINCT FROM 'object' OR octet_length(p_profile::text) > 16384
    OR coalesce(v_user.raw_app_meta_data->>'role', '') = 'admin' THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;
  v_email := lower(btrim(v_user.email));
  IF v_email IS NULL OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_EMAIL' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing FROM registration_private.emails
    WHERE email = v_email OR auth_user_id = p_user_id LIMIT 1;
  IF FOUND THEN
    IF v_existing.auth_user_id = p_user_id AND v_existing.user_type = p_user_type
      AND v_existing.request_id = p_request_id THEN
      RETURN jsonb_build_object('code', 'REGISTERED', 'recovered', false);
    END IF;
    RETURN jsonb_build_object('code', 'ALREADY_REGISTERED');
  END IF;
  FOREACH v_key IN ARRAY ARRAY['company_name','business_number','contact_person','contact_phone'] LOOP
    IF jsonb_typeof(p_profile->v_key) IS DISTINCT FROM 'string' OR btrim(p_profile->>v_key) = '' THEN
      RAISE EXCEPTION 'REGISTRATION_REQUIRED_FIELD' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF p_user_type = 'warehouse' THEN
    v_table := 'warehouses';
    v_fields := v_fields || ARRAY['total_area','total_area_unit','warehouse_count','warehouse_area',
      'warehouse_area_unit','available_area','available_area_unit','experience','storage_types',
      'delivery_companies','other_delivery_company','solutions','other_solution'];
  ELSE
    v_table := 'customers';
    v_fields := v_fields || ARRAY['required_area','required_area_unit','monthly_volume','desired_delivery'];
  END IF;
  SELECT coalesce(jsonb_object_agg(key, value), '{}'::jsonb) INTO v_payload
    FROM jsonb_each(p_profile) WHERE key = ANY(v_fields);
  -- Protected fields are always assigned by the server, never by metadata.
  v_payload := v_payload || jsonb_build_object('id', gen_random_uuid(), 'email', v_email,
    'auth_user_id', p_user_id, 'password', 'SUPABASE_AUTH', 'status', 'pending',
    'user_type', p_user_type, 'submitted_at', now());
  SELECT string_agg(quote_ident(key), ', ' ORDER BY key) INTO v_columns FROM jsonb_object_keys(v_payload) AS k(key);
  EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)',
    v_table, v_columns, v_columns, v_table) USING v_payload;
  UPDATE registration_private.emails SET request_id = p_request_id WHERE email = v_email;
  RETURN jsonb_build_object('code', 'REGISTERED', 'recovered', true);
END $$;
REVOKE ALL ON FUNCTION registration_private.write_profile(uuid,text,jsonb,uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION registration_private.on_auth_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  -- Leave unrelated administrator/invitation Auth accounts alone. Old app
  -- clients with user_type but no protocol version fail atomically, not halfway.
  IF NOT (NEW.raw_user_meta_data ? 'registration_version') AND
    coalesce(NEW.raw_user_meta_data->>'user_type', '') NOT IN ('warehouse','customer') THEN RETURN NEW; END IF;
  IF (NEW.raw_user_meta_data->>'registration_version') IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION 'REGISTRATION_CLIENT_UPGRADE_REQUIRED';
  END IF;
  v_result := registration_private.write_profile(NEW.id, NEW.raw_user_meta_data->>'user_type',
    NEW.raw_user_meta_data->'registration_profile', (NEW.raw_user_meta_data->>'registration_request_id')::uuid);
  IF v_result->>'code' <> 'REGISTERED' THEN RAISE EXCEPTION 'REGISTRATION_EMAIL_ALREADY_REGISTERED'; END IF;
  -- Do not retain a second plaintext copy of profile PII in Auth metadata/JWTs.
  UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data - 'registration_profile' WHERE id = NEW.id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION registration_private.on_auth_user_created() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS registration_create_profile ON auth.users;
CREATE TRIGGER registration_create_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION registration_private.on_auth_user_created();

CREATE OR REPLACE FUNCTION public.registration_preflight(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'auth.users'::regclass
    AND tgname = 'registration_create_profile' AND tgenabled IN ('O','A'))
    OR (SELECT count(*) FROM pg_catalog.pg_trigger WHERE tgrelid IN
      ('public.warehouses'::regclass, 'public.customers'::regclass)
      AND tgname = 'registration_identity_guard' AND tgenabled IN ('O','A')) <> 2 THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_READY';
  END IF;
  IF p_email IS NULL OR length(p_email) > 255 OR lower(btrim(p_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_EMAIL' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('version', 1, 'email_registered', EXISTS (
    SELECT 1 FROM registration_private.emails WHERE email = lower(btrim(p_email))));
END $$;
REVOKE ALL ON FUNCTION public.registration_preflight(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_preflight(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_registration(p_user_type text, p_profile jsonb, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user auth.users;
BEGIN
  -- There is intentionally no user-id/email parameter. Identity comes only
  -- from the verified JWT; lock the Auth row to serialize recovery requests.
  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  IF v_user.email_confirmed_at IS NULL THEN
    RETURN jsonb_build_object('code', 'EMAIL_CONFIRMATION_REQUIRED');
  END IF;
  RETURN registration_private.write_profile(v_user.id, p_user_type, p_profile, p_request_id);
END $$;
REVOKE ALL ON FUNCTION public.complete_registration(text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_registration(text,jsonb,uuid) TO authenticated;

-- Only the definer functions/triggers may INSERT profiles. This also prevents
-- stale client builds from creating a second profile after atomic signup.
REVOKE INSERT ON public.warehouses, public.customers FROM PUBLIC, anon, authenticated;
DO $$
DECLARE v_table text; v_columns text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['warehouses','customers'] LOOP
    SELECT string_agg(quote_ident(attname), ', ') INTO v_columns FROM pg_catalog.pg_attribute
      WHERE attrelid = format('public.%I', v_table)::regclass AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE INSERT (%s) ON public.%I FROM PUBLIC, anon, authenticated', v_columns, v_table);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
