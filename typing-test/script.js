const PASSAGES = {
  practice: 'The quick brown fox jumps over the lazy dog while the sun sets slowly behind the quiet hills.',
  nature: 'A gentle breeze moved through the trees as the river carried fallen leaves toward the distant sea.',
  code: 'Good code is simple, readable and kind to the next person who has to change it on a rainy Tuesday.',
  space: 'Beyond the atmosphere, silence stretches between stars, and every signal travels patiently through the dark.'
};
const passageSelect = document.getElementById('passageSelect');
const passageEl = document.getElementById('passage');
const typingInput = document.getElementById('typingInput');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const timeEl = document.getElementById('time');
const messageEl = document.getElementById('message');

let text = '';
let startedAt = null;
let ticker = null;
let done = false;

passageSelect.innerHTML = Object.keys(PASSAGES).map((key) =>
  `<option value="${key}">${key[0].toUpperCase() + key.slice(1)}</option>`).join('');

function renderPassage(typed) {
  passageEl.innerHTML = [...text].map((char, i) => {
    let cls = 'char';
    if (i < typed.length) cls += typed[i] === char ? ' correct' : ' wrong';
    if (i === typed.length && !done) cls += ' current';
    return `<span class="${cls}">${char === ' ' ? '&nbsp;' : char.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
  }).join('');
}

function stats(typed) {
  if (!startedAt) return;
  const seconds = Math.max(0.1, (Date.now() - startedAt) / 1000);
  const correct = [...typed].filter((char, i) => char === text[i]).length;
  const wpm = Math.round((correct / 5) / (seconds / 60));
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
  wpmEl.textContent = wpm;
  accuracyEl.textContent = `${accuracy}%`;
  timeEl.textContent = `${seconds.toFixed(1)}s`;
}

function finish() {
  done = true;
  clearInterval(ticker);
  typingInput.disabled = true;
  messageEl.textContent = 'Finished! Press Restart to try again or choose another passage.';
}

function onInput() {
  const typed = typingInput.value;
  if (!startedAt && typed.length) {
    startedAt = Date.now();
    ticker = setInterval(() => stats(typingInput.value), 100);
    messageEl.textContent = 'Typing…';
  }
  renderPassage(typed);
  stats(typed);
  if (typed.length >= text.length) finish();
}

function restart() {
  text = PASSAGES[passageSelect.value];
  startedAt = null;
  done = false;
  clearInterval(ticker);
  typingInput.value = '';
  typingInput.disabled = false;
  wpmEl.textContent = '0';
  accuracyEl.textContent = '100%';
  timeEl.textContent = '0.0s';
  messageEl.textContent = 'Waiting for your first character.';
  renderPassage('');
  typingInput.focus();
}

typingInput.addEventListener('input', onInput);
passageSelect.addEventListener('change', restart);
document.getElementById('restartBtn').addEventListener('click', restart);
restart();
