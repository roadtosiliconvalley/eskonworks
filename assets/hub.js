(function () {
  const cards = [...document.querySelectorAll('#project-grid .card')];
  const search = document.getElementById('project-search');
  const count = document.getElementById('result-count');
  const chips = [...document.querySelectorAll('[data-filter]')];
  let activeFilter = 'all';

  function applyFilters() {
    const query = (search?.value || '').trim().toLowerCase();
    let shown = 0;

    cards.forEach((card) => {
      const haystack = `${card.dataset.name} ${card.dataset.description} ${card.dataset.category}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
      const visible = matchesQuery && matchesFilter;
      card.classList.toggle('hidden', !visible);
      if (visible) shown++;
    });

    if (count) count.textContent = `${shown} of ${cards.length}`;
  }

  search?.addEventListener('input', applyFilters);
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      chips.forEach((item) => item.classList.toggle('active', item === chip));
      applyFilters();
    });
  });
  applyFilters();

  const FALLBACK_COMMITS = [
    { message: 'feat: add login card, tic tac toe, and snake sites', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/98d91a6', date: '2026-11-18T00:00:00Z' },
    { message: 'auto: #1 Add a hello world script', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/ee9faee', date: '2026-11-17T16:22:00Z' },
    { message: 'chore: initialize eskonworks workspace', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/c54b713', date: '2026-11-17T15:55:00Z' }
  ];

  const target = document.getElementById('recent-builds');
  if (!target) return;

  function render(commits) {
    target.innerHTML = '';
    if (!commits.length) {
      target.innerHTML = '<p class="muted">No commits yet.</p>';
      return;
    }

    commits.slice(0, 5).forEach((commit) => {
      const row = document.createElement('div');
      row.className = 'build-item';

      const link = document.createElement('a');
      link.href = commit.url || '#';
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = commit.message || commit.sha || 'Commit';

      const time = document.createElement('time');
      const date = new Date(commit.date || commit.committed_at);
      time.dateTime = date.toISOString();
      time.textContent = Number.isNaN(date.getTime()) ? '' : relativeTime(date);

      row.append(link, time);
      target.appendChild(row);
    });
  }

  function relativeTime(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  async function load() {
    render(FALLBACK_COMMITS);
    try {
      const response = await fetch('data/activity.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('static data unavailable');
      const data = await response.json();
      if (Array.isArray(data.recent_commits) && data.recent_commits.length) render(data.recent_commits);
    } catch (_) {
      // file:// or offline — the fallback commits are already displayed.
    }
  }

  load();
})();
