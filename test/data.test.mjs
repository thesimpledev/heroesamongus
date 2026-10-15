import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const heroes = JSON.parse(readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));

const textFields = ['slug', 'name', 'years', 'virtue', 'description', 'reflection', 'image'];
const creditFields = ['author', 'license', 'licenseUrl', 'source'];

test('the data file holds a non-empty list', () => {
  assert.ok(Array.isArray(heroes));
  assert.ok(heroes.length > 0);
});

test('every person has every text field filled in', () => {
  for (const hero of heroes) {
    for (const field of textFields) {
      assert.equal(typeof hero[field], 'string', `${hero.slug ?? '?'}: ${field}`);
      assert.ok(hero[field].trim().length > 0, `${hero.slug ?? '?'}: ${field} is empty`);
    }
  }
});

test('slugs are lowercase, hyphenated and unique', () => {
  const seen = new Set();
  for (const hero of heroes) {
    assert.match(hero.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(!seen.has(hero.slug), `duplicate slug ${hero.slug}`);
    seen.add(hero.slug);
  }
});

test('years use one of two formats', () => {
  for (const hero of heroes) {
    assert.match(hero.years, /^(\d{4}–\d{4}|Born \d{4})$/, `${hero.slug}: years "${hero.years}"`);
  }
});

test('reflections are editorial lines, not quotations', () => {
  for (const hero of heroes) {
    assert.doesNotMatch(hero.reflection, /^["“'‘]/, `${hero.slug}: reflection starts with a quote mark`);
  }
});

test('images live under /assets/ with measured dimensions', () => {
  for (const hero of heroes) {
    assert.match(hero.image, /^\/assets\/[a-z0-9-]+\.(jpg|png|webp)$/, `${hero.slug}: image path`);
    assert.ok(Number.isInteger(hero.width) && hero.width > 0, `${hero.slug}: width`);
    assert.ok(Number.isInteger(hero.height) && hero.height > 0, `${hero.slug}: height`);
  }
});

test('every image carries author, licence and source links', () => {
  for (const hero of heroes) {
    assert.equal(typeof hero.imageCredit, 'object', `${hero.slug}: imageCredit`);
    for (const field of creditFields) {
      assert.equal(typeof hero.imageCredit[field], 'string', `${hero.slug}: imageCredit.${field}`);
      assert.ok(hero.imageCredit[field].trim().length > 0, `${hero.slug}: imageCredit.${field} is empty`);
    }
    assert.match(hero.imageCredit.licenseUrl, /^https:\/\//, `${hero.slug}: licenseUrl`);
    assert.match(hero.imageCredit.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${hero.slug}: source`);
  }
});
