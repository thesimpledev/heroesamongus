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

export function shareUrl(href, slug) {
  const url = new URL(href);
  url.searchParams.set('person', slug);
  return url.toString();
}
