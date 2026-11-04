import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOUNDS, play, setSoundsEnabled } from '../../js/sounds.js';
import { AVATARS, avatarEmoji } from '../../js/avatars.js';

test('všechny zvuky mají platné noty a jsou krátké', () => {
  for (const [name, notes] of Object.entries(SOUNDS)) {
    assert.ok(notes.length > 0, name);
    for (const [freq, start, length] of notes) {
      assert.ok(freq >= 200 && freq <= 2000, `${name}: frekvence ${freq}`);
      assert.ok(start >= 0 && length > 0, name);
      assert.ok(start + length <= 1.5, `${name} je moc dlouhý`);
    }
  }
});

test('vypnuté zvuky nic nepřehrají (ani bez prohlížeče nespadnou)', () => {
  setSoundsEnabled(false);
  assert.doesNotThrow(() => play('tick'));
  setSoundsEnabled(true);
  assert.doesNotThrow(() => play('neexistuje'));
});

test('8 avatarů podle výběru dcery', () => {
  assert.deepEqual(AVATARS.map((a) => a.id), ['guitar', 'fox', 'cat', 'unicorn', 'panda', 'owl', 'frog', 'star']);
  assert.equal(avatarEmoji('fox'), '🦊');
  assert.equal(avatarEmoji(null), '');
});
