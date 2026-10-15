import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../edge/urls.js', import.meta.url), 'utf8');
const handler = vm.runInNewContext(`${code}\nhandler`, {});

function event(uri, query = {}) {
  const querystring = {};
  for (const [key, value] of Object.entries(query)) querystring[key] = { value };
  return { request: { uri, querystring, headers: {}, cookies: {}, method: 'GET' } };
}

function expectRewrite(uri, served, query) {
  const result = handler(event(uri, query));
  assert.equal(result.uri, served, `${uri} should serve ${served}`);
  assert.equal(result.statusCode, undefined);
}

function expectRedirect(uri, location, query) {
  const result = handler(event(uri, query));
  assert.equal(result.statusCode, 301, `${uri} should redirect`);
  assert.equal(result.headers.location.value, location);
}

test('clean person URLs serve the generated page', () => {
  expectRewrite('/people/fred-rogers', '/p/fred-rogers.html');
  expectRewrite('/people/a1-b2', '/p/a1-b2.html');
});

test('clean section URLs serve their files', () => {
  expectRewrite('/people', '/gallery.html');
  expectRewrite('/about', '/about.html');
});

test('legacy query links redirect to the clean person URL', () => {
  expectRedirect('/', '/people/fred-rogers', { person: 'fred-rogers' });
});

test('an invalid slug in the query is left alone', () => {
  expectRewrite('/', '/', { person: 'Not A Slug!' });
  expectRewrite('/', '/', { person: '' });
});

test('legacy file paths redirect to the clean forms', () => {
  expectRedirect('/p/fred-rogers.html', '/people/fred-rogers');
  expectRedirect('/people/fred-rogers.html', '/people/fred-rogers');
  expectRedirect('/about.html', '/about');
  expectRedirect('/gallery.html', '/people');
  expectRedirect('/gallery', '/people');
});

test('trailing slashes are trimmed except at the root', () => {
  expectRedirect('/about/', '/about');
  expectRedirect('/people/fred-rogers/', '/people/fred-rogers');
  expectRewrite('/', '/');
});

test('everything else passes through untouched', () => {
  expectRewrite('/style.css', '/style.css');
  expectRewrite('/data/heroes.json', '/data/heroes.json');
  expectRewrite('/people/Not-Valid', '/people/Not-Valid');
  expectRewrite('/404.html', '/404.html');
});
