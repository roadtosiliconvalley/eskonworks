const CITIES = [
  { id: 'new-york', name: 'New York', tz: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { id: 'sao-paulo', name: 'São Paulo', tz: 'America/Sao_Paulo' },
  { id: 'london', name: 'London', tz: 'Europe/London' },
  { id: 'paris', name: 'Paris', tz: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', tz: 'Europe/Berlin' },
  { id: 'dubai', name: 'Dubai', tz: 'Asia/Dubai' },
  { id: 'mumbai', name: 'Mumbai', tz: 'Asia/Kolkata' },
  { id: 'singapore', name: 'Singapore', tz: 'Asia/Singapore' },
  { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'sydney', name: 'Sydney', tz: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', tz: 'Pacific/Auckland' }
];
const STORAGE_KEY = 'eskonworks-world-clock-v1';
const grid = document.getElementById('clockGrid');
const citySelect = document.getElementById('citySelect');
const addBtn = document.getElementById('addBtn');

let active = load();
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      const valid = saved.filter((id) => CITIES.some((c) => c.id === id));
      if (valid.length) return valid;
    }
  } catch (_) { /* ignore */ }
  return ['new-york', 'london', 'dubai', 'tokyo'];
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(active)); } catch (_) { /* ignore */ }
}

function partsFor(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { hour: get('hour') % 24, minute: get('minute'), second: get('second') };
}

function renderCards() {
  citySelect.innerHTML = CITIES.filter((c) => !active.includes(c.id))
    .map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  addBtn.disabled = !citySelect.options.length;

  grid.innerHTML = active.map((id) => {
    const city = CITIES.find((c) => c.id === id);
    if (!city) return '';
    let zone = '';
    try {
      zone = new Intl.DateTimeFormat('en-US', { timeZone: city.tz, timeZoneName: 'short' })
        .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || '';
    } catch (_) { zone = city.tz; }
    return `<article class="clock-card" data-id="${id}">
      <button type="button" class="remove" title="Remove ${city.name}" aria-label="Remove ${city.name}">×</button>
      <div class="analog">
        <span class="hand hour"></span><span class="hand minute"></span><span class="hand second"></span>
      </div>
      <h2>${city.name}</h2>
      <div class="digital">--:--:--</div>
      <div class="date">${zone}</div>
    </article>`;
  }).join('');
  update();
}

function update() {
  grid.querySelectorAll('.clock-card').forEach((card) => {
    const city = CITIES.find((c) => c.id === card.dataset.id);
    if (!city) return;
    const { hour, minute, second } = partsFor(city.tz);
    const pad = (n) => String(n).padStart(2, '0');
    card.querySelector('.digital').textContent = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
    card.querySelector('.date').textContent = new Date().toLocaleDateString(undefined, {
      timeZone: city.tz, weekday: 'short', month: 'short', day: 'numeric'
    });
    card.querySelector('.hour').style.transform = `rotate(${(hour % 12) * 30 + minute * 0.5}deg)`;
    card.querySelector('.minute').style.transform = `rotate(${minute * 6 + second * 0.1}deg)`;
    card.querySelector('.second').style.transform = `rotate(${second * 6}deg)`;
  });
}

addBtn.addEventListener('click', () => {
  const id = citySelect.value;
  if (!id || active.includes(id)) return;
  active.push(id);
  save();
  renderCards();
});

grid.addEventListener('click', (event) => {
  const button = event.target.closest('.remove');
  if (!button) return;
  active = active.filter((id) => id !== button.closest('.clock-card').dataset.id);
  save();
  renderCards();
});

renderCards();
setInterval(update, 1000);
