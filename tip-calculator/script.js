const billInput = document.getElementById('bill');
const customTip = document.getElementById('customTip');
const presets = document.getElementById('tipPresets');
const peopleInput = document.getElementById('people');
const perPersonEl = document.getElementById('perPerson');
const subtotalEl = document.getElementById('subtotal');
const tipRateEl = document.getElementById('tipRate');
const tipAmountEl = document.getElementById('tipAmount');
const totalEl = document.getElementById('total');

let tipRate = 20;

const money = (value) => `$${(Number.isFinite(value) ? value : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function calculate() {
  const bill = Math.max(0, parseFloat(billInput.value) || 0);
  const people = Math.max(1, Math.min(50, parseInt(peopleInput.value, 10) || 1));
  const tip = bill * tipRate / 100;
  const total = bill + tip;
  perPersonEl.textContent = money(total / people);
  subtotalEl.textContent = money(bill);
  tipRateEl.textContent = `${tipRate}%`;
  tipAmountEl.textContent = money(tip);
  totalEl.textContent = money(total);
}

presets.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tip]');
  if (!button) return;
  tipRate = Number(button.dataset.tip);
  customTip.value = '';
  presets.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  calculate();
});

customTip.addEventListener('input', () => {
  const value = parseFloat(customTip.value);
  if (!Number.isFinite(value) || value < 0) return;
  tipRate = Math.min(100, value);
  presets.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
  calculate();
});

document.getElementById('minus').addEventListener('click', () => {
  peopleInput.value = Math.max(1, (parseInt(peopleInput.value, 10) || 1) - 1);
  calculate();
});
document.getElementById('plus').addEventListener('click', () => {
  peopleInput.value = Math.min(50, (parseInt(peopleInput.value, 10) || 1) + 1);
  calculate();
});

billInput.addEventListener('input', calculate);
peopleInput.addEventListener('input', calculate);
calculate();
