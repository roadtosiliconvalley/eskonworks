const BASE = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
];
const CLUES = { easy: 42, medium: 34, hard: 28 };
const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const statusEl = document.getElementById('statusText');

let level = 'easy';
let solution = [];
let puzzle = [];
let values = [];
let selected = null;
let mistakes = 0;
let seconds = 0;
let timer = null;
let won = false;
let hintedCells = new Set();

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildSolution() {
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const bandOrder = shuffled([0, 1, 2]);
  const rowOrder = bandOrder.flatMap((b) => shuffled([0, 1, 2]).map((r) => b * 3 + r));
  const colOrder = shuffled([0, 1, 2]).flatMap((s) => shuffled([0, 1, 2]).map((c) => s * 3 + c));
  return rowOrder.map((r) => colOrder.map((c) => digits[BASE[r][c] - 1]));
}

function newGame() {
  solution = buildSolution();
  puzzle = solution.map((row) => [...row]);
  const clues = CLUES[level];
  let removed = 0;
  while (81 - removed > clues) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] === 0) continue;
    puzzle[r][c] = 0;
    removed++;
    const r2 = 8 - r, c2 = 8 - c;
    if (puzzle[r2][c2] !== 0 && removed < 81 - clues) { puzzle[r2][c2] = 0; removed++; }
  }
  values = puzzle.map((row) => [...row]);
  hintedCells = new Set();
  selected = null;
  mistakes = 0;
  seconds = 0;
  won = false;
  clearInterval(timer);
  timer = setInterval(() => { seconds++; timerEl.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }, 1000);
  timerEl.textContent = '00:00';
  mistakesEl.textContent = '0';
  statusEl.textContent = 'Good luck!';
  render();
}

function render() {
  boardEl.innerHTML = values.map((row, r) => row.map((value, c) => {
    const classes = ['cell'];
    if (puzzle[r][c]) classes.push('given');
    if (selected && selected[0] === r && selected[1] === c) classes.push('selected');
    else if (selected && (r === selected[0] || c === selected[1] || (Math.floor(r / 3) === Math.floor(selected[0] / 3) && Math.floor(c / 3) === Math.floor(selected[1] / 3)))) classes.push('peer');
    if (value && value !== solution[r][c]) classes.push('wrong');
    if (hintedCells.has(`${r},${c}`)) classes.push('hinted');
    return `<button type="button" class="${classes.join(' ')}" data-r="${r}" data-c="${c}" aria-label="Row ${r + 1} column ${c + 1}${value ? ': ' + value : ', empty'}">${value || ''}</button>`;
  }).join('')).join('');
}

function selectCell(r, c) {
  selected = [r, c];
  render();
}

function enter(value) {
  if (!selected || won || puzzle[selected[0]][selected[1]]) return;
  const [r, c] = selected;
  values[r][c] = value;
  render();
}

function checkWin() {
  if (values.every((row, r) => row.every((value, c) => value === solution[r][c]))) {
    won = true;
    clearInterval(timer);
    statusEl.textContent = `Solved in ${timerEl.textContent} with ${mistakes} mistake${mistakes === 1 ? '' : 's'}!`;
  }
}

boardEl.addEventListener('click', (event) => {
  const cell = event.target.closest('[data-r]');
  if (!cell) return;
  selectCell(Number(cell.dataset.r), Number(cell.dataset.c));
});

document.getElementById('numpad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
  `<button type="button" data-value="${n}">${n}</button>`).join('');
document.getElementById('numpad').addEventListener('click', (event) => {
  const button = event.target.closest('[data-value]');
  if (button) enter(Number(button.dataset.value));
});

document.getElementById('eraseBtn').addEventListener('click', () => enter(0));
document.getElementById('hintBtn').addEventListener('click', () => {
  if (!selected || won || puzzle[selected[0]][selected[1]]) return;
  const [r, c] = selected;
  values[r][c] = solution[r][c];
  hintedCells.add(`${r},${c}`);
  render();
  checkWin();
});
document.getElementById('checkBtn').addEventListener('click', () => {
  let wrong = 0;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (values[r][c] && values[r][c] !== solution[r][c]) wrong++;
  mistakes += wrong;
  mistakesEl.textContent = mistakes;
  statusEl.textContent = wrong ? `${wrong} incorrect entr${wrong === 1 ? 'y' : 'ies'} found.` : 'No mistakes so far!';
  checkWin();
});
document.getElementById('newBtn').addEventListener('click', newGame);
document.getElementById('difficulty').addEventListener('click', (event) => {
  const button = event.target.closest('[data-level]');
  if (!button) return;
  level = button.dataset.level;
  document.querySelectorAll('#difficulty button').forEach((b) => b.classList.toggle('active', b === button));
  newGame();
});
window.addEventListener('keydown', (event) => {
  if (!selected || won) return;
  if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
  const [r, c] = selected;
  if (/^[1-9]$/.test(event.key)) enter(Number(event.key));
  else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') enter(0);
  else if (event.key === 'ArrowUp') selectCell(Math.max(0, r - 1), c);
  else if (event.key === 'ArrowDown') selectCell(Math.min(8, r + 1), c);
  else if (event.key === 'ArrowLeft') selectCell(r, Math.max(0, c - 1));
  else if (event.key === 'ArrowRight') selectCell(r, Math.min(8, c + 1));
});

newGame();
