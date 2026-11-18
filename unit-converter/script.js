const tabs = document.getElementById('tabs');
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromUnit');
const toSelect = document.getElementById('toUnit');
const swapBtn = document.getElementById('swapBtn');
const resultEl = document.getElementById('result');
const resultUnit = document.getElementById('resultUnit');
const formulaEl = document.getElementById('formula');
const hintEl = document.getElementById('categoryHint');

const UNITS = {
  length: {
    base: 'm', hint: 'metric & imperial',
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 }
  },
  weight: {
    base: 'kg', hint: 'metric & imperial',
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.0283495231, st: 6.35029318, t: 1000 }
  },
  temperature: {
    base: 'C', hint: 'Celsius · Fahrenheit · Kelvin',
    units: { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' }
  },
  area: {
    base: 'm²', hint: 'square units',
    units: { 'm²': 1, 'km²': 1000000, 'cm²': 0.0001, ha: 10000, acre: 4046.8564224, 'ft²': 0.09290304 }
  },
  data: {
    base: 'B', hint: 'binary prefixes (1024)',
    units: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125 }
  }
};

let category = 'length';

function toBase(value, unit) {
  if (category === 'temperature') {
    if (unit === 'C') return value;
    if (unit === 'F') return (value - 32) * 5 / 9;
    return value - 273.15;
  }
  return value * UNITS[category].units[unit];
}

function fromBase(value, unit) {
  if (category === 'temperature') {
    if (unit === 'C') return value;
    if (unit === 'F') return value * 9 / 5 + 32;
    return value + 273.15;
  }
  return value / UNITS[category].units[unit];
}

function label(unit) {
  return category === 'temperature' ? UNITS.temperature.units[unit] : unit;
}

function format(value) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.000001) return value.toExponential(4);
  return Number(value.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function populate() {
  const entries = Object.keys(UNITS[category].units);
  fromSelect.innerHTML = entries.map((u) => `<option value="${u}">${label(u)}</option>`).join('');
  toSelect.innerHTML = entries.map((u) => `<option value="${u}">${label(u)}</option>`).join('');
  if (entries.length > 1) toSelect.selectedIndex = 1;
  hintEl.textContent = UNITS[category].hint;
  convert();
}

function convert() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;
  if (!Number.isFinite(amount)) {
    resultEl.textContent = '—';
    resultUnit.textContent = '';
    formulaEl.textContent = 'Enter a number to convert.';
    return;
  }
  const converted = fromBase(toBase(amount, from), to);
  resultEl.textContent = format(converted);
  resultUnit.textContent = label(to);
  if (from === to) {
    formulaEl.textContent = 'Same unit — no conversion needed.';
  } else {
    formulaEl.textContent = `1 ${label(from)} = ${format(fromBase(toBase(1, from), to))} ${label(to)}`;
  }
}

tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-category]');
  if (!tab) return;
  tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
  category = tab.dataset.category;
  populate();
});

amountInput.addEventListener('input', convert);
fromSelect.addEventListener('change', convert);
toSelect.addEventListener('change', convert);
swapBtn.addEventListener('click', () => {
  const from = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = from;
  convert();
});

populate();
