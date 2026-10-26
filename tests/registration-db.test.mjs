import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// PGLITE_MODULE may point to a temporary installation, keeping production
// dependencies untouched. See supabase/REGISTRATION_ROLLOUT.md.
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const { pgcrypto } = await import(process.env.PGLITE_MODULE
  ? new URL('./contrib/pgcrypto.js', process.env.PGLITE_MODULE).href
  : '@electric-sql/pglite/contrib/pgcrypto');
const schema = (await fs.readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8'))
  .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '')
  .replaceAll('uuid_generate_v4()', 'gen_random_uuid()');
const migration = await fs.readFile(new URL('../supabase/migrations/20261026_atomic_registration.sql', import.meta.url), 'utf8');
const baseProfile = { company_name: 'Test company', business_number: '000-00-00000', contact_person: 'Contact', contact_phone: '01000000000' };

async function fixture() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb, raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
      email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub')::uuid
    $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  `);
  await db.exec(schema);
  await db.exec('GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses, public.customers TO anon, authenticated');
  return db;
}
async function insertAuth(db, email, type = 'warehouse', profile = baseProfile, extra = {}) {
  const id = randomUUID(); const requestId = randomUUID();
  const metadata = type ? { user_type: type, registration_version: 1, registration_request_id: requestId, registration_profile: profile, ...extra } : extra;
  await db.query(`INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
    VALUES ($1,$2,now(),$3::jsonb)`, [id, email, JSON.stringify(metadata)]);
  return { id, requestId };
}
async function asRole(db, role, id, fn, appMetadata = {}) {
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, role, app_metadata: appMetadata })]);
  await db.exec(`SET ROLE ${role}`);
  try { return await fn(); } finally { await db.exec('RESET ROLE'); }
}
async function complete(db, id, type = 'warehouse', profile = baseProfile, requestId = randomUUID()) {
  return asRole(db, 'authenticated', id, async () => (await db.query(
    'SELECT public.complete_registration($1,$2::jsonb,$3) AS result', [type, JSON.stringify(profile), requestId],
  )).rows[0].result);
}
const db = await fixture();
await db.query("INSERT INTO public.warehouses(company_name,email,password) VALUES ('Legacy', ' Legacy@EXAMPLE.COM ', 'legacy-hash')");
await db.exec(migration);
after(() => db.close());

test('migration normalizes legacy email and populates the private cross-table registry', async () => {
  assert.equal((await db.query("SELECT email FROM public.warehouses WHERE company_name='Legacy'")).rows[0].email, 'legacy@example.com');
  const result = await asRole(db, 'anon', null, () => db.query("SELECT public.registration_preflight(' LEGACY@example.com ') AS result"));
  assert.deepEqual(result.rows[0].result, { version: 1, email_registered: true });
  await asRole(db, 'anon', null, () => assert.rejects(db.query('SELECT * FROM registration_private.emails'), /permission denied/));
});

for (const type of ['warehouse', 'customer']) {
  test(`${type}: Auth insert atomically creates exactly one pending profile with protected fields`, async () => {
    const email = `${type}@example.com`;
    const account = await insertAuth(db, ` ${email.toUpperCase()} `, type, {
      ...baseProfile, status: 'approved', password: 'forged', id: randomUUID(), auth_user_id: randomUUID(), is_premium: true,
    });
    const table = type === 'warehouse' ? 'warehouses' : 'customers';
    const rows = (await db.query(`SELECT * FROM public.${table} WHERE auth_user_id=$1`, [account.id])).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, email);
    assert.equal(rows[0].status, 'pending');
    assert.equal(rows[0].password, 'SUPABASE_AUTH');
    assert.equal(rows[0].user_type, type);
    const metadata = (await db.query('SELECT raw_user_meta_data FROM auth.users WHERE id=$1', [account.id])).rows[0].raw_user_meta_data;
    assert.equal(metadata.registration_profile, undefined);
    const result = await complete(db, account.id, type, baseProfile, account.requestId);
    assert.equal(result.code, 'REGISTERED');
    assert.equal(result.recovered, false);
  });
}

test('profile insert failure rolls back Auth and registry, then the same email succeeds', async () => {
  await db.exec(`CREATE FUNCTION public.test_fail_profile() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.company_name = 'fail-profile' THEN RAISE EXCEPTION 'simulated insert failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER zz_test_fail_profile BEFORE INSERT ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.test_fail_profile();`);
  await assert.rejects(insertAuth(db, 'retry@example.com', 'warehouse', { ...baseProfile, company_name: 'fail-profile' }), /simulated insert failure/);
  for (const table of ['auth.users', 'public.warehouses', 'registration_private.emails']) {
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${table} WHERE email='retry@example.com'`)).rows[0].n, 0);
  }
  await insertAuth(db, 'retry@example.com');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM public.warehouses WHERE email='retry@example.com'")).rows[0].n, 1);
});

test('legacy and cross-type duplicate attempts roll back the new Auth account', async () => {
  for (const email of ['LEGACY@example.com', 'warehouse@example.com']) {
    const before = (await db.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n;
    await assert.rejects(insertAuth(db, email, 'customer'), /REGISTRATION_EMAIL_ALREADY_REGISTERED/);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n, before);
  }
});

test('authenticated orphan recovery is serialized and never overwrites a completed profile', async () => {
  const orphan = await insertAuth(db, 'orphan@example.com', null);
  const attempts = await Promise.all([
    complete(db, orphan.id, 'warehouse', baseProfile),
    // PGlite has one connection; SQL uses a row lock plus a unique index for
    // separate production connections. Do not claim multi-session coverage.
    complete(db, orphan.id, 'warehouse', { ...baseProfile, company_name: 'Do not overwrite' }),
  ]);
  assert.deepEqual(attempts.map(r => r.code).sort(), ['ALREADY_REGISTERED', 'REGISTERED']);
  const rows = (await db.query('SELECT company_name FROM public.warehouses WHERE auth_user_id=$1', [orphan.id])).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].company_name, baseProfile.company_name);
  assert.equal((await complete(db, orphan.id, 'customer')).code, 'ALREADY_REGISTERED');
});

test('unconfirmed or anonymous users cannot complete registration', async () => {
  const orphan = await insertAuth(db, 'unconfirmed@example.com', null);
  await db.query('UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1', [orphan.id]);
  assert.equal((await complete(db, orphan.id)).code, 'EMAIL_CONFIRMATION_REQUIRED');
  await asRole(db, 'anon', null, () => assert.rejects(
    db.query('SELECT public.complete_registration($1,$2::jsonb,$3)', ['warehouse', JSON.stringify(baseProfile), randomUUID()]), /permission denied/,
  ));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.warehouses WHERE auth_user_id=$1', [orphan.id])).rows[0].n, 0);
});

test('stale clients cannot insert profiles and another user cannot update or delete them', async () => {
  const owner = await insertAuth(db, 'owner@example.com');
  const attacker = await insertAuth(db, 'attacker@example.com', null);
  await asRole(db, 'authenticated', attacker.id, async () => {
    await assert.rejects(db.query("INSERT INTO public.warehouses(company_name,email,password) VALUES ('Forged','forged@example.com','fake')"), /permission denied/);
    await assert.rejects(db.query("UPDATE public.warehouses SET company_name='stolen' WHERE auth_user_id=$1", [owner.id]), /REGISTRATION_NOT_OWNER/);
    await assert.rejects(db.query('DELETE FROM public.warehouses WHERE auth_user_id=$1', [owner.id]), /REGISTRATION_NOT_OWNER/);
  });
  await asRole(db, 'authenticated', owner.id, async () => {
    await assert.rejects(db.query("UPDATE public.warehouses SET email='changed@example.com' WHERE auth_user_id=$1", [owner.id]), /REGISTRATION_IDENTITY_IMMUTABLE/);
    await assert.rejects(db.query("UPDATE public.warehouses SET status='approved' WHERE auth_user_id=$1", [owner.id]), /REGISTRATION_APPROVAL_ADMIN_REQUIRED/);
  });
  await asRole(db, 'authenticated', owner.id, () => db.query("UPDATE public.warehouses SET status='approved', approved_at=now() WHERE auth_user_id=$1", [owner.id]), { role: 'admin' });
  assert.equal((await db.query('SELECT status FROM public.warehouses WHERE auth_user_id=$1', [owner.id])).rows[0].status, 'approved');
});

test('missing required fields and old-client metadata fail without leaving accounts', async () => {
  await assert.rejects(insertAuth(db, 'invalid@example.com', 'warehouse', { company_name: 'Incomplete' }), /REGISTRATION_REQUIRED_FIELD/);
  await assert.rejects(insertAuth(db, 'old@example.com', null, {}, { user_type: 'warehouse' }), /REGISTRATION_CLIENT_UPGRADE_REQUIRED/);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM auth.users WHERE email IN ('invalid@example.com','old@example.com')")).rows[0].n, 0);
});

test('existing normalization conflicts stop the entire migration without changing data', async () => {
  const conflictDb = await fixture();
  try {
    await conflictDb.exec(`INSERT INTO public.warehouses(company_name,email,password) VALUES ('A',' Conflict@EXAMPLE.COM ','hash');
      INSERT INTO public.customers(company_name,email,password) VALUES ('B','conflict@example.com','hash');`);
    await assert.rejects(conflictDb.exec(migration), /REGISTRATION_EMAIL_CONFLICT/);
    await conflictDb.exec('ROLLBACK');
    assert.equal((await conflictDb.query("SELECT email FROM public.warehouses WHERE company_name='A'")).rows[0].email, ' Conflict@EXAMPLE.COM ');
    assert.equal((await conflictDb.query("SELECT to_regclass('registration_private.emails') AS registry")).rows[0].registry, null);
  } finally { await conflictDb.close(); }
});

test('registration works with the existing PII encryption triggers', async () => {
  const encryptedDb = await fixture();
  try {
    const encryption = await fs.readFile(new URL('../supabase/migrations/20240519_encryption_and_audit.sql', import.meta.url), 'utf8');
    await encryptedDb.exec('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; SET search_path TO public, extensions, pg_catalog');
    await encryptedDb.exec(encryption.slice(0, encryption.indexOf('-- 6.')));
    await encryptedDb.exec(`ALTER TABLE public.warehouses ADD COLUMN auth_user_id uuid;
      ALTER TABLE public.customers ADD COLUMN auth_user_id uuid;`);
    await encryptedDb.exec(encryption.slice(encryption.indexOf('-- 7.'), encryption.indexOf('-- 8.')));
    await encryptedDb.exec(`COMMENT ON VIEW public.vw_admin_warehouses IS 'Preserve view comment';
      COMMENT ON COLUMN public.vw_admin_warehouses.contact_phone IS 'Preserve column comment';
      ALTER VIEW public.vw_admin_warehouses SET (security_barrier=true);
      GRANT SELECT (company_name) ON public.vw_admin_warehouses TO anon;`);
    await encryptedDb.exec(migration);
    const account = await insertAuth(encryptedDb, 'encrypted@example.com');
    const saved = (await encryptedDb.query('SELECT contact_person FROM public.warehouses WHERE auth_user_id=$1', [account.id])).rows[0];
    assert.notEqual(saved.contact_person, baseProfile.contact_person);
    assert.equal((await encryptedDb.query('SELECT public.decrypt_pii($1) AS plain', [saved.contact_person])).rows[0].plain, baseProfile.contact_person);
    assert.equal((await encryptedDb.query("SELECT obj_description('public.vw_admin_warehouses'::regclass) AS comment")).rows[0].comment, 'Preserve view comment');
    assert.equal((await encryptedDb.query("SELECT has_table_privilege('authenticated','public.vw_admin_warehouses','SELECT') AS allowed")).rows[0].allowed, true);
    assert.equal((await encryptedDb.query("SELECT has_table_privilege('anon','public.vw_admin_warehouses','SELECT') AS allowed")).rows[0].allowed, false);
    assert.equal((await encryptedDb.query("SELECT has_column_privilege('anon','public.vw_admin_warehouses','company_name','SELECT') AS allowed")).rows[0].allowed, true);
    assert.equal((await encryptedDb.query("SELECT reloptions FROM pg_class WHERE oid='public.vw_admin_warehouses'::regclass")).rows[0].reloptions[0], 'security_barrier=true');
    const smoke = await fs.readFile(new URL('../supabase/registration_smoke_test.sql', import.meta.url), 'utf8');
    const smokeResults = await encryptedDb.exec(smoke);
    assert.equal(smokeResults.at(-1).rows[0].no_test_accounts_remaining, true);
  } finally { await encryptedDb.close(); }
});
