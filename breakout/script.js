const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const messageEl = document.getElementById('message');
const W = canvas.width, H = canvas.height;

const COLORS = ['#fb7185', '#f59e0b', '#facc15', '#34d399', '#38bdf8', '#a78bfa'];
const paddle = { x: W / 2 - 45, y: H - 30, w: 90, h: 10, speed: 6 };
const ball = { x: W / 2, y: H - 45, r: 7, dx: 3, dy: -3.5 };
let bricks = [];
let score = 0, level = 1, lives = 3;
let running = false, paused = false, keys = {};

function buildLevel() {
  bricks = [];
  const rows = Math.min(7, 4 + level);
  const cols = 10;
  const bw = (W - 40) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({ x: 20 + c * bw, y: 46 + r * 26, w: bw - 4, h: 18, alive: true, color: COLORS[r % COLORS.length] });
    }
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r - 2;
  ball.dx = (Math.random() * 2 - 1) * 3.2;
  ball.dy = -3.6 - level * 0.15;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050b17';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(212, 160, 23, .35)';
  ctx.fillRect(0, 24, W, 1);
  bricks.forEach((b) => {
    if (!b.alive) return;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(b.x, b.y, b.w, 3);
  });
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = '#e3b341';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function update() {
  if (keys.ArrowLeft || keys.a) paddle.x -= paddle.speed;
  if (keys.ArrowRight || keys.d) paddle.x += paddle.speed;
  paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

  ball.x += ball.dx;
  ball.y += ball.dy;
  if (ball.x < ball.r || ball.x > W - ball.r) ball.dx *= -1;
  if (ball.y < ball.r + 24) ball.dy *= -1;

  if (ball.dy > 0 && ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h &&
      ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
    ball.dy = -Math.abs(ball.dy);
    ball.dx += ((ball.x - (paddle.x + paddle.w / 2)) / paddle.w) * 2.5;
  }

  bricks.forEach((b) => {
    if (!b.alive) return;
    if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
      b.alive = false;
      ball.dy *= -1;
      score += 10;
      scoreEl.textContent = score;
    }
  });

  if (ball.y > H + ball.r) {
    lives--;
    livesEl.textContent = lives;
    if (lives <= 0) {
      running = false;
      startBtn.disabled = false;
      startBtn.textContent = 'Try again';
      messageEl.textContent = `Game over — final score ${score}.`;
    } else {
      resetBall();
      messageEl.textContent = `${lives} ${lives === 1 ? 'life' : 'lives'} remaining.`;
    }
  }

  if (bricks.every((b) => !b.alive)) {
    level++;
    levelEl.textContent = level;
    score += 100;
    scoreEl.textContent = score;
    buildLevel();
    resetBall();
    messageEl.textContent = `Level ${level}!`;
  }
}

function loop() {
  if (running && !paused) update();
  draw();
  requestAnimationFrame(loop);
}

function start() {
  if (!running) {
    score = 0; level = 1; lives = 3;
    scoreEl.textContent = '0';
    levelEl.textContent = '1';
    livesEl.textContent = '3';
    buildLevel();
    resetBall();
    running = true;
    paused = false;
    startBtn.disabled = true;
    startBtn.textContent = 'Restart later';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
    messageEl.textContent = 'Game on!';
  }
}

window.addEventListener('keydown', (event) => {
  keys[event.key] = true;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
});
window.addEventListener('keyup', (event) => { keys[event.key] = false; });
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = ((event.clientX - rect.left) / rect.width) * W - paddle.w / 2;
});
canvas.addEventListener('touchmove', (event) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = ((event.touches[0].clientX - rect.left) / rect.width) * W - paddle.w / 2;
}, { passive: true });
startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  messageEl.textContent = paused ? 'Paused.' : 'Resumed.';
});

buildLevel();
draw();
loop();
