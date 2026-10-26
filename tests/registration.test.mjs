import test from 'node:test';
import assert from 'node:assert/strict';
import { createSignup } from '../src/utils/registrationService.js';
import { normalizeEmail } from '../src/utils/email.js';

const profile = { company_name: '테스트물류', business_number: '000-00-00000', contact_person: '담당자', contact_phone: '01000000000' };
const password = 'Example1!';
const requestId = '00000000-0000-4000-8000-000000000001';
const user = { id: 'verified-user', identities: [{ id: 'email-identity' }] };
function setup(overrides = {}) {
  const calls = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'registration_preflight') return overrides.preflight?.() ?? { data: { version: 1, email_registered: false }, error: null };
      return overrides.complete ?? { data: { code: 'REGISTERED', recovered: false }, error: null };
    },
    auth: {
      signUp: async (args) => {
        calls.push({ name: 'signUp', args });
        if (overrides.throwOnSignup) throw new Error('sensitive upstream details');
        return overrides.signup ?? { data: { user, session: { access_token: 'test' } }, error: null };
      },
      signInWithPassword: async (args) => {
        calls.push({ name: 'signIn', args });
        return overrides.login ?? { data: { user, session: { access_token: 'verified' } }, error: null };
      },
    },
  };
  return { calls, signup: createSignup(() => client, () => requestId) };
}

test('email normalization is shared and handles invalid values', () => {
  assert.equal(normalizeEmail('  Example@MAIL.COM '), 'example@mail.com');
  assert.equal(normalizeEmail(null), '');
});

for (const type of ['warehouse', 'customer']) {
  test(`${type}: server-verified signup normalizes email and strips protected fields`, async () => {
    const { calls, signup } = setup();
    const result = await signup(' Example@MAIL.COM ', password, type, {
      ...profile, status: 'approved', auth_user_id: 'victim', password: 'plaintext', id: 'forged', user_type: 'admin', is_premium: true,
    });
    assert.equal(result.code, 'REGISTERED');
    assert.equal(result.success, true);
    assert.deepEqual(calls.map(c => c.name), ['registration_preflight', 'signUp', 'complete_registration']);
    const args = calls[1].args;
    assert.equal(args.email, 'example@mail.com');
    assert.deepEqual(args.options.data.registration_profile, profile);
    assert.equal(args.options.data.registration_request_id, requestId);
    assert.equal(calls[2].args.p_user_type, type);
    assert.equal(calls[2].args.p_user_id, undefined);
  });
}

for (const value of [{ error: { code: 'PGRST202' } }, { data: { version: 0 } }, { data: null }]) {
  test(`missing/broken backend fails before Auth signup: ${JSON.stringify(value)}`, async () => {
    const { calls, signup } = setup({ preflight: () => value });
    assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'REGISTRATION_UNAVAILABLE');
    assert.deepEqual(calls.map(c => c.name), ['registration_preflight']);
  });
}

test('existing profile is reported as duplicate without creating an Auth account', async () => {
  const { calls, signup } = setup({ preflight: () => ({ data: { version: 1, email_registered: true } }) });
  assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'ALREADY_REGISTERED');
  assert.equal(calls.length, 1);
});

for (const signupResult of [
  { data: null, error: { code: 'user_already_exists' } },
  { data: { user: { id: 'obfuscated', identities: [] }, session: null }, error: null },
]) {
  test('orphan recovery requires password authentication, including obfuscated duplicates', async () => {
    const { calls, signup } = setup({ signup: signupResult, complete: { data: { code: 'REGISTERED', recovered: true } } });
    assert.deepEqual(await signup('a@example.com', password, 'warehouse', profile), { success: true, code: 'REGISTERED', recovered: true });
    assert.deepEqual(calls.map(c => c.name), ['registration_preflight', 'signUp', 'signIn', 'complete_registration']);
  });
}

test('wrong password cannot invoke profile recovery', async () => {
  const { calls, signup } = setup({ signup: { error: { code: 'user_already_exists' } }, login: { error: { code: 'invalid_credentials' } } });
  assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'REGISTRATION_INCOMPLETE');
  assert.equal(calls.some(c => c.name === 'complete_registration'), false);
});

test('unconfirmed email receives explicit instructions without profile recovery', async () => {
  const { calls, signup } = setup({ signup: { data: { user, session: null } }, login: { error: { code: 'email_not_confirmed' } } });
  assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'EMAIL_CONFIRMATION_REQUIRED');
  assert.equal(calls.some(c => c.name === 'complete_registration'), false);
});

test('competing signup with the same email returns duplicate after a server failure', async () => {
  let count = 0;
  const { signup } = setup({ preflight: () => ({ data: { version: 1, email_registered: count++ > 0 } }), signup: { error: { code: 'unexpected_failure' } } });
  assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'ALREADY_REGISTERED');
});

test('failed profile transaction and network failures never report signup success or leak errors', async () => {
  for (const overrides of [
    { signup: { error: { code: 'unexpected_failure', message: 'sensitive DB value' } } },
    { throwOnSignup: true },
    { complete: { error: { message: 'sensitive DB value' } } },
    { complete: { data: null } },
  ]) {
    const { signup } = setup(overrides);
    const result = await signup('a@example.com', password, 'warehouse', profile);
    assert.equal(result.success, false);
    assert.equal(result.code, 'TEMPORARY_ERROR');
    assert.doesNotMatch(result.message, /sensitive/);
  }
});

test('existing profile at authenticated completion is never overwritten', async () => {
  const { signup } = setup({ complete: { data: { code: 'ALREADY_REGISTERED' } } });
  assert.equal((await signup('a@example.com', password, 'warehouse', profile)).code, 'ALREADY_REGISTERED');
});

test('invalid inputs cannot reach the server', async () => {
  const { calls, signup } = setup();
  for (const args of [
    ['invalid', password, 'warehouse', profile],
    ['a@example.com', password, 'admin', profile],
    ['a@example.com', password, '__proto__', profile],
    ['a@example.com', 'weak', 'customer', profile],
    ['a@example.com', password, 'customer', { ...profile, contact_phone: ' ' }],
  ]) assert.equal((await signup(...args)).code, 'INVALID_INPUT');
  assert.equal(calls.length, 0);
});
