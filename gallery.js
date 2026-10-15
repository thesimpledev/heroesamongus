import { personHref } from './select.mjs';
import { element, portrait } from './dom.mjs';

const grid = document.getElementById('gallery');

function card(hero) {
  const link = element('a', 'card');
  link.href = personHref(hero.slug);
  link.append(
    portrait(hero, { lazy: true, onError: (image) => image.remove() }),
    element('span', 'card-name', hero.name),
    element('span', 'card-virtue', hero.virtue),
  );
  return link;
}

async function init() {
  try {
    const response = await fetch('/data/heroes.json');
    if (!response.ok) throw new Error('Unable to load heroes');
    const heroes = await response.json();
    if (!heroes.length) throw new Error('No heroes found');
    grid.replaceChildren(...heroes.map(card));
  } catch (e) {
    grid.textContent = 'Unable to load the gallery. Please refresh the page.';
    console.error(e);
  }
}

init();
