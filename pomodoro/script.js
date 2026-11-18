const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'Focus', short: 'Short break', long: 'Long break' };

const ring = document.getElementById('ring');
const timeEl = document.getElementById('time');
const labelEl = document.getElementById('mode-label');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const modeButtons = [...document.querySelectorAll('.mode')];

let mode = 'focus';
let remaining = DURATIONS.focus;
let endTime = 0;
let ticker = null;
let running = false;

let sessions = Number(localStorage.getItem('eskonworks-pomodoro-sessions')) || 0;
let minutes = Number(localStorage.getItem('eskonworks-pomodoro-minutes')) || 0;
let cycle = Number(localStorage.getItem('eskonworks-pomodoro-cycle')) || 0;

function format(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function paint() {
  timeEl.textContent = format(remaining);
  labelEl.textContent = LABELS[mode];
  ring.style.setProperty('--progress', ((DURATIONS[mode] - remaining) / DURATIONS[mode]) * 100);
  document.getElementById('sessions').textContent = sessions;
  document.getElementById('minutes').textContent = minutes;
  document.getElementById('cycle').textContent = `${cycle} / 4`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = 660;
    gain.gain.value = 0.08;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
    oscillator.onended = () => ctx.close();
  } catch (_) {
    // Audio is optional.
  }
}

function stop() {
  running = false;
  clearInterval(ticker);
  ticker = null;
  startBtn.textContent = 'Start';
}

function start() {
  if (running) return;
  running = true;
  endTime = Date.now() + remaining * 1000;
  startBtn.textContent = 'Pause';
  statusEl.textContent = `${LABELS[mode]} in progress…`;
  ticker = setInterval(tick, 250);
}

function pause() {
  remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  stop();
  startBtn.textContent = 'Resume';
  statusEl.textContent = 'Paused.';
  paint();
}

function setMode(next) {
  stop();
  mode = next;
  remaining = DURATIONS[mode];
  startBtn.textContent = 'Start';
  statusEl.textContent = mode === 'focus' ? 'Ready to focus.' : 'Take a breath.';
  modeButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  paint();
}

function complete() {
  stop();
  beep();

  if (mode === 'focus') {
    sessions++;
    minutes += 25;
    cycle++;
    localStorage.setItem('eskonworks-pomodoro-sessions', String(sessions));
    localStorage.setItem('eskonworks-pomodoro-minutes', String(minutes));
    localStorage.setItem('eskonworks-pomodoro-cycle', String(cycle));
    setMode(cycle % 4 === 0 ? 'long' : 'short');
    statusEl.textContent = 'Focus complete — enjoy your break.';
  } else {
    setMode('focus');
    statusEl.textContent = 'Break over — ready for the next round.';
  }
  paint();
}

function tick() {
  remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  paint();
  if (remaining <= 0) complete();
}

startBtn.addEventListener('click', () => running ? pause() : start());
resetBtn.addEventListener('click', () => { setMode(mode); statusEl.textContent = 'Timer reset.'; });
skipBtn.addEventListener('click', () => {
  const order = ['focus', 'short', 'focus', 'long'];
  const index = order.indexOf(mode);
  setMode(order[(index + 1) % order.length]);
  statusEl.textContent = 'Skipped to the next interval.';
});
modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.target.tagName !== 'BUTTON') {
    event.preventDefault();
    running ? pause() : start();
  }
});

paint();
