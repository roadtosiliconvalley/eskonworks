const LEVELS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};
const boardEl = document.getElementById('board');
const mineCountEl = document.getElementById('mineCount');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restartBtn');
const statusEl = document.getElementById('status');
const flagModeBtn = document.getElementById('flagMode');
const difficultyEl = document.getElementById('difficulty');

let level = 'easy';
let grid = [];
let started = false;
let finished = false;
let flagMode = false;
let seconds = 0;
let timer = null;

function newGame() {
  const config = LEVELS[level];
  grid = Array.from({ length: config.rows }, (_, r) =>
    Array.from({ length: config.cols }, (_, c) => ({ r, c, mine: false, adjacent: 0, revealed: false, flagged: false })));
  started = false;
  finished = false;
  seconds = 0;
  clearInterval(timer);
  timer = null;
  timerEl.textContent = '0';
  mineCountEl.textContent = config.mines;
  restartBtn.textContent = '🙂';
  statusEl.className = 'status';
  statusEl.textContent = 'Click any square to begin. First click is always safe.';
  boardEl.className = `board ${level}`;
  boardEl.style.gridTemplateColumns = `repeat(${config.cols}, auto)`;
  render();
}

function neighbors(cell) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = cell.r + dr, c = cell.c + dc;
      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) out.push(grid[r][c]);
    }
  }
  return out;
}

function placeMines(safeCell) {
  const config = LEVELS[level];
  const excluded = new Set([safeCell, ...neighbors(safeCell)].map((c) => `${c.r},${c.c}`));
  const candidates = grid.flat().filter((c) => !excluded.has(`${c.r},${c.c}`));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.slice(0, config.mines).forEach((c) => { c.mine = true; });
  grid.forEach((row) => row.forEach((c) => {
    if (!c.mine) c.adjacent = neighbors(c).filter((n) => n.mine).length;
  }));
}

function startTimer() {
  started = true;
  statusEl.textContent = 'Game in progress — find every safe square.';
  timer = setInterval(() => { seconds++; timerEl.textContent = seconds; }, 1000);
}

function reveal(cell) {
  if (finished || cell.revealed || cell.flagged) return;
  if (!started) { placeMines(cell); startTimer(); }
  if (cell.mine) { lose(cell); return; }
  const queue = [cell];
  while (queue.length) {
    const current = queue.pop();
    if (current.revealed || current.flagged) continue;
    current.revealed = true;
    if (current.adjacent === 0) neighbors(current).forEach((n) => { if (!n.revealed && !n.mine) queue.push(n); });
  }
  checkWin();
  render();
}

function lose(hit) {
  finished = true;
  clearInterval(timer);
  grid.flat().forEach((c) => { if (c.mine) c.revealed = true; });
  hit.hit = true;
  mineCountEl.textContent = '💥';
  restartBtn.textContent = '😵';
  statusEl.className = 'status lose';
  statusEl.textContent = 'Boom! You hit a mine. Press the face to try again.';
  render();
}

function checkWin() {
  const config = LEVELS[level];
  const safe = grid.flat().filter((c) => !c.mine);
  if (!safe.every((c) => c.revealed)) return;
  finished = true;
  clearInterval(timer);
  grid.flat().forEach((c) => { if (c.mine) c.flagged = true; });
  mineCountEl.textContent = '0';
  restartBtn.textContent = '😎';
  statusEl.className = 'status win';
  statusEl.textContent = `Field cleared in ${seconds}s — nicely done!`;
}

function toggleFlag(cell) {
  if (finished || cell.revealed) return;
  if (!started) startTimer();
  cell.flagged = !cell.flagged;
  render();
}

function render() {
  const html = grid.flat().map((cell) => {
    const classes = ['cell'];
    if (cell.revealed) classes.push('revealed');
    if (cell.flagged && !cell.revealed) classes.push('flag');
    if (cell.mine && cell.revealed) classes.push('mine');
    if (cell.flagged && cell.mine && finished) classes.push('mine');
    if (!cell.flagged && cell.revealed && cell.mine) classes.push('mine');
    if (cell.adjacent && cell.revealed && !cell.mine) classes.push(`n${cell.adjacent}`);
    let text = '';
    if (cell.flagged && !(cell.mine && finished)) text = '🚩';
    else if (cell.revealed) text = cell.mine ? '💣' : cell.adjacent || '';
    else if (cell.flagged && !cell.mine && finished) { classes.push('wrong'); text = '❌'; }
    return `<button type="button" class="${classes.join(' ')}" data-r="${cell.r}" data-c="${cell.c}" aria-label="row ${cell.r + 1} column ${cell.c + 1}">${text}</button>`;
  }).join('');
  boardEl.innerHTML = html;
  if (!finished) {
    const flags = grid.flat().filter((c) => c.flagged).length;
    mineCountEl.textContent = LEVELS[level].mines - flags;
  }
}

boardEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-r]');
  if (!button) return;
  const cell = grid[Number(button.dataset.r)][Number(button.dataset.c)];
  if (flagMode) toggleFlag(cell); else reveal(cell);
});
boardEl.addEventListener('contextmenu', (event) => {
  const button = event.target.closest('[data-r]');
  if (!button) return;
  event.preventDefault();
  toggleFlag(grid[Number(button.dataset.r)][Number(button.dataset.c)]);
});
difficultyEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-level]');
  if (!button) return;
  level = button.dataset.level;
  difficultyEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  newGame();
});
flagModeBtn.addEventListener('click', () => {
  flagMode = !flagMode;
  flagModeBtn.classList.toggle('on', flagMode);
  flagModeBtn.textContent = `🚩 Flag mode: ${flagMode ? 'on' : 'off'}`;
});
restartBtn.addEventListener('click', newGame);

newGame();
