import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPin, hashPin, checkPin, resetQuestion } from '../../js/logic/pin.js';

test('PIN má přesně 4 číslice', () => {
  assert.ok(isValidPin('0420'));
  for (const bad of ['123', '12345', 'abcd', '12 3', '']) assert.ok(!isValidPin(bad), bad);
});

test('ukládá se otisk, ne čísla, a správný PIN projde', async () => {
  const h = await hashPin('1234');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.ok(!h.includes('1234'));
  assert.ok(await checkPin('1234', h));
  assert.ok(!(await checkPin('4321', h)));
  assert.ok(!(await checkPin('1234', null)), 'bez nastaveného PINu nic neprojde');
});

test('otázka pro zapomenutý PIN je dvojciferné násobení', () => {
  for (const r of [0, 0.5, 0.999]) {
    const q = resetQuestion(() => r);
    assert.ok(q.a >= 23 && q.a <= 92 && q.b >= 13 && q.b <= 92);
    assert.equal(q.answer, q.a * q.b);
  }
});
