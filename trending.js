(function () {
  const $ = (id) => document.getElementById(id);
  const prefix = document.body.dataset.root || '';

  const FALLBACK = {
    generated_at: '2026-11-17 11:43 UTC',
    window_days: 7,
    min_stars: 50,
    sections: [
      {
        title: 'Overall',
        repos: [
          { full_name: 'deepseek-ai/chat-demo', html_url: 'https://github.com/deepseek-ai/chat-demo', stargazers_count: 4378, language: 'TypeScript', description: 'Chat Demo' },
          { full_name: 'apex-compute/ANR', html_url: 'https://github.com/apex-compute/ANR', stargazers_count: 2531, language: 'C++', description: 'Apex Neural Rendering (ANR) by Apex Compute' },
          { full_name: 'hitkeeen/blender-ai-mcp-addon', html_url: 'https://github.com/hitkeeen/blender-ai-mcp-addon', stargazers_count: 2384, language: null, description: 'AI assistant and MCP server for Blender: visual chat, scene tools and multi-agent workflows.' },
          { full_name: 'Kianuni/Erosion-CN', html_url: 'https://github.com/Kianuni/Erosion-CN', stargazers_count: 2235, language: 'Swift', description: 'Bootloop-safe iOS / iPadOS system configuration and MobileGestalt toolbox.' },
          { full_name: 'Noniv/abyssal-garden', html_url: 'https://github.com/Noniv/abyssal-garden', stargazers_count: 1950, language: 'JavaScript', description: 'A dreamy underwater world you can swim through in your browser, generated entirely by code.' },
          { full_name: 'FrigadeHQ/yogurt', html_url: 'https://github.com/FrigadeHQ/yogurt', stargazers_count: 1946, language: 'TypeScript', description: 'Private AI meeting notes that stay on your computer. An open-source Granola alternative.' },
          { full_name: 'HybridRobotics/supermimic', html_url: 'https://github.com/HybridRobotics/supermimic', stargazers_count: 1715, language: 'Python', description: 'Humanoid whole-body motion tracking with one differentiable world model.' },
          { full_name: 'duwqijlk/muse-protocol', html_url: 'https://github.com/duwqijlk/muse-protocol', stargazers_count: 1547, language: 'Python', description: 'muse.ai registration and invitation protocol research in pure Python.' },
          { full_name: 'Eynnzerr/TelemetryCleaner', html_url: 'https://github.com/Eynnzerr/TelemetryCleaner', stargazers_count: 1409, language: 'Kotlin', description: 'Rootless removal of preinstalled telemetry modules on Chinese Android ROMs.' },
          { full_name: 'ZiChuanLan/freebie-radar', html_url: 'https://github.com/ZiChuanLan/freebie-radar', stargazers_count: 1335, language: 'TypeScript', description: 'Resource radar with 100+ sources, AI filtering and Telegram notifications.' }
        ]
      },
      {
        title: 'Rust',
        repos: [
          { full_name: 'makepad/relax', html_url: 'https://github.com/makepad/relax', stargazers_count: 587, language: 'Rust', description: 'Relax Rust JIT.' },
          { full_name: 'quer3q/kraken-mount', html_url: 'https://github.com/quer3q/kraken-mount', stargazers_count: 461, language: 'Rust', description: 'Minimalist PS5 game mounter supporting PKG, folder dumps, zstd and lz4.' }
        ]
      },
      {
        title: 'Go',
        repos: [
          { full_name: 'egoist/tinytraffic', html_url: 'https://github.com/egoist/tinytraffic', stargazers_count: 237, language: 'Go', description: 'Self-host web analytics in a single binary.' },
          { full_name: 'tim-today/TinyDrop', html_url: 'https://github.com/tim-today/TinyDrop', stargazers_count: 138, language: 'Go', description: 'TinyDrop — lightweight cross-platform LAN and Tailscale file sharing.' }
        ]
      }
    ],
    topics: [
      { name: 'llm', count: 3 }, { name: 'mcp', count: 3 }, { name: 'linux', count: 3 },
      { name: 'privacy', count: 3 }, { name: 'typescript', count: 3 }, { name: 'chatgpt', count: 2 },
      { name: 'claude', count: 2 }, { name: 'mcp-server', count: 2 }, { name: 'ai-notetaker', count: 2 }
    ]
  };

  const COLORS = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
    Go: '#00ADD8', 'C++': '#f34b7d', Swift: '#F05138', Kotlin: '#A97BFF', HTML: '#e34c26', CSS: '#563d7c'
  };

  const state = { data: FALLBACK, query: '', language: 'All', sort: 'stars', repos: [] };

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatStars(value) {
    return new Intl.NumberFormat('en', { notation: Math.abs(value) >= 10000 ? 'compact' : 'standard' }).format(value || 0);
  }

  function flatten(data) {
    const byName = new Map();
    (data.sections || []).forEach((section) => {
      (section.repos || []).forEach((repo) => {
        const key = repo.full_name;
        if (!byName.has(key)) {
          byName.set(key, { ...repo, sections: [section.title] });
        } else if (!byName.get(key).sections.includes(section.title)) {
          byName.get(key).sections.push(section.title);
        }
      });
    });
    return [...byName.values()];
  }

  function renderLanguages() {
    const target = $('language-filters');
    target.innerHTML = '';
    const languages = ['All', ...new Set(state.repos.map((repo) => repo.language).filter(Boolean))].sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });

    languages.forEach((language) => {
      const chip = make('button', `chip${language === state.language ? ' active' : ''}`, language);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        state.language = language;
        renderLanguages();
        renderRepos();
      });
      target.appendChild(chip);
    });
  }

  function visibleRepos() {
    const query = state.query.trim().toLowerCase();
    const list = state.repos.filter((repo) => {
      const haystack = `${repo.full_name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesLanguage = state.language === 'All' || repo.language === state.language;
      return matchesQuery && matchesLanguage;
    });

    list.sort((a, b) => {
      if (state.sort === 'name') return a.full_name.localeCompare(b.full_name);
      if (state.sort === 'language') return (a.language || 'zzz').localeCompare(b.language || 'zzz') || b.stargazers_count - a.stargazers_count;
      return b.stargazers_count - a.stargazers_count;
    });
    return list;
  }

  function renderRepos() {
    const grid = $('repo-grid');
    const list = visibleRepos();
    $('repo-count').textContent = `${list.length} of ${state.repos.length}`;
    grid.innerHTML = '';

    if (!list.length) {
      grid.appendChild(make('p', 'muted', 'No repositories match those filters.'));
      return;
    }

    list.forEach((repo, index) => {
      const card = make('article', 'card repo-card');

      const top = make('div', 'repo-top');
      top.appendChild(make('span', 'rank', `#${index + 1}`));
      const tags = make('div', 'section-tags');
      repo.sections.slice(0, 2).forEach((section) => tags.appendChild(make('span', 'badge', section)));
      top.appendChild(tags);
      card.appendChild(top);

      const title = make('h3');
      const link = make('a', '', repo.full_name);
      link.href = repo.html_url || '#';
      link.target = '_blank';
      link.rel = 'noreferrer';
      title.appendChild(link);
      card.appendChild(title);

      card.appendChild(make('p', 'repo-desc', repo.description || 'No description provided.'));

      const meta = make('div', 'repo-meta');
      meta.appendChild(make('span', 'stars', `★ ${formatStars(repo.stargazers_count)}`));
      const language = make('span', 'language');
      const dot = make('span', 'dot');
      dot.style.background = COLORS[repo.language] || 'var(--site-accent)';
      language.append(dot, document.createTextNode(repo.language || 'Other'));
      meta.appendChild(language);
      card.appendChild(meta);

      grid.appendChild(card);
    });
  }

  function renderTopics() {
    const target = $('topic-cloud');
    target.innerHTML = '';
    const topics = state.data.topics || [];
    if (!topics.length) {
      target.appendChild(make('p', 'muted', 'No topic data available.'));
      return;
    }
    topics.forEach((topic) => {
      const link = make('a', 'topic', `#${topic.name} `);
      link.href = `https://github.com/topics/${encodeURIComponent(topic.name)}`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.style.fontSize = `${13 + Math.min(topic.count, 6) * 2}px`;
      link.appendChild(make('small', '', `×${topic.count}`));
      target.appendChild(link);
    });
  }

  function renderMeta() {
    const meta = $('trending-meta');
    const d = state.data;
    meta.innerHTML = '';
    meta.appendChild(make('span', '', 'Last updated: ')).appendChild(make('strong', '', d.generated_at || 'unknown'));
    meta.appendChild(make('span', '', 'Window: ')).appendChild(make('strong', '', `${d.window_days || 7} days`));
    meta.appendChild(make('span', '', 'Minimum stars: ')).appendChild(make('strong', '', d.min_stars || 50));
    meta.appendChild(make('span', '', 'Sources: ')).appendChild(make('strong', '', `${(d.sections || []).length} sections`));
  }

  function boot() {
    state.repos = flatten(state.data);
    renderMeta();
    renderLanguages();
    renderRepos();
    renderTopics();

    $('repo-search')?.addEventListener('input', (event) => {
      state.query = event.target.value;
      renderRepos();
    });
    $('sort-select')?.addEventListener('change', (event) => {
      state.sort = event.target.value;
      renderRepos();
    });
  }

  async function load() {
    boot();
    try {
      const response = await fetch(`${prefix}data/trending.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('static data unavailable');
      const data = await response.json();
      if (Array.isArray(data.sections) && data.sections.length) {
        state.data = data;
        state.language = 'All';
        boot();
      }
    } catch (_) {
      // Embedded fallback keeps the page useful offline.
    }
  }

  load();
})();
