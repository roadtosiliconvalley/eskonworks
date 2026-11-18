const STORAGE_KEY = 'eskonworks-expenses';
const $ = (id) => document.getElementById(id);

let expenses = [];
try { expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { expenses = []; }

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function addExpense(event) {
  event.preventDefault();
  const description = $('description').value.trim();
  const amount = Number($('amount').value);
  if (!description || !Number.isFinite(amount) || amount <= 0) return;

  expenses.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    description,
    amount,
    category: $('category').value,
    date: new Date().toISOString()
  });

  save();
  $('expense-form').reset();
  $('description').focus();
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter((item) => item.id !== id);
  save();
  render();
}

function renderSummary() {
  const now = new Date();
  const monthly = expenses.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const total = monthly.reduce((sum, item) => sum + item.amount, 0);
  $('total').textContent = money(total);
  $('count').textContent = monthly.length;

  const byCategory = monthly.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  $('top-category').textContent = top ? top[0] : '—';

  const breakdown = $('breakdown');
  breakdown.innerHTML = '';
  if (!top) {
    breakdown.innerHTML = '<p class="muted small">No expenses yet.</p>';
    return;
  }

  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, value]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';

    const name = document.createElement('span');
    name.textContent = category;

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${(value / total) * 100}%`;
    track.appendChild(fill);

    const amount = document.createElement('span');
    amount.textContent = money(value);

    row.append(name, track, amount);
    breakdown.appendChild(row);
  });
}

function renderList() {
  const filter = $('filter').value;
  const list = expenses.filter((item) => filter === 'all' || item.category === filter);
  const target = $('expense-list');
  target.innerHTML = '';

  if (!list.length) {
    target.innerHTML = '<p class="muted">No transactions match this filter.</p>';
    return;
  }

  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'expense-row';

    const info = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.description;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${item.category} · ${new Date(item.date).toLocaleDateString()}`;
    info.append(name, meta);

    const amount = document.createElement('span');
    amount.className = 'amount';
    amount.textContent = money(item.amount);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${item.description}`);
    remove.addEventListener('click', () => deleteExpense(item.id));

    row.append(info, amount, remove);
    target.appendChild(row);
  });
}

function render() {
  renderSummary();
  renderList();
}

$('expense-form').addEventListener('submit', addExpense);
$('filter').addEventListener('change', renderList);
render();
