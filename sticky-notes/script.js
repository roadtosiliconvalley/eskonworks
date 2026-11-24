const STORAGE_KEY = 'eskonworks-sticky-notes-v1';
const board = document.getElementById('board');
const noteText = document.getElementById('noteText');
const search = document.getElementById('search');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const colorsEl = document.getElementById('colors');

let notes = [];
let color = '#fde68a';
let drag = null;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (Array.isArray(saved)) notes = saved;
} catch (_) { /* ignore */ }
if (!notes.length) {
  notes = [
    { id: 'n1', text: 'Click a color, then add a note.', color: '#fde68a', x: 30, y: 30 },
    { id: 'n2', text: 'Drag me anywhere on the board!', color: '#bfdbfe', x: 230, y: 90 },
    { id: 'n3', text: 'Double-click to edit. Saved locally.', color: '#bbf7d0', x: 110, y: 250 }
  ];
}
save();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (_) { /* ignore */ }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function render() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  board.innerHTML = notes.map((note) => {
    const hidden = query && !note.text.toLowerCase().includes(query);
    if (!hidden) visible++;
    return `<article class="note${hidden ? ' hidden' : ''}" data-id="${note.id}" style="left:${note.x}px;top:${note.y}px;background:${note.color}">
      <textarea aria-label="Note text">${escapeHtml(note.text)}</textarea>
      <div class="note-actions"><span>✥ drag</span><button type="button" class="delete" aria-label="Delete note">✕</button></div>
    </article>`;
  }).join('');
  countEl.textContent = `${visible} note${visible === 1 ? '' : 's'}`;
  emptyEl.hidden = notes.length > 0;
}

function addNote() {
  const text = noteText.value.trim();
  if (!text) return;
  notes.push({
    id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    text, color,
    x: 20 + Math.floor(Math.random() * Math.max(1, board.clientWidth - 200)),
    y: 20 + Math.floor(Math.random() * Math.max(1, board.clientHeight - 160))
  });
  noteText.value = '';
  save();
  render();
}

colorsEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-color]');
  if (!button) return;
  color = button.dataset.color;
  colorsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
});
document.getElementById('addBtn').addEventListener('click', addNote);
noteText.addEventListener('keydown', (event) => { if (event.key === 'Enter') addNote(); });
search.addEventListener('input', render);

board.addEventListener('click', (event) => {
  const button = event.target.closest('.delete');
  if (!button) return;
  notes = notes.filter((n) => n.id !== button.closest('.note').dataset.id);
  save();
  render();
});

board.addEventListener('dblclick', (event) => {
  const area = event.target.closest('textarea');
  if (area) return;
  const note = event.target.closest('.note');
  if (note) note.querySelector('textarea').focus();
});

board.addEventListener('change', (event) => {
  if (event.target.tagName !== 'TEXTAREA') return;
  const note = notes.find((n) => n.id === event.target.closest('.note').dataset.id);
  if (note) { note.text = event.target.value; save(); }
});

board.addEventListener('pointerdown', (event) => {
  const note = event.target.closest('.note');
  if (!note || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') return;
  const rect = board.getBoundingClientRect();
  const noteRect = note.getBoundingClientRect();
  drag = {
    element: note,
    id: note.dataset.id,
    offsetX: event.clientX - noteRect.left - rect.left,
    offsetY: event.clientY - noteRect.top - rect.top,
    moved: false
  };
  note.setPointerCapture(event.pointerId);
});
board.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = board.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width - drag.element.offsetWidth, event.clientX - rect.left - drag.offsetX));
  const y = Math.max(0, Math.min(rect.height - drag.element.offsetHeight, event.clientY - rect.top - drag.offsetY));
  drag.element.style.left = `${x}px`;
  drag.element.style.top = `${y}px`;
  drag.moved = true;
});
board.addEventListener('pointerup', () => {
  if (!drag) return;
  if (drag.moved) {
    const note = notes.find((n) => n.id === drag.id);
    if (note) {
      note.x = parseInt(drag.element.style.left, 10);
      note.y = parseInt(drag.element.style.top, 10);
      save();
    }
  }
  drag = null;
});

render();
