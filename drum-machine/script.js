const SOUNDS = [
  { name: 'Kick', icon: '🥁', key: '1' }, { name: 'Snare', icon: '💥', key: '2' },
  { name: 'Clap', icon: '👏', key: '3' }, { name: 'Hat', icon: '✨', key: '4' },
  { name: 'Open hat', icon: '🌊', key: '5' }, { name: 'Tom', icon: '🪘', key: '6' },
  { name: 'Rim', icon: '🔨', key: '7' }, { name: 'Crash', icon: '🎾', key: '8' }
];
const padsEl = document.getElementById('pads');
const stepsEl = document.getElementById('steps');
const volumeInput = document.getElementById('volume');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const clearBtn = document.getElementById('clearBtn');
const messageEl = document.getElementById('message');

let ctx = null;
let noiseBuffer = null;
let recording = false;
let loopTimer = null;
let step = 0;
let pattern = Array.from({ length: 8 }, () => []);

padsEl.innerHTML = SOUNDS.map((sound, i) =>
  `<button type="button" class="pad" data-index="${i}"><span class="icon">${sound.icon}</span><span class="name">${sound.name}</span><span class="key">KEY ${sound.key}</span></button>`).join('');
stepsEl.innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="step" data-step="${i}">${i + 1}</div>`).join('');

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function gainNode(peak, duration) {
  const context = audio();
  const gain = context.createGain();
  const level = (Number(volumeInput.value) / 100) * peak;
  gain.gain.setValueAtTime(Math.max(0.0001, level), context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  gain.connect(ctx.destination);
  return gain;
}

function tone(start, end, duration, type = 'sine') {
  const context = audio();
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(start, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(end, context.currentTime + duration);
  osc.connect(gainNode(0.8, duration));
  osc.start();
  osc.stop(context.currentTime + duration + 0.02);
}

function noise(duration, filterType, frequency) {
  const context = audio();
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  source.connect(filter).connect(gainNode(0.6, duration));
  source.start();
  source.stop(context.currentTime + duration + 0.02);
}

function playSound(index) {
  switch (index) {
    case 0: tone(160, 45, 0.35); break;
    case 1: noise(0.2, 'highpass', 1200); tone(190, 120, 0.12, 'triangle'); break;
    case 2: for (let i = 0; i < 3; i++) setTimeout(() => noise(0.07, 'bandpass', 1400), i * 22); break;
    case 3: noise(0.06, 'highpass', 7000); break;
    case 4: noise(0.32, 'highpass', 6000); break;
    case 5: tone(260, 95, 0.32, 'triangle'); break;
    case 6: tone(1800, 900, 0.04, 'square'); noise(0.04, 'bandpass', 2500); break;
    case 7: noise(1.1, 'highpass', 4500); break;
  }
}

function hit(index) {
  playSound(index);
  const pad = padsEl.querySelector(`[data-index="${index}"]`);
  pad.classList.add('hit');
  setTimeout(() => pad.classList.remove('hit'), 130);
  if (recording && pattern[step] && !pattern[step].includes(index)) {
    pattern[step].push(index);
    renderSteps();
  }
}

function renderSteps() {
  stepsEl.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('filled', pattern[i].length > 0);
    el.textContent = pattern[i].length ? `${i + 1} · ${pattern[i].length}` : String(i + 1);
  });
}

padsEl.addEventListener('click', (event) => {
  const pad = event.target.closest('[data-index]');
  if (pad) hit(Number(pad.dataset.index));
});

window.addEventListener('keydown', (event) => {
  const index = SOUNDS.findIndex((s) => s.key === event.key);
  if (index >= 0 && !event.repeat) { event.preventDefault(); hit(index); }
});

recordBtn.addEventListener('click', () => {
  recording = !recording;
  recordBtn.classList.toggle('active', recording);
  recordBtn.textContent = recording ? '■ Stop recording' : '● Record';
  messageEl.textContent = recording ? `Recording step ${step + 1} — tap pads.` : 'Recording stopped.';
  if (recording) { step = 0; renderSteps(); }
});

playBtn.addEventListener('click', () => {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
    playBtn.textContent = '▶ Play loop';
    messageEl.textContent = 'Loop stopped.';
    return;
  }
  if (!pattern.some((s) => s.length)) { messageEl.textContent = 'Record some pads first.'; return; }
  step = 0;
  const tick = () => {
    stepsEl.querySelectorAll('.step').forEach((el, i) => el.classList.toggle('active', i === step));
    pattern[step].forEach((index, i) => setTimeout(() => hit(index), i * 15));
    step = (step + 1) % 8;
  };
  tick();
  loopTimer = setInterval(tick, 300);
  playBtn.textContent = '■ Stop loop';
  messageEl.textContent = 'Playing your 8-step loop.';
});

clearBtn.addEventListener('click', () => {
  pattern = Array.from({ length: 8 }, () => []);
  step = 0;
  renderSteps();
  messageEl.textContent = 'Pattern cleared.';
});

renderSteps();
