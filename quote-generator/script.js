const QUOTES = [
  { category: 'Focus', text: 'Small steps every day add up to big changes over time.', author: 'Unknown' },
  { category: 'Focus', text: 'You do not have to see the whole staircase, just take the first step.', author: 'Martin Luther King Jr.' },
  { category: 'Focus', text: 'Simplify, then accelerate.', author: 'J.A.R.V.I.S. (fictional)' },
  { category: 'Creativity', text: 'Creativity is intelligence having fun.', author: 'Albert Einstein' },
  { category: 'Creativity', text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { category: 'Creativity', text: 'Start with something small and make it wonderfully strange.', author: 'Unknown' },
  { category: 'Calm', text: 'You cannot stop the waves, but you can learn to surf.', author: 'Jon Kabat-Zinn' },
  { category: 'Calm', text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { category: 'Calm', text: 'Breathe in possibility, breathe out pressure.', author: 'Unknown' },
  { category: 'Learning', text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { category: 'Learning', text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { category: 'Learning', text: 'Every expert was once a beginner who kept going.', author: 'Unknown' },
  { category: 'Build', text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { category: 'Build', text: 'Ship something small, then make it better.', author: 'Unknown' },
  { category: 'Build', text: 'The best code is the code you can still read next year.', author: 'Unknown' }
];
const CATEGORIES = ['All', ...new Set(QUOTES.map((q) => q.category))];
const STORAGE_KEY = 'eskonworks-quote-favorites-v1';

const categoriesEl = document.getElementById('categories');
const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('author');
const favBtn = document.getElementById('favBtn');
const favoritesEl = document.getElementById('favorites');
const favCount = document.getElementById('favCount');

let category = 'All';
let current = null;
let favorites = load();

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (_) { return []; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch (_) { /* ignore */ }
}
function key(quote) { return `${quote.category}|${quote.text}`; }

function updateFavButton() {
  const saved = current && favorites.includes(key(current));
  favBtn.classList.toggle('active', saved);
  favBtn.textContent = saved ? '♥ Favorited' : '♡ Favorite';
}

function showNext() {
  const pool = category === 'All' ? QUOTES : QUOTES.filter((q) => q.category === category);
  let next = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && current && key(next) === key(current)) {
    next = pool[(pool.indexOf(next) + 1) % pool.length];
  }
  current = next;
  quoteEl.textContent = current.text;
  authorEl.textContent = `— ${current.author} · ${current.category}`;
  updateFavButton();
}

function renderFavorites() {
  favCount.textContent = favorites.length;
  favoritesEl.innerHTML = favorites.length
    ? favorites.map((stored) => {
        const quote = QUOTES.find((q) => key(q) === stored);
        if (!quote) return '';
        return `<div class="favorite"><div><p>“${quote.text}”</p><small>— ${quote.author}</small></div>
          <button type="button" data-remove="${encodeURIComponent(stored)}">Remove</button></div>`;
      }).join('')
    : '<p class="muted small">No favorites yet — tap the heart on a quote you like.</p>';
}

categoriesEl.innerHTML = CATEGORIES.map((name) =>
  `<button type="button" data-category="${name}" class="${name === 'All' ? 'active' : ''}">${name}</button>`).join('');
categoriesEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  categoriesEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  showNext();
});
document.getElementById('newBtn').addEventListener('click', showNext);
favBtn.addEventListener('click', () => {
  if (!current) return;
  const id = key(current);
  if (favorites.includes(id)) favorites = favorites.filter((f) => f !== id);
  else favorites.push(id);
  save();
  updateFavButton();
  renderFavorites();
});
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!current) return;
  try { await navigator.clipboard.writeText(`“${current.text}” — ${current.author}`); } catch (_) { /* ignore */ }
});
favoritesEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  favorites = favorites.filter((f) => f !== decodeURIComponent(button.dataset.remove));
  save();
  renderFavorites();
  updateFavButton();
});

renderFavorites();
showNext();
