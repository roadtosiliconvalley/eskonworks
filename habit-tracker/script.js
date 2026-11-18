const STORAGE_KEY = 'eskonworks-habits-v1';
const addForm = document.getElementById('addForm');
const habitName = document.getElementById('habitName');
const grid = document.getElementById('habitGrid');
const emptyNote = document.getElementById('emptyNote');
const weekLabel = document.getElementById('weekLabel');

let habits = [];
let completions = {};
let weekOffset = 0;

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && Array.isArray(data.habits)) {
      habits = data.habits;
      completions = data.completions && typeof data.completions === 'object' ? data.completions : {};
    }
  } catch (_) { /* ignore */ }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, completions })); } catch (_) { /* ignore */ }
}
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function monday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d;
}
function weekDays() {
  const start = monday(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}
function streak(id) {
  const done = new Set(completions[id] || []);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!done.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (done.has(dateKey(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}

function render() {
  const days = weekDays();
  const today = dateKey(new Date());
  const first = days[0], last = days[6];
  weekLabel.textContent = `${first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const head = `<div class="habit-head"><span>Habit</span>${days.map((d) => `<span>${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>`).join('')}<span>Streak</span><span></span></div>`;
  const rows = habits.map((habit) => {
    const done = new Set(completions[habit.id] || []);
    const daysHtml = days.map((d) => {
      const key = dateKey(d);
      return `<button type="button" class="day${done.has(key) ? ' done' : ''}${key === today ? ' today' : ''}"
        data-id="${habit.id}" data-date="${key}" title="${d.toLocaleDateString()}" aria-label="Toggle ${habit.name} on ${d.toLocaleDateString()}">${done.has(key) ? '✓' : '·'}</button>`;
    }).join('');
    return `<div class="habit-row">
      <span class="habit-name" title="${habit.name.replace(/"/g, '&quot;')}">${habit.name}</span>
      ${daysHtml}
      <span class="streak-cell">🔥 ${streak(habit.id)}</span>
      <button type="button" class="delete" data-delete="${habit.id}" title="Delete habit" aria-label="Delete ${habit.name}">×</button>
    </div>`;
  }).join('');

  grid.innerHTML = head + rows;
  emptyNote.hidden = habits.length > 0;

  const doneToday = habits.filter((h) => (completions[h.id] || []).includes(today)).length;
  const best = habits.reduce((max, h) => Math.max(max, streak(h.id)), 0);
  let possible = 0, completed = 0;
  days.forEach((d) => {
    const key = dateKey(d);
    possible += habits.length;
    completed += habits.filter((h) => (completions[h.id] || []).includes(key)).length;
  });
  document.getElementById('habitTotal').textContent = habits.length;
  document.getElementById('todayDone').textContent = doneToday;
  document.getElementById('bestStreak').textContent = best;
  document.getElementById('weekRate').textContent = possible ? `${Math.round((completed / possible) * 100)}%` : '0%';
}

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = habitName.value.trim();
  if (!name) return;
  habits.push({ id: `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name });
  save();
  habitName.value = '';
  render();
});

grid.addEventListener('click', (event) => {
  const day = event.target.closest('.day');
  if (day) {
    const list = completions[day.dataset.id] || (completions[day.dataset.id] = []);
    const index = list.indexOf(day.dataset.date);
    if (index >= 0) list.splice(index, 1); else list.push(day.dataset.date);
    save();
    render();
    return;
  }
  const remove = event.target.closest('[data-delete]');
  if (remove) {
    habits = habits.filter((h) => h.id !== remove.dataset.delete);
    delete completions[remove.dataset.delete];
    save();
    render();
  }
});

document.getElementById('prevWeek').addEventListener('click', () => { weekOffset--; render(); });
document.getElementById('nextWeek').addEventListener('click', () => { if (weekOffset < 0) { weekOffset++; render(); } });
document.getElementById('thisWeek').addEventListener('click', () => { weekOffset = 0; render(); });

load();
render();
