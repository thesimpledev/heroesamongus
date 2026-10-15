import { pickDifferent, findBySlug, shareUrl, readLast, writeLast } from './select.mjs';

const container = document.getElementById('hero');
const another = document.getElementById('another');
const share = document.getElementById('share');
const status = document.getElementById('status');
const shareLabel = share.textContent;
let heroes = [];
let active = null;

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomIndex(size) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % size;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function externalLink(href, text) {
  const a = element('a', null, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function portrait(hero) {
  const image = element('img', 'portrait');
  image.src = hero.image;
  image.alt = `Portrait of ${hero.name}`;
  image.width = hero.width;
  image.height = hero.height;
  image.decoding = 'async';
  image.onerror = () => {
    image.remove();
    container.classList.add('no-portrait');
  };
  return image;
}

function credits(hero) {
  const credit = element('p', 'credits');
  credit.append(
    'Photograph: ', hero.imageCredit.author, ' · ',
    externalLink(hero.imageCredit.source, 'image source'), ' · ',
    externalLink(hero.imageCredit.licenseUrl, hero.imageCredit.license),
  );
  return credit;
}

function render(hero, { updateUrl = true, focusName = false } = {}) {
  active = hero;
  const name = element('h2', null, hero.name);
  name.tabIndex = -1;
  const copy = element('div', 'hero-copy');
  copy.append(
    element('p', 'virtue', hero.virtue),
    name,
    element('span', 'years', hero.years),
    element('p', 'description', hero.description),
    element('p', 'reflection', hero.reflection),
    credits(hero),
  );
  container.classList.remove('no-portrait');
  container.replaceChildren(portrait(hero), copy);
  writeLast(storage(), hero.slug);
  document.title = `${hero.name} · Good People`;
  if (updateUrl) history.replaceState(null, '', shareUrl(location.href, hero.slug));
  if (focusName) name.focus();
}

function announce(message) {
  share.textContent = message;
  status.textContent = message;
  setTimeout(() => {
    share.textContent = shareLabel;
    status.textContent = '';
  }, 1700);
}

async function copyLink() {
  const url = shareUrl(location.href, active.slug);
  try {
    await navigator.clipboard.writeText(url);
    announce('Link copied!');
  } catch {
    window.prompt('Copy this link', url);
  }
}

async function init() {
  try {
    const response = await fetch('/data/heroes.json');
    if (!response.ok) throw new Error('Unable to load heroes');
    heroes = await response.json();
    if (!heroes.length) throw new Error('No heroes found');
    const slug = new URLSearchParams(location.search).get('person');
    const first = findBySlug(heroes, slug) || pickDifferent(heroes, readLast(storage()), randomIndex);
    render(first, { updateUrl: Boolean(slug) });
    another.addEventListener('click', () => {
      render(pickDifferent(heroes, active.slug, randomIndex), { focusName: true });
    });
    share.addEventListener('click', copyLink);
  } catch (e) {
    container.textContent = 'Unable to load the stories. Please refresh the page.';
    console.error(e);
  }
}

init();
