const piano = document.getElementById('piano');
const octaveLabel = document.getElementById('octaveLabel');
const volumeInput = document.getElementById('volume');
const lastNoteEl = document.getElementById('lastNote');

const WHITE = [
  { note: 'C', key: 'a', semi: 0 }, { note: 'D', key: 's', semi: 2 },
  { note: 'E', key: 'd', semi: 4 }, { note: 'F', key: 'f', semi: 5 },
  { note: 'G', key: 'g', semi: 7 }, { note: 'A', key: 'h', semi: 9 },
  { note: 'B', key: 'j', semi: 11 }
];
const BLACK = [
  { note: 'C#', key: 'w', semi: 1, after: 0 },
  { note: 'D#', key: 'e', semi: 3, after: 1 },
  { note: 'F#', key: 't', semi: 6, after: 3 },
  { note: 'G#', key: 'y', semi: 8, after: 4 },
  { note: 'A#', key: 'u', semi: 10, after: 5 }
];

let octave = 4;
let audioContext = null;
const activeVoices = new Map();

function context() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function frequency(semi) {
  const midi = 12 * (octave + 1) + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function startNote(note, semi) {
  if (activeVoices.has(note)) return;
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency(semi);
  const level = (Number(volumeInput.value) / 100) * 0.22;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), ctx.currentTime + 0.02);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  activeVoices.set(note, { osc, gain });
  document.querySelectorAll(`[data-note="${note}"]`).forEach((el) => el.classList.add('active'));
  lastNoteEl.textContent = `${note}${octave}`;
}

function stopNote(note) {
  const voice = activeVoices.get(note);
  if (!voice) return;
  const ctx = context();
  if (ctx) {
    voice.gain.gain.cancelScheduledValues(ctx.currentTime);
    voice.gain.gain.setValueAtTime(Math.max(0.0002, voice.gain.gain.value), ctx.currentTime);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    voice.osc.stop(ctx.currentTime + 0.14);
  }
  activeVoices.delete(note);
  document.querySelectorAll(`[data-note="${note}"]`).forEach((el) => el.classList.remove('active'));
}

function render() {
  document.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
  activeVoices.forEach((_, note) => stopNote(note));
  octaveLabel.textContent = octave;
  piano.innerHTML = WHITE.map((item) => `
    <div class="white-key" data-note="${item.note}" data-semi="${item.semi}" data-key="${item.key}" role="button" tabindex="0" aria-label="Play ${item.note}${octave}">
      <span class="note">${item.note}${octave}</span><span class="label">${item.key.toUpperCase()}</span>
    </div>`).join('');
  piano.insertAdjacentHTML('beforeend', BLACK.map((item) => `
    <div class="black-key" data-note="${item.note}" data-semi="${item.semi}" data-key="${item.key}"
         style="left: calc(${((item.after + 1) / 7) * 100}% - 3.6%)" role="button" tabindex="0" aria-label="Play ${item.note}${octave}">
      <span class="label">${item.key.toUpperCase()}</span>
    </div>`).join(''));
}

function keyHandler(event) {
  const key = event.key.toLowerCase();
  const item = [...WHITE, ...BLACK].find((i) => i.key === key);
  if (!item || event.repeat) return;
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
  event.preventDefault();
  startNote(item.note, item.semi);
}

function keyUpHandler(event) {
  const key = event.key.toLowerCase();
  const item = [...WHITE, ...BLACK].find((i) => i.key === key);
  if (item) stopNote(item.note);
}

piano.addEventListener('pointerdown', (event) => {
  const key = event.target.closest('[data-note]');
  if (!key) return;
  event.preventDefault();
  startNote(key.dataset.note, Number(key.dataset.semi));
});
piano.addEventListener('pointerup', () => activeVoices.forEach((_, note) => stopNote(note)));
piano.addEventListener('pointerleave', () => activeVoices.forEach((_, note) => stopNote(note)));
piano.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const key = event.target.closest('[data-note]');
  if (!key) return;
  event.preventDefault();
  startNote(key.dataset.note, Number(key.dataset.semi));
});
piano.addEventListener('keyup', (event) => {
  const key = event.target.closest('[data-note]');
  if (key) stopNote(key.dataset.note);
});

document.getElementById('octaveDown').addEventListener('click', () => { if (octave > 1) { octave--; render(); } });
document.getElementById('octaveUp').addEventListener('click', () => { if (octave < 7) { octave++; render(); } });
window.addEventListener('keydown', keyHandler);
window.addEventListener('keyup', keyUpHandler);
window.addEventListener('blur', () => activeVoices.forEach((_, note) => stopNote(note)));

render();
