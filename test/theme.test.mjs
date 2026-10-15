import { test } from 'node:test';
import assert from 'node:assert/strict';

const { resolveTheme, nextTheme } = (await import('../theme.js')).default;

test('no stored choice follows the system setting', () => {
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(undefined, true), 'dark');
});

test('a stored choice wins over the system setting', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('an unknown stored value falls back to the system setting', () => {
  assert.equal(resolveTheme('sepia', true), 'dark');
  assert.equal(resolveTheme('', false), 'light');
});

test('nextTheme flips between the two themes', () => {
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'light');
});
