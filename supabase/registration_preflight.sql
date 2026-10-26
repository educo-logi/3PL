-- READ ONLY. Run as database administrator before the registration migration.
BEGIN READ ONLY;
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('warehouses', 'customers')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname,
       t.tgenabled, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND
  ((n.nspname = 'auth' AND c.relname = 'users') OR
   (n.nspname = 'public' AND c.relname IN ('warehouses', 'customers')));

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
AND tablename IN ('warehouses', 'customers');
SELECT table_name, grantee, privilege_type FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name IN ('warehouses', 'customers');

-- Counts only: never export customer emails/passwords to logs.
WITH profiles AS (
  SELECT lower(btrim(w.email)) AS email, (to_jsonb(w)->>'auth_user_id')::uuid AS auth_user_id FROM public.warehouses w
  UNION ALL SELECT lower(btrim(c.email)), (to_jsonb(c)->>'auth_user_id')::uuid FROM public.customers c
)
SELECT
  (SELECT count(*) FROM (SELECT email FROM profiles GROUP BY email HAVING count(*) > 1) x) AS email_conflict_groups,
  (SELECT count(*) FROM (SELECT auth_user_id FROM profiles WHERE auth_user_id IS NOT NULL
    GROUP BY auth_user_id HAVING count(*) > 1) x) AS auth_link_conflict_groups,
  (SELECT count(*) FROM profiles p LEFT JOIN auth.users u ON u.id = p.auth_user_id
    WHERE p.auth_user_id IS NOT NULL AND (u.id IS NULL OR lower(btrim(u.email)) IS DISTINCT FROM p.email)) AS mismatched_auth_links,
  (SELECT count(*) FROM auth.users u WHERE u.email IS NOT NULL AND NOT EXISTS
    (SELECT 1 FROM profiles p WHERE p.auth_user_id = u.id OR p.email = lower(btrim(u.email)))) AS accounts_without_profiles;
ROLLBACK;
