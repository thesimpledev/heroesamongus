import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickDifferent, findBySlug, shareUrl } from '../select.mjs';

const heroes = [
  { slug: 'a', name: 'A' },
  { slug: 'b', name: 'B' },
  { slug: 'c', name: 'C' },
];

test('pickDifferent never returns the active person', () => {
  for (const active of heroes) {
    for (let index = 0; index < heroes.length - 1; index++) {
      const picked = pickDifferent(heroes, active.slug, () => index);
      assert.notEqual(picked.slug, active.slug);
    }
  }
});

test('pickDifferent asks for an index within the pool of other people', () => {
  let askedFor = null;
  pickDifferent(heroes, 'b', (size) => { askedFor = size; return 0; });
  assert.equal(askedFor, heroes.length - 1);
});

test('pickDifferent uses the whole list when nobody is active', () => {
  assert.equal(pickDifferent(heroes, null, () => 2), heroes[2]);
  assert.equal(pickDifferent(heroes, undefined, () => 0), heroes[0]);
});

test('pickDifferent returns the only person even when they are active', () => {
  const single = [heroes[0]];
  assert.equal(pickDifferent(single, 'a', () => 0), heroes[0]);
});

test('pickDifferent rejects an empty list', () => {
  assert.throws(() => pickDifferent([], null, () => 0), RangeError);
});

test('findBySlug returns the matching person', () => {
  assert.equal(findBySlug(heroes, 'b'), heroes[1]);
});

test('findBySlug returns undefined for unknown or missing slugs', () => {
  assert.equal(findBySlug(heroes, 'nobody'), undefined);
  assert.equal(findBySlug(heroes, null), undefined);
  assert.equal(findBySlug(heroes, ''), undefined);
});

test('shareUrl sets the person query parameter', () => {
  assert.equal(shareUrl('https://example.com/', 'fred-rogers'), 'https://example.com/?person=fred-rogers');
});

test('shareUrl replaces an existing person parameter', () => {
  assert.equal(shareUrl('https://example.com/?person=old', 'new'), 'https://example.com/?person=new');
});

test('shareUrl encodes the slug', () => {
  assert.equal(shareUrl('https://example.com/', 'a b&c'), 'https://example.com/?person=a+b%26c');
});
