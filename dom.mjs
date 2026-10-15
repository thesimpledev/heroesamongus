export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function externalLink(href, text) {
  const a = element('a', null, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

export function portrait(hero, { lazy = false, onError } = {}) {
  const image = element('img', 'portrait');
  image.src = hero.image;
  image.alt = `Portrait of ${hero.name}`;
  image.width = hero.width;
  image.height = hero.height;
  image.decoding = 'async';
  if (lazy) image.loading = 'lazy';
  if (onError) image.onerror = () => onError(image);
  return image;
}
