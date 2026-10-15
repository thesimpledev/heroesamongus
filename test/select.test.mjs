import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickDifferent, findBySlug, shareUrl, personHref, slugFromLocation, readLast, writeLast } from '../select.mjs';

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

test('shareUrl builds the clean person URL on the current origin', () => {
  assert.equal(shareUrl('https://example.com/', 'fred-rogers'), 'https://example.com/people/fred-rogers');
});

test('shareUrl ignores the path and query of the current page', () => {
  assert.equal(shareUrl('https://example.com/?person=old', 'new'), 'https://example.com/people/new');
  assert.equal(shareUrl('https://example.com/people/old', 'new'), 'https://example.com/people/new');
});

test('shareUrl encodes the slug', () => {
  assert.equal(shareUrl('https://example.com/', 'a b&c'), 'https://example.com/people/a%20b%26c');
});

test('personHref builds a root-relative clean link for a slug', () => {
  assert.equal(personHref('fred-rogers'), '/people/fred-rogers');
  assert.equal(personHref('a b&c'), '/people/a%20b%26c');
});

test('slugFromLocation reads the clean path first', () => {
  assert.equal(slugFromLocation('/people/fred-rogers', ''), 'fred-rogers');
  assert.equal(slugFromLocation('/people/fred-rogers', '?person=other'), 'fred-rogers');
});

test('slugFromLocation falls back to the legacy query', () => {
  assert.equal(slugFromLocation('/', '?person=bob-ross'), 'bob-ross');
  assert.equal(slugFromLocation('/index.html', '?person=bob-ross'), 'bob-ross');
});

test('slugFromLocation returns null when there is no person', () => {
  assert.equal(slugFromLocation('/', ''), null);
  assert.equal(slugFromLocation('/people', ''), null);
  assert.equal(slugFromLocation('/people/', ''), null);
  assert.equal(slugFromLocation('/about', ''), null);
});

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    data,
  };
}

test('writeLast then readLast round-trips the slug', () => {
  const storage = fakeStorage();
  writeLast(storage, 'b');
  assert.equal(readLast(storage), 'b');
});

test('readLast returns null when nothing is stored or storage is missing', () => {
  assert.equal(readLast(fakeStorage()), null);
  assert.equal(readLast(null), null);
  assert.equal(readLast(undefined), null);
});

test('storage errors are swallowed', () => {
  const broken = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(readLast(broken), null);
  assert.doesNotThrow(() => writeLast(broken, 'a'));
});

test('a remembered slug is skipped by the next random pick', () => {
  const storage = fakeStorage();
  writeLast(storage, 'b');
  for (let index = 0; index < heroes.length - 1; index++) {
    assert.notEqual(pickDifferent(heroes, readLast(storage), () => index).slug, 'b');
  }
});
