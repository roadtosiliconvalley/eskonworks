const SYMBOLS = ['🚀', '🌙', '⭐', '🪐', '🎨', '🎧', '🍕', '⚡'];
const BEST_KEY = 'eskonworks-memory-best';

const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');

let first = null;
let second = null;
let lock = false;
let moves = 0;
let matched = 0;
let seconds = 0;
let timer = null;
let best = null;

try { best = JSON.parse(localStorage.getItem(BEST_KEY)); } catch { best = null; }

function formatTime(total) {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function paintBest() {
  bestEl.textContent = best ? `${best.moves} moves · ${formatTime(best.seconds)}` : '—';
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    seconds++;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function newGame() {
  stopTimer();
  first = null;
  second = null;
  lock = false;
  moves = 0;
  matched = 0;
  seconds = 0;
  movesEl.textContent = '0';
  timeEl.textContent = '00:00';
  statusEl.textContent = 'Pick a card to start.';

  board.innerHTML = '';
  shuffle([...SYMBOLS, ...SYMBOLS]).forEach((symbol, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.symbol = symbol;
    card.setAttribute('aria-label', `Card ${index + 1}, hidden`);
    card.innerHTML = `<span class="card-inner"><span class="face front">?</span><span class="face back">${symbol}</span></span>`;
    card.addEventListener('click', () => flip(card));
    board.appendChild(card);
  });
  paintBest();
}

function flip(card) {
  if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  startTimer();
  card.classList.add('flipped');
  card.setAttribute('aria-label', `Card revealed: ${card.dataset.symbol}`);

  if (!first) {
    first = card;
    statusEl.textContent = 'Pick a second card.';
    return;
  }

  second = card;
  moves++;
  movesEl.textContent = moves;
  lock = true;

  if (first.dataset.symbol === second.dataset.symbol) {
    first.classList.add('matched');
    second.classList.add('matched');
    first.setAttribute('aria-label', `Matched: ${first.dataset.symbol}`);
    second.setAttribute('aria-label', `Matched: ${second.dataset.symbol}`);
    matched += 2;
    first = null;
    second = null;
    lock = false;
    statusEl.textContent = matched === SYMBOLS.length * 2 ? 'All pairs found!' : 'Match! Keep going.';
    if (matched === SYMBOLS.length * 2) finish();
  } else {
    statusEl.textContent = 'Not a match…';
    setTimeout(() => {
      [first, second].forEach((item) => {
        item?.classList.remove('flipped');
        item?.setAttribute('aria-label', 'Card hidden');
      });
      first = null;
      second = null;
      lock = false;
      statusEl.textContent = 'Pick a card.';
    }, 800);
  }
}

function finish() {
  stopTimer();
  const better = !best || moves < best.moves || (moves === best.moves && seconds < best.seconds);
  if (better) {
    best = { moves, seconds };
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
    paintBest();
    statusEl.textContent = `New best! ${moves} moves in ${formatTime(seconds)}.`;
  } else {
    statusEl.textContent = `Finished in ${moves} moves and ${formatTime(seconds)}.`;
  }
}

document.getElementById('restartBtn').addEventListener('click', newGame);
document.getElementById('shuffleBtn').addEventListener('click', newGame);
newGame();
