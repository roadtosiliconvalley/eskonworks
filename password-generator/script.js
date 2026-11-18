const passwordEl = document.getElementById('password');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const lengthInput = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const strengthBars = document.getElementById('strengthBars');
const strengthLabel = document.getElementById('strengthLabel');
const entropyLabel = document.getElementById('entropyLabel');
const optionInputs = ['upper', 'lower', 'digits', 'symbols'].map((id) => document.getElementById(id));
const excludeSimilar = document.getElementById('excludeSimilar');

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
};
const SIMILAR = /[0O1lI|]/g;

function randomInt(max) {
  if (window.crypto && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffle(chars) {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

function activeSets() {
  let pool = '';
  const required = [];
  optionInputs.forEach((input) => {
    if (!input.checked) return;
    let chars = SETS[input.id];
    if (excludeSimilar.checked) chars = chars.replace(SIMILAR, '');
    if (!chars) return;
    pool += chars;
    required.push(chars);
  });
  return { pool, required };
}

function generate() {
  const length = Number(lengthInput.value);
  lengthValue.textContent = length;
  const { pool, required } = activeSets();

  if (!pool) {
    passwordEl.textContent = 'Select at least one character group';
    strengthLabel.textContent = '—';
    entropyLabel.textContent = '';
    strengthBars.querySelectorAll('span').forEach((bar) => bar.classList.remove('on'));
    return;
  }

  const chars = required.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(pool[randomInt(pool.length)]);
  const result = shuffle(chars).slice(0, length).join('');
  passwordEl.textContent = result;

  const entropy = Math.round(length * Math.log2(pool.length));
  const bits = entropy < 45 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  strengthLabel.textContent = labels[bits - 1];
  strengthLabel.style.color = bits === 1 ? '#fb7185' : bits === 2 ? '#e3b341' : bits === 3 ? '#34d399' : '#60a5fa';
  entropyLabel.textContent = `≈ ${entropy} bits of entropy`;
  strengthBars.className = `strength-bars ${bits === 4 ? 'strong' : bits === 3 ? 'good' : ''}`;
  strengthBars.querySelectorAll('span').forEach((bar, i) => bar.classList.toggle('on', i < bits));
  copyBtn.textContent = 'Copy';
}

generateBtn.addEventListener('click', generate);
lengthInput.addEventListener('input', () => { lengthValue.textContent = lengthInput.value; });
[...optionInputs, excludeSimilar].forEach((input) => input.addEventListener('change', generate));

copyBtn.addEventListener('click', async () => {
  const text = passwordEl.textContent;
  if (!text || text.startsWith('Select')) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const helper = document.createElement('textarea');
    helper.value = text;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
  copyBtn.textContent = 'Copied!';
});

generate();
