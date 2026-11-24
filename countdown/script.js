const STORAGE_KEY = 'eskonworks-countdowns-v1';
const grid = document.getElementById('countdownGrid');
const emptyNote = document.getElementById('emptyNote');
const nameInput = document.getElementById('eventName');
const dateInput = document.getElementById('eventDate');

let events = load();

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) {
      return data.filter((e) => e && e.name && e.date && !Number.isNaN(new Date(e.date).getTime()));
    }
  } catch (_) { /* ignore */ }
  const year = new Date().getFullYear();
  return [
    { id: 'sample-1', name: 'New Year', date: `${year + 1}-01-01` },
    { id: 'sample-2', name: 'Summer solstice', date: `${year}-06-21` }
  ];
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (_) { /* ignore */ }
}

function render() {
  emptyNote.hidden = events.length > 0;
  grid.innerHTML = events.map((event) => {
    const target = new Date(`${event.date}T00:00:00`).getTime();
    const now = Date.now();
    const diff = target - now;
    const past = diff < 0;
    const abs = Math.abs(diff);
    const days = Math.floor(abs / 86400000);
    const hours = Math.floor(abs / 3600000) % 24;
    const minutes = Math.floor(abs / 60000) % 60;
    const seconds = Math.floor(abs / 1000) % 60;
    const created = event.created || target - 90 * 86400000;
    const total = Math.max(1, target - created);
    const progress = past ? 100 : Math.max(0, Math.min(100, ((now - created) / total) * 100));
    const pretty = new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
    return `<article class="event-card${past ? ' past' : ''}" data-id="${event.id}">
      <button type="button" class="remove" aria-label="Delete ${event.name}" title="Delete">×</button>
      <div><h2>${event.name}</h2><div class="event-date">${pretty}</div></div>
      <div class="units">
        <div class="unit"><strong>${days}</strong><span>${past ? 'days ago' : 'days'}</span></div>
        <div class="unit"><strong>${String(hours).padStart(2, '0')}</strong><span>hours</span></div>
        <div class="unit"><strong>${String(minutes).padStart(2, '0')}</strong><span>minutes</span></div>
        <div class="unit"><strong>${String(seconds).padStart(2, '0')}</strong><span>seconds</span></div>
      </div>
      <div class="progress"><div style="width:${progress}%"></div></div>
      <div class="event-date">${past ? 'This moment has passed' : `${Math.round(progress)}% of the wait complete`}</div>
    </article>`;
  }).join('');
}

function add(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const date = dateInput.value;
  if (!name || !date) return;
  events.push({
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name, date, created: Date.now()
  });
  save();
  nameInput.value = '';
  dateInput.value = '';
  render();
}

document.getElementById('addBtn').addEventListener('click', add);
nameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') add(event); });
dateInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') add(event); });
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  events = events.filter((e) => e.id !== button.dataset.id);
  save();
  render();
});

dateInput.min = new Date().toISOString().slice(0, 10);
render();
setInterval(render, 1000);
