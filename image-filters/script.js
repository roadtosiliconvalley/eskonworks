const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const slidersEl = document.getElementById('sliders');
const statusEl = document.getElementById('status');

const DEFAULTS = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hue: 0 };
const CONFIG = {
  brightness: { min: 0, max: 200, unit: '%' }, contrast: { min: 0, max: 200, unit: '%' },
  saturation: { min: 0, max: 200, unit: '%' }, grayscale: { min: 0, max: 100, unit: '%' },
  sepia: { min: 0, max: 100, unit: '%' }, blur: { min: 0, max: 12, unit: 'px' },
  hue: { min: -180, max: 180, unit: '°' }
};
let filters = { ...DEFAULTS };
let image = null;

slidersEl.innerHTML = Object.entries(CONFIG).map(([name, config]) => `
  <div class="slider">
    <label for="${name}">${name[0].toUpperCase() + name.slice(1)} <strong id="${name}Value">${DEFAULTS[name]}${config.unit}</strong></label>
    <input type="range" id="${name}" min="${config.min}" max="${config.max}" value="${DEFAULTS[name]}">
  </div>`).join('');

function filterString() {
  return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px) hue-rotate(${filters.hue}deg)`;
}

function drawSample() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1d4ed8');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(1, '#d4a017');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(80 + i * 75, 120 + (i % 3) * 80, 30 + (i % 4) * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.fillText('Your image goes here', 150, 350);
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = filterString();
  if (image) ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  else drawSample();
  ctx.restore();
}

function syncUI() {
  Object.keys(CONFIG).forEach((name) => {
    document.getElementById(name).value = filters[name];
    document.getElementById(`${name}Value`).textContent = `${filters[name]}${CONFIG[name].unit}`;
  });
}

slidersEl.addEventListener('input', (event) => {
  if (event.target.type !== 'range') return;
  filters[event.target.id] = Number(event.target.value);
  syncUI();
  render();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      image = img;
      statusEl.textContent = `Editing ${file.name} (${img.naturalWidth} × ${img.naturalHeight}).`;
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('presets').addEventListener('click', (event) => {
  const button = event.target.closest('[data-preset]');
  if (!button) return;
  const presets = {
    none: {}, vintage: { sepia: 55, contrast: 120, saturation: 80, hue: -8 },
    mono: { grayscale: 100, contrast: 125 }, cool: { hue: 175, saturation: 125 },
    warm: { sepia: 25, hue: -18, saturation: 115 }
  };
  filters = { ...DEFAULTS, ...presets[button.dataset.preset] };
  syncUI();
  render();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  filters = { ...DEFAULTS };
  syncUI();
  render();
});
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'filtered-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

syncUI();
render();
