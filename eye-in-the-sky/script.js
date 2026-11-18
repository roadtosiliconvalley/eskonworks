const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const contactList = document.getElementById('contactList');
const contactCount = document.getElementById('contactCount');
const telemetry = document.getElementById('telemetry');
const logEl = document.getElementById('log');
const clockEl = document.getElementById('clock');
const lockBtn = document.getElementById('lockBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const TYPE_CODES = ['AIRCRAFT', 'DRONE', 'SATELLITE', 'UNKNOWN', 'VESSEL'];
let contacts = [];
let selectedId = null;
let angle = 0;
let paused = false;
let nextId = 1;

function rand(min, max) { return min + Math.random() * (max - min); }

function makeContact(x, y, type) {
  const id = `EIS-${String(nextId++).padStart(3, '0')}`;
  return {
    id,
    type: type || TYPE_CODES[Math.floor(Math.random() * TYPE_CODES.length)],
    x: x ?? rand(0.12, 0.88),
    y: y ?? rand(0.12, 0.88),
    vx: rand(-0.00013, 0.00013),
    vy: rand(-0.00013, 0.00013),
    alt: Math.round(rand(800, 24000)),
    speed: Math.round(rand(120, 780)),
    signal: Math.round(rand(42, 99)),
    locked: false,
    ping: 0
  };
}

function log(text, kind) {
  const line = document.createElement('div');
  line.className = `log-line ${kind || 'info'}`;
  const time = new Date().toLocaleTimeString([], { hour12: false });
  line.innerHTML = `<time>${time}</time><span>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
  logEl.prepend(line);
  while (logEl.children.length > 30) logEl.lastChild.remove();
}

function seed() {
  contacts = [];
  nextId = 1;
  selectedId = null;
  angle = 0;
  paused = false;
  for (let i = 0; i < 6; i++) contacts.push(makeContact());
  selectedId = contacts[0].id;
  log('Simulation initialized. Six contacts acquired.', 'ok');
  renderAll();
}

function selected() { return contacts.find((c) => c.id === selectedId) || null; }

function renderContacts() {
  contactCount.textContent = contacts.length;
  contactList.innerHTML = contacts.map((c) => `
    <button type="button" class="contact${c.id === selectedId ? ' selected' : ''}${c.locked ? ' locked' : ''}" data-id="${c.id}">
      <span><strong>${c.id}</strong><small>${c.type} · ${c.alt.toLocaleString()} m</small></span>
      <span class="sig">${c.signal}%</span>
    </button>`).join('') || '<p class="muted small">No contacts in scope.</p>';
}

function renderTelemetry() {
  const c = selected();
  if (!c) { telemetry.innerHTML = '<p class="muted small">Select a contact to view telemetry.</p>'; return; }
  telemetry.innerHTML = `
    <div class="telemetry-row"><span>Designation</span><strong class="gold">${c.id}</strong></div>
    <div class="telemetry-row"><span>Classification</span><strong>${c.type}</strong></div>
    <div class="telemetry-row"><span>Altitude</span><strong>${c.alt.toLocaleString()} m</strong></div>
    <div class="telemetry-row"><span>Velocity</span><strong>${c.speed} km/h</strong></div>
    <div class="telemetry-row"><span>Bearing</span><strong>${Math.round((Math.atan2(c.y - 0.5, c.x - 0.5) * 180) / Math.PI + 360) % 360}°</strong></div>
    <div class="telemetry-row"><span>Signal</span><strong>${c.signal}%</strong></div>
    <div class="telemetry-row"><span>Status</span><strong class="gold">${c.locked ? 'LOCKED' : 'TRACKING'}</strong></div>`;
}

function renderAll() { renderContacts(); renderTelemetry(); }

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 14;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#050b17';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(96, 165, 250, .17)';
  ctx.lineWidth = 1;
  for (let r = radius / 4; r <= radius; r += radius / 4) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
  ctx.fillStyle = 'rgba(125, 211, 252, .6)';
  ctx.font = '12px monospace';
  ctx.fillText('000', cx - 12, cy - radius - 4);
  ctx.fillText('090', cx + radius + 4, cy + 4);
  ctx.fillText('180', cx - 12, cy + radius + 16);

  const sweep = 0.62;
  const grad = ctx.createConicGradient ? ctx.createConicGradient(angle - sweep, cx, cy) : null;
  if (grad) {
    grad.addColorStop(0, 'rgba(52, 211, 153, 0)');
    grad.addColorStop(sweep / (Math.PI * 2), 'rgba(52, 211, 153, .06)');
    grad.addColorStop(sweep / (Math.PI * 2) + 0.001, 'rgba(52, 211, 153, .28)');
    grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, angle - sweep, angle); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(52, 211, 153, .85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();

  contacts.forEach((c) => {
    c.x += c.vx; c.y += c.vy;
    if (c.x < 0.07 || c.x > 0.93) c.vx *= -1;
    if (c.y < 0.07 || c.y > 0.93) c.vy *= -1;
    const px = cx + (c.x - 0.5) * 2 * radius;
    const py = cy + (c.y - 0.5) * 2 * radius;
    const bearing = Math.atan2(c.y - 0.5, c.x - 0.5);
    let diff = Math.abs(((angle - bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (diff < 0.09) c.ping = 1;
    c.ping = Math.max(0, c.ping - 0.012);

    const isSelected = c.id === selectedId;
    const color = c.locked ? '#fb7185' : isSelected ? '#e3b341' : '#60a5fa';
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = isSelected || c.locked ? 2 : 1;
    ctx.globalAlpha = 0.5 + c.ping * 0.5;
    ctx.beginPath(); ctx.arc(px, py, 5 + c.ping * 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
    if (isSelected) {
      ctx.strokeRect(px - 11, py - 11, 22, 22);
      ctx.font = '11px monospace'; ctx.fillText(c.id, px + 13, py - 8);
    }
    ctx.globalAlpha = 1;
  });
  ctx.restore();

  if (!paused) angle = (angle + 0.011) % (Math.PI * 2);
  requestAnimationFrame(draw);
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  let hit = contacts.find((c) => Math.hypot(c.x - x, c.y - y) < 0.07);
  if (!hit) {
    hit = makeContact(x, y, 'UNKNOWN');
    contacts.push(hit);
    log(`New unclassified contact ${hit.id} placed in sector.`, 'alert');
  }
  selectedId = hit.id;
  log(`Selected ${hit.id} · ${hit.type}.`, 'info');
  renderAll();
});

contactList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  selectedId = button.dataset.id;
  renderAll();
});

lockBtn.addEventListener('click', () => {
  const c = selected();
  if (!c) return;
  c.locked = !c.locked;
  log(`${c.id} ${c.locked ? 'LOCKED — tracking solution acquired.' : 'released from lock.'}`, c.locked ? 'alert' : 'ok');
  renderAll();
});

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume sweep' : 'Pause sweep';
  log(`Radar sweep ${paused ? 'paused' : 'resumed'}.`, 'info');
});

resetBtn.addEventListener('click', () => {
  logEl.innerHTML = '';
  log('Simulation reset.', 'ok');
  seed();
});

function tickClock() {
  clockEl.textContent = new Date().toLocaleTimeString([], { hour12: false });
}
setInterval(tickClock, 1000);
tickClock();
seed();
requestAnimationFrame(draw);
