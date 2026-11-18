const harmonySelect = document.getElementById('harmony');
const generateBtn = document.getElementById('generateBtn');
const copyCssBtn = document.getElementById('copyCssBtn');
const paletteEl = document.getElementById('palette');
const previewEl = document.getElementById('preview');
const toastEl = document.getElementById('toast');

let colors = [];
const locked = [false, false, false, false, false];

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function generate() {
  const base = Math.floor(Math.random() * 360);
  const sat = 58 + Math.floor(Math.random() * 25);
  const mode = harmonySelect.value;
  const offsets = {
    analogous: [-32, -16, 0, 16, 32],
    complementary: [0, 0, 12, 180, 192],
    triadic: [0, 12, 120, 240, 252],
    monochrome: [0, 0, 0, 0, 0],
    random: [0, 47, 123, 210, 300]
  }[mode];
  const lights = mode === 'monochrome' ? [22, 38, 54, 72, 90] : [26, 40, 55, 70, 86];

  colors = offsets.map((offset, i) => {
    if (locked[i] && colors[i]) return colors[i];
    const hue = mode === 'random' && i > 0 ? Math.floor(Math.random() * 360) : base + offset;
    const s = mode === 'monochrome' ? 45 + i * 8 : sat;
    return hslToHex(hue, s, lights[i]);
  });
  render();
}

function render() {
  paletteEl.innerHTML = colors.map((hex, i) => `
    <article class="swatch" data-index="${i}">
      <div class="color-block" style="background:${hex}"></div>
      <div class="swatch-body">
        <input class="hex-input" value="${hex}" aria-label="Color ${i + 1} hex code" spellcheck="false">
        <div class="swatch-actions">
          <button type="button" class="lock${locked[i] ? ' locked' : ''}" title="Lock this color">${locked[i] ? '🔒 Locked' : '🔓 Lock'}</button>
          <button type="button" class="copy" title="Copy hex code">Copy</button>
        </div>
      </div>
    </article>`).join('');
  colors.forEach((hex, i) => previewEl.style.setProperty(`--color-${i}`, hex));
  previewEl.style.setProperty('--color-4', contrast(colors[0]));
}

function contrast(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? '#0b1224' : '#ffffff';
}

async function copy(text, message) {
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
  toastEl.textContent = message;
}

paletteEl.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const index = Number(button.closest('.swatch').dataset.index);
  if (button.classList.contains('lock')) {
    locked[index] = !locked[index];
    render();
  } else if (button.classList.contains('copy')) {
    copy(colors[index], `${colors[index]} copied to clipboard.`);
  }
});

paletteEl.addEventListener('change', (event) => {
  if (!event.target.classList.contains('hex-input')) return;
  const index = Number(event.target.closest('.swatch').dataset.index);
  let value = event.target.value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(value) && /^[0-9A-F]{6}$/.test(value)) value = `#${value}`;
  if (!/^#[0-9A-F]{6}$/.test(value)) { event.target.value = colors[index]; return; }
  colors[index] = value;
  locked[index] = true;
  render();
});

generateBtn.addEventListener('click', generate);
copyCssBtn.addEventListener('click', () => {
  const css = colors.map((hex, i) => `--color-${i + 1}: ${hex};`).join('\n');
  copy(`:root {\n  ${css}\n}`, 'CSS variables copied to clipboard.');
});

generate();
