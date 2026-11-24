const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const bmiValue = document.getElementById('bmiValue');
const categoryEl = document.getElementById('category');
const marker = document.getElementById('marker');
const details = document.getElementById('details');

const CATEGORIES = [
  { max: 18.5, name: 'Underweight', color: '#60a5fa' },
  { max: 25, name: 'Healthy range', color: '#34d399' },
  { max: 30, name: 'Overweight', color: '#fbbf24' },
  { max: Infinity, name: 'Obese', color: '#fb7185' }
];

function calculate(event) {
  event.preventDefault();
  const cm = Number(heightInput.value);
  const kg = Number(weightInput.value);
  if (!cm || !kg || cm <= 0 || kg <= 0) return;
  const meters = cm / 100;
  const bmi = kg / (meters * meters);
  const group = CATEGORIES.find((c) => bmi < c.max) || CATEGORIES[CATEGORIES.length - 1];
  bmiValue.textContent = bmi.toFixed(1);
  bmiValue.style.color = group.color;
  categoryEl.textContent = group.name;
  categoryEl.style.color = group.color;
  marker.style.left = `${Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100))}%`;

  const minWeight = 18.5 * meters * meters;
  const maxWeight = 24.9 * meters * meters;
  const diff = kg - (minWeight + maxWeight) / 2;
  details.innerHTML = `
    <div><span>Healthy weight range</span><strong>${minWeight.toFixed(1)} – ${maxWeight.toFixed(1)} kg</strong></div>
    <div><span>Compared with midpoint</span><strong>${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg</strong></div>
    <div><span>Formula</span><strong>kg ÷ (m × m)</strong></div>`;
}

document.getElementById('bmiForm').addEventListener('submit', calculate);
heightInput.addEventListener('input', () => calculate(new Event('submit')));
weightInput.addEventListener('input', () => calculate(new Event('submit')));
calculate(new Event('submit'));
