export function pickDifferent(heroes, activeSlug, randomIndex) {
  if (!heroes.length) throw new RangeError('No people to choose from');
  const others = heroes.filter(hero => hero.slug !== activeSlug);
  const pool = others.length ? others : heroes;
  return pool[randomIndex(pool.length)];
}

export function findBySlug(heroes, slug) {
  if (!slug) return undefined;
  return heroes.find(hero => hero.slug === slug);
}

export function personHref(slug) {
  return `/people/${encodeURIComponent(slug)}`;
}

export function shareUrl(href, slug) {
  return new URL(personHref(slug), href).toString();
}

export function slugFromLocation(pathname, search) {
  const match = /^\/people\/([^/]+)$/.exec(pathname);
  if (match) return decodeURIComponent(match[1]);
  return new URLSearchParams(search).get('person');
}

const LAST_KEY = 'goodpeople:last';

export function readLast(storage) {
  try {
    return storage?.getItem(LAST_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeLast(storage, slug) {
  try {
    storage?.setItem(LAST_KEY, slug);
  } catch {
    // Storage can be blocked or full; forgetting the last person is harmless.
  }
}
