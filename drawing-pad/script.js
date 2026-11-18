const COLORS = ['#e8eefc', '#7c8cff', '#34d399', '#fb7185', '#fbbf24', '#38bdf8', '#111827', '#ffffff'];
const canvas = document.getElementById('pad');
const ctx = canvas.getContext('2d');
const swatches = document.getElementById('swatches');
const customColor = document.getElementById('customColor');
const sizeInput = document.getElementById('size');
const sizeValue = document.getElementById('sizeValue');
const pencilBtn = document.getElementById('pencilBtn');
const eraserBtn = document.getElementById('eraserBtn');

let color = COLORS[1];
let size = Number(sizeInput.value);
let tool = 'pencil';
let drawing = false;
const history = [];

function fillBackground() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function snapshot() {
  history.push(canvas.toDataURL());
  if (history.length > 20) history.shift();
}

function undo() {
  if (!history.length) return;
  const image = new Image();
  image.onload = () => ctx.drawImage(image, 0, 0);
  image.src = history.pop();
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function start(event) {
  event.preventDefault();
  try { canvas.setPointerCapture(event.pointerId); } catch (_) { }
  snapshot();
  drawing = true;
  const p = point(event);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = tool === 'eraser' ? size * 2 : size;
  ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function move(event) {
  if (!drawing) return;
  event.preventDefault();
  const p = point(event);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function stop() {
  drawing = false;
  ctx.closePath();
}

function setColor(value) {
  color = value;
  tool = 'pencil';
  pencilBtn.classList.add('active');
  eraserBtn.classList.remove('active');
  [...swatches.children].forEach((button) => button.classList.toggle('active', button.dataset.color === value));
}

function setTool(next) {
  tool = next;
  pencilBtn.classList.toggle('active', next === 'pencil');
  eraserBtn.classList.toggle('active', next === 'eraser');
}

COLORS.forEach((value, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `swatch${value === color ? ' active' : ''}`;
  button.style.background = value;
  button.dataset.color = value;
  button.title = `Color ${index + 1}`;
  button.setAttribute('aria-label', `Use color ${value}`);
  button.addEventListener('click', () => setColor(value));
  swatches.appendChild(button);
});

customColor.addEventListener('input', (event) => setColor(event.target.value));
sizeInput.addEventListener('input', (event) => {
  size = Number(event.target.value);
  sizeValue.textContent = size;
});
pencilBtn.addEventListener('click', () => setTool('pencil'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('clearBtn').addEventListener('click', () => {
  snapshot();
  fillBackground();
});
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'eskonworks-drawing.png';
  link.click();
});

canvas.addEventListener('pointerdown', start);
canvas.addEventListener('pointermove', move);
canvas.addEventListener('pointerup', stop);
canvas.addEventListener('pointercancel', stop);
canvas.addEventListener('pointerleave', stop);

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }
});

fillBackground();
sizeValue.textContent = size;
