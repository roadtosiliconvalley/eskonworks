const SIZE = 4;
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');

let grid = [];
let score = 0;
let best = loadBest();
let won = false;
let over = false;
let newCells = new Set();

function loadBest() {
  try { return Number(localStorage.getItem('eskonworks-2048-best')) || 0; } catch (_) { return 0; }
}
function saveBest() {
  try { localStorage.setItem('eskonworks-2048-best', String(best)); } catch (_) { /* ignore */ }
}

function emptyBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

function spawn() {
  const empty = [];
  grid.forEach((row, r) => row.forEach((value, c) => { if (!value) empty.push([r, c]); }));
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  newCells.add(`${r},${c}`);
}

function collapse(line) {
  const tiles = line.filter(Boolean);
  const result = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      result.push(merged);
      gained += merged;
      i++;
    } else {
      result.push(tiles[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line: result, gained };
}

function canMove() {
  if (grid.flat().includes(0)) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function move(direction) {
  if (over) return;
  const before = grid.map((row) => [...row]);
  const next = emptyBoard();
  let gained = 0;

  for (let i = 0; i < SIZE; i++) {
    let line;
    if (direction === 'left') line = [...before[i]];
    else if (direction === 'right') line = [...before[i]].reverse();
    else if (direction === 'up') line = before.map((row) => row[i]);
    else line = before.map((row) => row[i]).reverse();

    const collapsed = collapse(line);
    gained += collapsed.gained;
    const output = direction === 'right' || direction === 'down' ? collapsed.line.reverse() : collapsed.line;

    for (let j = 0; j < SIZE; j++) {
      if (direction === 'left' || direction === 'right') next[i][j] = output[j];
      else next[j][i] = output[j];
    }
  }

  if (JSON.stringify(next) === JSON.stringify(before)) return;
  grid = next;
  score += gained;
  if (score > best) { best = score; saveBest(); }
  newCells.clear();
  spawn();
  render();

  if (!won && grid.flat().includes(2048)) {
    won = true;
    showOverlay('You reached 2048!', 'Keep going for a higher score.', 'Continue');
  } else if (!canMove()) {
    over = true;
    showOverlay('Game over', `Final score: ${score}`, 'Try again');
  }
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayBtn.textContent = buttonText;
  overlay.hidden = false;
}

function render() {
  boardEl.innerHTML = grid.flat().map((value, i) => {
    const r = Math.floor(i / SIZE), c = i % SIZE;
    const classes = ['tile'];
    if (value) classes.push(`v${value}`);
    if (newCells.has(`${r},${c}`)) classes.push('new');
    return `<div class="${classes.join(' ')}" role="gridcell">${value || ''}</div>`;
  }).join('');
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function newGame() {
  grid = emptyBoard();
  score = 0;
  won = false;
  over = false;
  newCells = new Set();
  overlay.hidden = true;
  spawn();
  spawn();
  render();
}

const KEYS = {
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down'
};
window.addEventListener('keydown', (event) => {
  const direction = KEYS[event.key] || KEYS[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});

let touchStart = null;
boardEl.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
boardEl.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
}, { passive: true });

document.getElementById('newGame').addEventListener('click', newGame);
overlayBtn.addEventListener('click', () => { if (over) newGame(); else overlay.hidden = true; });

newGame();
