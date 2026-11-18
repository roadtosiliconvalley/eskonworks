const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const CELL = 20;
const SIZE = canvas.width / CELL;

let snake, food, direction, queued, score, best, timer, running, speed;

try { best = Number(localStorage.getItem('eskonworks-snake-best')) || 0; }
catch { best = 0; }
bestEl.textContent = best;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  queued = [];
  score = 0;
  speed = 140;
  scoreEl.textContent = 0;
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
  } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function setDirection(x, y) {
  const last = queued.length ? queued[queued.length - 1] : direction;
  if (last.x === -x && last.y === -y) return;
  if (last.x === x && last.y === y) return;
  queued.push({ x, y });
}

function step() {
  if (queued.length) direction = queued.shift();

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE;
  const hitSelf = snake.some(part => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) return gameOver();

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem('eskonworks-snake-best', String(best)); } catch { }
    }
    speed = Math.max(70, speed - 3);
    placeFood();
    clearInterval(timer);
    timer = setInterval(step, speed);
  } else {
    snake.pop();
  }
  draw();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = '#0f1f1d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(52,211,153,.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  ctx.fillStyle = '#fb7185';
  roundRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6, 5);

  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? '#6ee7b7' : `rgba(52,211,153,${Math.max(.45, 1 - i * .05)})`;
    roundRect(part.x * CELL + 2, part.y * CELL + 2, CELL - 4, CELL - 4, 5);
  });
}

function start() {
  if (running) return;
  if (!snake || !score && snake.length <= 3) reset();
  running = true;
  overlay.classList.add('hidden');
  startBtn.textContent = 'Pause';
  timer = setInterval(step, speed);
}

function pause() {
  running = false;
  clearInterval(timer);
  startBtn.textContent = 'Resume';
  overlayTitle.textContent = 'Paused';
  overlayText.textContent = 'Press Resume to continue';
  overlay.classList.remove('hidden');
}

function gameOver() {
  running = false;
  clearInterval(timer);
  startBtn.textContent = 'Start';
  overlayTitle.textContent = 'Game over';
  overlayText.textContent = `Score ${score} — press Start to play again`;
  overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', () => running ? pause() : start());
restartBtn.addEventListener('click', () => {
  clearInterval(timer);
  running = false;
  startBtn.textContent = 'Start';
  reset();
  overlayTitle.textContent = 'Ready?';
  overlayText.textContent = 'Press Start to play';
  overlay.classList.remove('hidden');
});

document.addEventListener('keydown', event => {
  const keys = {
    ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
    w: [0,-1], s: [0,1], a: [-1,0], d: [1,0]
  };
  const move = keys[event.key] || keys[event.key.toLowerCase()];
  if (!move) return;
  event.preventDefault();
  setDirection(move[0], move[1]);
  if (!running) start();
});

document.querySelectorAll('.dpad button').forEach(button => {
  button.addEventListener('click', () => {
    const moves = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
    const move = moves[button.dataset.dir];
    setDirection(move[0], move[1]);
    if (!running) start();
  });
});

reset();
