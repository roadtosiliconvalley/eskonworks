const COLORS = ['#16a34a', '#dc2626', '#eab308', '#2563eb'];
const TONES = [329.63, 261.63, 220, 392];
const pads = [...document.querySelectorAll('.pad')];
const roundEl = document.getElementById('round');
const bestEl = document.getElementById('best');
const progressEl = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const strictBox = document.getElementById('strict');
const messageEl = document.getElementById('message');

let sequence = [];
let inputIndex = 0;
let round = 0;
let playing = false;
let accepting = false;
let best = loadBest();
let audioContext = null;

bestEl.textContent = best;
function loadBest() { try { return Number(localStorage.getItem('eskonworks-simon-best')) || 0; } catch (_) { return 0; } }
function saveBest() { try { localStorage.setItem('eskonworks-simon-best', String(best)); } catch (_) { /* ignore */ } }

function tone(index, duration) {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = TONES[index];
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration + 0.02);
  } catch (_) { /* audio optional */ }
}

function flash(index) {
  const pad = pads[index];
  pad.classList.add('lit');
  tone(index, 0.35);
  setTimeout(() => pad.classList.remove('lit'), 320);
}

function playSequence() {
  accepting = false;
  messageEl.textContent = 'Watch closely…';
  let i = 0;
  const step = () => {
    if (i >= sequence.length) {
      accepting = true;
      inputIndex = 0;
      progressEl.textContent = `0/${sequence.length}`;
      messageEl.textContent = 'Your turn!';
      return;
    }
    flash(sequence[i]);
    i++;
    setTimeout(step, 620);
  };
  setTimeout(step, 500);
}

function nextRound() {
  round++;
  roundEl.textContent = round;
  sequence.push(Math.floor(Math.random() * 4));
  playSequence();
}

function fail() {
  playing = false;
  accepting = false;
  startBtn.disabled = false;
  startBtn.textContent = 'Try again';
  messageEl.textContent = strictBox.checked
    ? `Wrong! Strict mode ended the game at round ${round}.`
    : `Not quite — the sequence was ${sequence.length} steps. Try again.`;
  if (round > best) { best = round; bestEl.textContent = best; saveBest(); }
}

pads.forEach((pad, index) => {
  pad.addEventListener('click', () => {
    if (!accepting) return;
    flash(index);
    if (sequence[inputIndex] !== index) { fail(); return; }
    inputIndex++;
    progressEl.textContent = `${inputIndex}/${sequence.length}`;
    if (inputIndex >= sequence.length) {
      accepting = false;
      messageEl.textContent = 'Correct! Next round…';
      if (round > best) { best = round; bestEl.textContent = best; saveBest(); }
      setTimeout(nextRound, 900);
    }
  });
});

startBtn.addEventListener('click', () => {
  sequence = [];
  round = 0;
  inputIndex = 0;
  playing = true;
  roundEl.textContent = '0';
  progressEl.textContent = '0/0';
  startBtn.disabled = true;
  startBtn.textContent = 'Playing…';
  nextRound();
});
