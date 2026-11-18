const DECKS = {
  javascript: {
    name: 'JavaScript basics',
    cards: [
      ['What keyword declares a block-scoped variable?', 'let (and const for a read-only binding).'],
      ['Which operator checks value and type?', 'The strict equality operator ===.'],
      ['What does Array.map() return?', 'A new array with the result of the callback for every item.'],
      ['How do you write an arrow function?', 'const add = (a, b) => a + b;'],
      ['What is the DOM?', 'The Document Object Model — a tree-like API for HTML elements.'],
      ['Which method parses JSON text into a value?', 'JSON.parse(text).']
    ]
  },
  web: {
    name: 'Web terms',
    cards: [
      ['What does HTML stand for?', 'HyperText Markup Language.'],
      ['What does CSS control?', 'Presentation: layout, colors, typography and responsive design.'],
      ['What is localStorage?', 'Browser storage that persists key/value strings until cleared.'],
      ['What does the <head> element contain?', 'Metadata such as title, charset, description and linked resources.'],
      ['What is a media query?', 'A CSS rule that applies styles only when conditions like screen width match.']
    ]
  },
  capitals: {
    name: 'World capitals',
    cards: [
      ['Japan', 'Tokyo'], ['Canada', 'Ottawa'], ['Australia', 'Canberra'],
      ['Brazil', 'Brasília'], ['Egypt', 'Cairo'], ['Norway', 'Oslo']
    ]
  },
  science: {
    name: 'Quick science',
    cards: [
      ['What is H₂O?', 'Water — two hydrogen atoms and one oxygen atom.'],
      ['What force keeps planets in orbit?', 'Gravity.'],
      ['What is the speed of light in vacuum?', 'About 299,792 km/s.'],
      ['Which blood cells fight infection?', 'White blood cells.'],
      ['What gas do plants absorb during photosynthesis?', 'Carbon dioxide (CO₂).']
    ]
  }
};

const deckSelect = document.getElementById('deckSelect');
const card = document.getElementById('flashcard');
const frontText = document.getElementById('frontText');
const backText = document.getElementById('backText');
const position = document.getElementById('position');
const knownCount = document.getElementById('knownCount');
const progressFill = document.getElementById('progressFill');
const knownBtn = document.getElementById('knownBtn');

let deckId = 'javascript';
let order = [];
let index = 0;
let flipped = false;
let known = new Set();

function fillSelect() {
  deckSelect.innerHTML = Object.entries(DECKS)
    .map(([id, deck]) => `<option value="${id}">${deck.name} · ${deck.cards.length} cards</option>`).join('');
  deckSelect.value = deckId;
}

function loadDeck(shuffle = false) {
  const cards = DECKS[deckId].cards;
  order = cards.map((_, i) => i);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  index = 0;
  flipped = false;
  known = new Set();
  render();
}

function render() {
  const item = DECKS[deckId].cards[order[index]];
  frontText.textContent = item[0];
  backText.textContent = item[1];
  card.classList.toggle('flipped', flipped);
  position.textContent = `Card ${index + 1} of ${order.length}`;
  knownCount.textContent = `${known.size} known`;
  progressFill.style.width = `${((index + 1) / order.length) * 100}%`;
  const isKnown = known.has(order[index]);
  knownBtn.classList.toggle('known', isKnown);
  knownBtn.textContent = isKnown ? '✓ Known — click to undo' : '✓ Mark as known';
}

function flip() { flipped = !flipped; card.classList.toggle('flipped', flipped); }
function step(delta) {
  index = (index + delta + order.length) % order.length;
  flipped = false;
  render();
}

deckSelect.addEventListener('change', () => { deckId = deckSelect.value; loadDeck(); });
document.getElementById('shuffleBtn').addEventListener('click', () => loadDeck(true));
document.getElementById('prevBtn').addEventListener('click', () => step(-1));
document.getElementById('nextBtn').addEventListener('click', () => step(1));
document.getElementById('flipBtn').addEventListener('click', flip);
document.getElementById('restartBtn').addEventListener('click', () => loadDeck());
card.addEventListener('click', flip);
card.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); }
});
knownBtn.addEventListener('click', () => {
  if (known.has(order[index])) known.delete(order[index]); else known.add(order[index]);
  render();
});
window.addEventListener('keydown', (event) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
  if (event.key === 'ArrowRight') step(1);
  if (event.key === 'ArrowLeft') step(-1);
  if (event.key === ' ' && event.target !== card) { event.preventDefault(); flip(); }
});

fillSelect();
loadDeck();
