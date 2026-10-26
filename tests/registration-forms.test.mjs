import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import React from 'react';
import { transform } from 'esbuild';
import * as sampleData from '../src/data/sampleData.js';
import { normalizeEmail } from '../src/utils/email.js';

function findElement(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const result = findElement(child, type);
    if (result) return result;
  }
  return null;
}

for (const name of ['WarehouseRegister', 'CustomerRegister']) {
  test(`${name}: rapid submits run once; failure preserves fields and permits retry`, async () => {
    const source = (await fs.readFile(new URL(`../src/pages/${name}.jsx`, import.meta.url), 'utf8'))
      .replace(/^import .*;\r?\n/gm, '')
      .replace(`export default ${name};`, `globalThis.Component = ${name};`);
    const { code } = await transform(source, { loader: 'jsx', format: 'iife' });
    const states = []; const refs = [];
    let stateCursor; let refCursor; let resolveSignup;
    const attempts = []; const alerts = [];
    const noop = () => null;
    const context = vm.createContext({
      ...sampleData, React, normalizeEmail,
      Building2: noop, Users: noop, CheckCircle: noop, AddressSearchModal: noop,
      useNavigate: () => noop, trackEvent: noop,
      GA_EVENTS: { REGISTER_WAREHOUSE: 'warehouse', REGISTER_CUSTOMER: 'customer' },
      alert: (message) => alerts.push(message), window: { scrollTo: noop },
      useState(initial) {
        const index = stateCursor++;
        if (!(index in states)) {
          states[index] = index === 0 ? { ...initial,
            companyName: 'Test', businessNumber: '000-00-00000', contactPerson: 'Contact', contactPhone: '01000000000',
            email: ' Test@Example.COM ', password: 'Example1!',
          } : [3, 4, 6].includes(index) ? true : initial;
        }
        return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      },
      useRef(initial) {
        const index = refCursor++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
      signup: (...args) => {
        attempts.push(args);
        return new Promise((resolve) => { resolveSignup = resolve; });
      },
    });
    vm.runInContext(code, context);
    function render() { stateCursor = 0; refCursor = 0; return context.Component(); }
    const form = findElement(render(), 'form');
    assert.ok(form);
    const event = { preventDefault() {} };
    const first = form.props.onSubmit(event);
    const second = form.props.onSubmit(event);
    await second;
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0][0], 'test@example.com');
    const busyForm = findElement(render(), 'form');
    const busyButton = React.Children.toArray(busyForm.props.children)
      .flatMap(child => React.Children.toArray(child.props?.children))
      .find(child => child.type === 'button' && child.props.type === 'submit');
    assert.equal(busyButton.props.disabled, true);
    assert.equal(busyButton.props['aria-busy'], true);
    resolveSignup({ success: false, code: 'TEMPORARY_ERROR', message: 'Please retry' });
    await first;
    assert.deepEqual(alerts, ['Please retry']);
    assert.equal(states[0].email, ' Test@Example.COM ');
    assert.equal(states[0].password, 'Example1!');
    assert.equal(states[2], false);
    const retryForm = findElement(render(), 'form');
    const retry = retryForm.props.onSubmit(event);
    assert.equal(attempts.length, 2);
    resolveSignup({ success: true, code: 'REGISTERED' });
    await retry;
    assert.equal(findElement(render(), 'form'), null);
    assert.equal(states[1], true);
  });
}
