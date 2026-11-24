const CITIES = [
  ['New York', 14], ['London', 12], ['Paris', 15], ['Tokyo', 19], ['Sydney', 22],
  ['Dubai', 32], ['Mumbai', 29], ['Cairo', 27], ['Toronto', 10], ['São Paulo', 21],
  ['Berlin', 13], ['Singapore', 30], ['Seoul', 17], ['Nairobi', 22], ['Reykjavík', 5]
];
const CONDITIONS = [
  { icon: '☀️', text: 'Clear sky' }, { icon: '🌤️', text: 'Partly cloudy' },
  { icon: '☁️', text: 'Overcast' }, { icon: '🌧️', text: 'Light rain' },
  { icon: '⛈️', text: 'Thunderstorms' }, { icon: '🌫️', text: 'Mist' }
];
const search = document.getElementById('citySearch');
const currentEl = document.getElementById('current');
const forecastEl = document.getElementById('forecast');
const hourlyEl = document.getElementById('hourly');
let city = 'London';
let unit = 'C';

function hash(text) {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(value);
}
function sample(key, min, max) {
  return min + (hash(key) % (max - min + 1));
}
function convert(celsius) {
  return unit === 'C' ? Math.round(celsius) : Math.round(celsius * 9 / 5 + 32);
}
function label() { return unit === 'C' ? '°C' : '°F'; }

function conditionFor(seed) {
  return CONDITIONS[sample(seed, 0, CONDITIONS.length - 1)];
}

function render() {
  const entry = CITIES.find(([name]) => name === city) || CITIES[1];
  const base = entry[1];
  const today = conditionFor(city);
  const temp = base + sample(`${city}-temp`, -3, 3);
  const feels = temp + sample(`${city}-feels`, -4, 2);
  const humidity = sample(`${city}-hum`, 35, 88);
  const wind = sample(`${city}-wind`, 3, 32);
  currentEl.innerHTML = `
    <div class="current-icon">${today.icon}</div>
    <div><h2>${entry[0]}</h2><div class="temp">${convert(temp)}${label()}</div><div class="desc">${today.text} · feels like ${convert(feels)}${label()}</div></div>
    <div class="current-meta">
      <div><span>Humidity</span><strong>${humidity}%</strong></div>
      <div><span>Wind</span><strong>${wind} km/h</strong></div>
      <div><span>Precipitation</span><strong>${sample(`${city}-rain`, 0, 80)}%</strong></div>
      <div><span>UV index</span><strong>${sample(`${city}-uv`, 1, 11)}</strong></div>
    </div>`;

  const names = ['Today', ...Array.from({ length: 4 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  })];
  forecastEl.innerHTML = names.map((name, i) => {
    const cond = conditionFor(`${city}-${i}`);
    const high = base + sample(`${city}-${i}-high`, -2, 5);
    const low = high - sample(`${city}-${i}-low`, 5, 10);
    return `<article class="day-card"><span class="name">${name}</span><span class="icon">${cond.icon}</span>
      <span class="desc">${cond.text}</span><span class="range"><strong>${convert(high)}°</strong> / <span>${convert(low)}°</span></span></article>`;
  }).join('');

  const hours = Array.from({ length: 12 }, (_, i) => {
    const time = (new Date().getHours() + i * 2) % 24;
    const value = temp + Math.round(4 * Math.sin((i / 12) * Math.PI * 2));
    return { time: `${String(time).padStart(2, '0')}:00`, value };
  });
  const values = hours.map((h) => h.value);
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  hourlyEl.innerHTML = hours.map((h) => `
    <div class="hour"><div class="hour-bar" style="--h:${Math.round(((h.value - min) / (max - min)) * 100)}%" title="${convert(h.value)}${label()}"></div><span>${h.time.slice(0, 2)}</span></div>`).join('');
}

document.getElementById('cityList').innerHTML = CITIES.map(([name]) => `<option value="${name}"></option>`).join('');
search.value = city;
search.addEventListener('input', () => {
  const match = CITIES.find(([name]) => name.toLowerCase() === search.value.trim().toLowerCase());
  if (match) { city = match[0]; render(); }
});
search.addEventListener('change', () => {
  const match = CITIES.find(([name]) => name.toLowerCase() === search.value.trim().toLowerCase());
  if (match) { city = match[0]; render(); }
  else search.value = city;
});
document.getElementById('units').addEventListener('click', (event) => {
  const button = event.target.closest('[data-unit]');
  if (!button) return;
  unit = button.dataset.unit;
  document.querySelectorAll('#units button').forEach((b) => b.classList.toggle('active', b === button));
  render();
});

render();
