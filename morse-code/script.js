const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-',
  ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', "'": '.----.',
  '"': '.-..-.', ':': '---...', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '@': '.--.-.'
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([char, code]) => [code, char]));
const source = document.getElementById('source');
const result = document.getElementById('result');
const hint = document.getElementById('hint');
let mode = 'encode';
let audioContext = null;
let playing = false;

function translate() {
  const text = source.value.trim();
  if (!text) { result.value = ''; return; }
  if (mode === 'encode') {
    result.value = text.toUpperCase().split(/\s+/).map((word) =>
      [...word].map((char) => MORSE[char] || '').filter(Boolean).join(' ')).filter(Boolean).join(' / ');
  } else {
    result.value = text.split(/\s*\/\s*/).map((word) =>
      word.trim().split(/\s+/).map((code) => REVERSE[code] || '?').join('')).join(' ');
  }
}

function stopAudio() {
  playing = false;
  if (audioContext) {
    try { audioContext.close(); } catch (_) { /* ignore */ }
    audioContext = null;
  }
}

function play() {
  const code = mode === 'decode' ? source.value.trim() : result.value.trim();
  if (!code) return;
  stopAudio();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { hint.textContent = 'Audio playback is not supported in this browser.'; return; }
  audioContext = new AudioCtx();
  playing = true;
  let time = audioContext.currentTime + 0.1;
  const unit = 0.09;
  const tone = (length) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 620;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.005);
    gain.gain.setValueAtTime(0.15, time + length - 0.005);
    gain.gain.linearRampToValueAtTime(0.0001, time + length);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(time);
    osc.stop(time + length + 0.01);
    time += length + unit;
  };
  for (const char of code) {
    if (char === '.') tone(unit);
    else if (char === '-') tone(unit * 3);
    else if (char === ' ') time += unit * 2;
    else if (char === '/') time += unit * 4;
  }
  hint.textContent = 'Playing Morse code…';
}

document.getElementById('mode').addEventListener('click', (event) => {
  const button = event.target.closest('[data-mode]');
  if (!button) return;
  mode = button.dataset.mode;
  document.querySelectorAll('#mode button').forEach((b) => b.classList.toggle('active', b === button));
  document.getElementById('sourceLabel').textContent = mode === 'encode' ? 'Your message' : 'Morse code';
  source.placeholder = mode === 'encode' ? 'Type a message…' : '... --- ...';
  result.value = '';
  source.value = '';
  hint.textContent = mode === 'encode'
    ? 'Letters are separated by a space, words by a slash.'
    : 'Use spaces between letters and / between words.';
});
source.addEventListener('input', translate);
document.getElementById('translateBtn').addEventListener('click', translate);
document.getElementById('playBtn').addEventListener('click', play);
document.getElementById('stopBtn').addEventListener('click', () => { stopAudio(); hint.textContent = 'Playback stopped.'; });
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!result.value) return;
  try { await navigator.clipboard.writeText(result.value); } catch (_) { /* ignore */ }
  hint.textContent = 'Result copied to clipboard.';
});

document.getElementById('chart').innerHTML = Object.entries(MORSE).map(([char, code]) =>
  `<div class="chart-item"><strong>${char === ' ' ? 'space' : char}</strong><span>${code}</span></div>`).join('');

source.value = 'Hello World';
translate();
