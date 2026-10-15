const container = document.getElementById('hero');
const another = document.getElementById('another');
const share = document.getElementById('share');
let heroes = [];
let active = null;

function randomDifferent() {
  const choices = heroes.filter(h => h.slug !== active?.slug);
  const pool = choices.length ? choices : heroes;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return pool[bytes[0] % pool.length];
}

function render(hero, updateUrl = true) {
  active = hero;
  const image = document.createElement('img');
  image.className = 'portrait';
  image.src = hero.image;
  image.alt = `Portrait of ${hero.name}`;
  image.onerror = () => { image.style.display = 'none'; };
  const copy = document.createElement('div');
  copy.className = 'hero-copy';
  const virtue = document.createElement('p');
  virtue.className = 'virtue';
  virtue.textContent = hero.virtue;
  const name = document.createElement('h2');
  name.textContent = hero.name;
  const years = document.createElement('span');
  years.className = 'years';
  years.textContent = hero.years;
  const desc = document.createElement('p');
  desc.className = 'description';
  desc.textContent = hero.description;
  const quote = document.createElement('p');
  quote.className = 'reflection';
  quote.textContent = hero.reflection;
  const credit = document.createElement('p');
  credit.className = 'credits';
  credit.append('Photograph: ', hero.imageCredit.author, ' · ');
  const a = document.createElement('a');
  a.href = hero.imageCredit.source;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = 'image source';
  credit.append(a, ' · ');
  const license = document.createElement('a');
  license.href = hero.imageCredit.licenseUrl;
  license.target = '_blank';
  license.rel = 'noopener noreferrer';
  license.textContent = hero.imageCredit.license;
  credit.append(license);
  copy.append(virtue, name, years, desc, quote, credit);
  container.replaceChildren(image, copy);
  document.title = `${hero.name} — Good People`;
  if (updateUrl) history.replaceState(null, '', `/?person=${encodeURIComponent(hero.slug)}`);
}

(async function init() {
  try {
    const response = await fetch('/data/heroes.json');
    if (!response.ok) throw new Error('Unable to load heroes');
    heroes = await response.json();
    if (!heroes.length) throw new Error('No heroes found');
    const slug = new URLSearchParams(location.search).get('person');
    render(heroes.find(h => h.slug === slug) || randomDifferent(), Boolean(slug));
    another.addEventListener('click', () => render(randomDifferent()));
    share.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.searchParams.set('person', active.slug);
      try {
        await navigator.clipboard.writeText(url.toString());
        share.textContent = 'Link copied!';
        setTimeout(() => share.textContent = 'Copy their link', 1700);
      } catch {
        window.prompt('Copy this link', url.toString());
      }
    });
  } catch (e) {
    container.textContent = 'Unable to load the stories. Please refresh the page.';
    console.error(e);
  }
})();
