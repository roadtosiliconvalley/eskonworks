const holesEl = document.getElementById('holes');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const missesEl = document.getElementById('misses');
const startBtn = document.getElementById('startBtn');
const messageEl = document.getElementById('message');

holesEl.innerHTML = Array.from({ length: 9 }, (_, i) =>
  `<div class="hole" data-index="${i}"><span class="mole">🐹</span></div>`).join('');
const holes = [...holesEl.querySelectorAll('.hole')];

let score = 0;
let misses = 0;
let time = 30;
let playing = false;
let activeHole = -1;
let moleTimer = null;
let gameTimer = null;

function clearMole() {
  holes.forEach((hole) => hole.classList.remove('up', 'bonk'));
  activeHole = -1;
}

function showMole() {
  clearMole();
  if (!playing) return;
  activeHole = Math.floor(Math.random() * holes.length);
  holes[activeHole].classList.add('up');
  const delay = Math.max(380, 900 - score * 22);
  moleTimer = setTimeout(showMole, delay);
}

function endGame() {
  playing = false;
  clearTimeout(moleTimer);
  clearInterval(gameTimer);
  clearMole();
  startBtn.disabled = false;
  startBtn.textContent = 'Play again';
  messageEl.textContent = `Time's up! Final score: ${score} with ${misses} misses.`;
}

function startGame() {
  score = 0;
  misses = 0;
  time = 30;
  playing = true;
  scoreEl.textContent = '0';
  missesEl.textContent = '0';
  timeEl.textContent = time;
  startBtn.disabled = true;
  startBtn.textContent = 'Playing…';
  messageEl.textContent = 'Go!';
  clearMole();
  showMole();
  gameTimer = setInterval(() => {
    time--;
    timeEl.textContent = time;
    if (time <= 0) endGame();
  }, 1000);
}

holesEl.addEventListener('click', (event) => {
  const hole = event.target.closest('.hole');
  if (!hole || !playing) return;
  if (Number(hole.dataset.index) === activeHole) {
    score++;
    scoreEl.textContent = score;
    hole.classList.add('bonk');
    clearTimeout(moleTimer);
    showMole();
  } else {
    misses++;
    missesEl.textContent = misses;
  }
});

startBtn.addEventListener('click', startGame);
