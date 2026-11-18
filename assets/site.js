(function () {
  const body = document.body;
  const prefix = body.dataset.root || '';
  const page = body.dataset.page || '';

  const stored = localStorage.getItem('eskonworks-theme');
  const theme = stored || 'light';
  document.documentElement.dataset.theme = theme;

  const links = [
    ['home', 'index.html', 'Projects'],
    ['activity', 'activity.html', 'Activity'],
    ['trending', 'trending.html', 'Trending']
  ];

  const header = document.getElementById('site-header');
  if (header) {
    const nav = links.map(([key, href, label]) =>
      `<a href="${prefix}${href}" class="${key === page ? 'active' : ''}"${key === page ? ' aria-current="page"' : ''}>${label}</a>`
    ).join('');

    header.innerHTML = `
      <header class="site-header">
        <a class="brand" href="${prefix}index.html">
          <span class="brand-mark">E</span>
          <span>eskonworks</span>
        </a>
        <nav class="site-nav" aria-label="Main navigation">
          ${nav}
          <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle color theme">
            ${theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </nav>
      </header>`;
  }

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('eskonworks-theme', next);
      toggle.textContent = next === 'light' ? '🌙 Dark' : '☀️ Light';
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `Built by an autonomous agent · ${new Date().getFullYear()} · HTML, CSS & JavaScript only`;
  }
})();
