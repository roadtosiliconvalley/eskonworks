const MOOD_KEY = 'eskonworks-mood-v1';
const GRATITUDE_KEY = 'eskonworks-gratitude-v1';
const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (_) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* storage optional */ }
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// --- Tabs ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== `view-${tab.dataset.tab}`; });
  });
});

// --- Mood check-in ---
const MOOD_LABELS = { 1: 'Very low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
const MOOD_EMOJI = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
let moods = load(MOOD_KEY, []);
if (!Array.isArray(moods)) moods = [];

function renderMood() {
  const today = dateKey(new Date());
  const entry = moods.find((m) => m.date === today);
  document.querySelectorAll('#moodOptions button').forEach((button) => {
    button.classList.toggle('selected', !!entry && Number(button.dataset.mood) === entry.score);
  });
  $('moodNote').textContent = entry
    ? `Today: ${MOOD_EMOJI[entry.score]} ${MOOD_LABELS[entry.score]} — thank you for checking in.`
    : 'No check-in yet today.';

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: dateKey(d), label: d.toLocaleDateString(undefined, { weekday: 'narrow' }) });
  }
  $('moodChart').innerHTML = days.map((day) => {
    const found = moods.find((m) => m.date === day.key);
    const height = found ? 16 + (found.score - 1) * 21 : 5;
    return `<div class="mood-day" title="${day.key}${found ? ': ' + esc(MOOD_LABELS[found.score]) : ''}">
      <div class="mood-bar-wrap"><div class="mood-bar${found ? '' : ' empty'}" style="height:${height}%"></div></div>
      <span>${day.label}</span>
    </div>`;
  }).join('');
}

document.querySelectorAll('#moodOptions button').forEach((button) => {
  button.addEventListener('click', () => {
    const score = Number(button.dataset.mood);
    const today = dateKey(new Date());
    moods = moods.filter((m) => m.date !== today);
    moods.push({ date: today, score });
    if (moods.length > 90) moods = moods.slice(-90);
    save(MOOD_KEY, moods);
    renderMood();
  });
});
renderMood();

// --- Breathing ---
const PHASES = [
  { label: 'Breathe in', cls: 'inhale', secs: 4 },
  { label: 'Hold', cls: 'hold', secs: 4 },
  { label: 'Breathe out', cls: 'exhale', secs: 6 }
];
const CYCLE_SECONDS = PHASES.reduce((sum, p) => sum + p.secs, 0);
const circle = $('breathCircle');
const phaseLabel = $('breathPhase');
let breathTimer = null;
let breathStart = 0;
let currentPhase = '';

function breathTick() {
  const elapsed = (Date.now() - breathStart) / 1000;
  $('breathCycles').textContent = Math.floor(elapsed / CYCLE_SECONDS);
  const within = elapsed % CYCLE_SECONDS;
  let acc = 0;
  let phase = PHASES[0];
  for (const item of PHASES) {
    if (within < acc + item.secs) { phase = item; break; }
    acc += item.secs;
  }
  if (phase.label !== currentPhase) {
    currentPhase = phase.label;
    circle.className = `breath-circle ${phase.cls}`;
    circle.style.transitionDuration = `${phase.secs}s`;
    phaseLabel.textContent = phase.label;
  }
}

$('breathStart').addEventListener('click', () => {
  if (breathTimer) return;
  breathStart = Date.now();
  currentPhase = '';
  $('breathCycles').textContent = '0';
  $('breathStart').disabled = true;
  $('breathStop').disabled = false;
  $('breathHint').textContent = 'Breathe in as it grows, out as it shrinks.';
  breathTick();
  breathTimer = setInterval(breathTick, 100);
});

$('breathStop').addEventListener('click', () => {
  clearInterval(breathTimer);
  breathTimer = null;
  currentPhase = '';
  circle.className = 'breath-circle';
  circle.style.transitionDuration = '4s';
  phaseLabel.textContent = 'Ready';
  $('breathStart').disabled = false;
  $('breathStop').disabled = true;
  $('breathHint').textContent = 'Press start, then breathe in as it grows and out as it shrinks.';
});

// --- Grounding ---
const GROUND_STEPS = [
  { count: 5, sense: 'see', prompt: '5 things you can see' },
  { count: 4, sense: 'feel', prompt: '4 things you can feel' },
  { count: 3, sense: 'hear', prompt: '3 things you can hear' },
  { count: 2, sense: 'smell', prompt: '2 things you can smell' },
  { count: 1, sense: 'taste', prompt: '1 thing you can taste' }
];
let groundIndex = -1;

function renderGround() {
  $('groundProgress').innerHTML = GROUND_STEPS.map((_, i) =>
    `<span class="${i < groundIndex ? 'done' : i === groundIndex ? 'current' : ''}"></span>`).join('');
  if (groundIndex < 0) {
    $('groundPrompt').textContent = 'Press start to begin.';
    $('groundInput').disabled = true;
    $('groundInput').value = '';
    $('groundNext').disabled = true;
    $('groundDone').textContent = '';
    return;
  }
  if (groundIndex >= GROUND_STEPS.length) {
    $('groundPrompt').textContent = '🌿 Nicely done — you are back in the moment.';
    $('groundInput').disabled = true;
    $('groundNext').disabled = true;
    $('groundDone').textContent = 'Take a slow breath and carry on at your own pace.';
    return;
  }
  $('groundPrompt').textContent = GROUND_STEPS[groundIndex].prompt;
  $('groundInput').disabled = false;
  $('groundInput').value = '';
  $('groundInput').placeholder = `List ${GROUND_STEPS[groundIndex].count} thing${GROUND_STEPS[groundIndex].count === 1 ? '' : 's'} you can ${GROUND_STEPS[groundIndex].sense}…`;
  $('groundNext').disabled = false;
  $('groundDone').textContent = '';
}

$('groundStart').addEventListener('click', () => { groundIndex = 0; renderGround(); });
$('groundNext').addEventListener('click', () => { groundIndex++; renderGround(); });
renderGround();

// --- Gratitude journal ---
let entries = load(GRATITUDE_KEY, []);
if (!Array.isArray(entries)) entries = [];

function renderEntries() {
  $('gratitudeCount').textContent = entries.length;
  $('gratitudeList').innerHTML = entries.length
    ? entries.map((entry) => `<article class="entry">
        <p>${esc(entry.text)}</p>
        <footer><span>${esc(entry.date)}</span><button type="button" data-id="${esc(entry.id)}">Delete</button></footer>
      </article>`).join('')
    : '<p class="muted small">Nothing here yet. Add one small good thing above.</p>';
}

$('gratitudeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const text = $('gratitudeInput').value.trim();
  if (!text) return;
  entries.unshift({
    id: `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    text,
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  });
  if (entries.length > 100) entries = entries.slice(0, 100);
  save(GRATITUDE_KEY, entries);
  $('gratitudeInput').value = '';
  renderEntries();
});

$('gratitudeList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  entries = entries.filter((entry) => entry.id !== button.dataset.id);
  save(GRATITUDE_KEY, entries);
  renderEntries();
});
renderEntries();
