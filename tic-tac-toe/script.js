const cells = [...document.querySelectorAll('.cell')];
const statusEl = document.getElementById('status');
const scoreEls = {
  X: document.getElementById('scoreX'),
  O: document.getElementById('scoreO'),
  D: document.getElementById('scoreD')
};
const modeBtn = document.getElementById('modeBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board = Array(9).fill('');
let turn = 'X';
let playing = true;
let vsAI = true;
let scores = { X: 0, O: 0, D: 0 };

function render() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
    cell.classList.toggle('x', board[i] === 'X');
    cell.classList.toggle('o', board[i] === 'O');
    cell.classList.remove('win');
    cell.disabled = Boolean(board[i]) || !playing;
  });
  Object.keys(scores).forEach(key => { scoreEls[key].textContent = scores[key]; });
}

function winnerFor(b) {
  for (const [a, c, d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line: [a, c, d] };
  }
  return null;
}

function finish(result) {
  playing = false;
  if (result) {
    scores[result.player]++;
    statusEl.textContent = `${result.player} wins!`;
  } else {
    scores.D++;
    statusEl.textContent = "It's a draw.";
  }
  render();
  result?.line.forEach(i => cells[i].classList.add('win'));
}

function play(index) {
  if (!playing || board[index]) return;
  board[index] = turn;
  const result = winnerFor(board);
  if (result || board.every(Boolean)) return finish(result);

  turn = turn === 'X' ? 'O' : 'X';
  statusEl.textContent = vsAI && turn === 'O' ? 'AI is thinking…' : `Your turn — ${turn}`;
  render();

  if (vsAI && turn === 'O') {
    setTimeout(aiMove, 250);
  }
}

function aiMove() {
  if (!playing) return;
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = 'O';
    const score = minimax(false);
    board[i] = '';
    if (score > best) { best = score; move = i; }
  }
  if (move >= 0) play(move);
}

function minimax(isMaximizing) {
  const result = winnerFor(board);
  if (result) return result.player === 'O' ? 1 : -1;
  if (board.every(Boolean)) return 0;

  let best = isMaximizing ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = isMaximizing ? 'O' : 'X';
    const score = minimax(!isMaximizing);
    board[i] = '';
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

function reset() {
  board = Array(9).fill('');
  turn = 'X';
  playing = true;
  statusEl.textContent = 'Your turn — X';
  render();
}

cells.forEach(cell => cell.addEventListener('click', () => play(Number(cell.dataset.index))));
resetBtn.addEventListener('click', reset);
clearBtn.addEventListener('click', () => { scores = { X:0, O:0, D:0 }; render(); });
modeBtn.addEventListener('click', () => {
  vsAI = !vsAI;
  modeBtn.textContent = vsAI ? 'Mode: vs AI' : 'Mode: 2 players';
  reset();
});

render();
