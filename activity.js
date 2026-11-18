(function () {
  const REPO = 'roadtosiliconvalley/eskonworks';
  const $ = (id) => document.getElementById(id);

  const FALLBACK = {
    generated_at: '2026-11-18T12:00:00Z',
    bot: {
      status: 'online',
      current_task: 'Waiting for a new issue labelled auto',
      detail: 'The supervisor is idle and watching the repository.',
      progress: 100
    },
    stats: { open_tasks: 0, completed_tasks: 1, total_commits: 3 },
    timeline: [
      { time: '2026-11-18T12:00:00Z', kind: 'done', title: 'Workspace ready', detail: 'Agent is watching for auto-labelled issues.' },
      { time: '2026-11-17T16:22:00Z', kind: 'done', title: '#1 Add a hello world script', detail: 'Issue completed and committed locally.' },
      { time: '2026-11-17T15:55:00Z', kind: 'commit', title: 'Workspace initialized', detail: 'Initial commit pushed to GitHub.' }
    ],
    recent_commits: [
      { sha: '98d91a6', message: 'feat: add login card, tic tac toe, and snake sites', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/98d91a6', date: '2026-11-18T00:00:00Z' },
      { sha: 'ee9faee', message: 'auto: #1 Add a hello world script', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/ee9faee', date: '2026-11-17T16:22:00Z' },
      { sha: 'c54b713', message: 'chore: initialize eskonworks workspace', url: 'https://github.com/roadtosiliconvalley/eskonworks/commit/c54b713', date: '2026-11-17T15:55:00Z' }
    ],
    open_issues: [
      { number: 1, title: 'Add a hello world script', state: 'closed', url: 'https://github.com/roadtosiliconvalley/eskonworks/issues/1', updated_at: '2026-11-17T16:22:00Z', labels: ['auto'] }
    ]
  };

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  async function getJSON(url, timeout = 9000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function render(data, live) {
    const status = $('bot-status');
    if (status) {
      status.textContent = live ? '● Live from GitHub' : '● Snapshot data';
      status.classList.toggle('live', Boolean(live));
    }

    $('stat-open').textContent = data.stats.open_tasks;
    $('stat-done').textContent = data.stats.completed_tasks;
    $('stat-commits').textContent = data.stats.total_commits;
    $('stat-updated').textContent = relativeTime(data.generated_at);

    $('focus-icon').textContent = data.stats.open_tasks ? '🛠️' : '🤖';
    $('focus-title').textContent = data.bot.current_task;
    $('focus-detail').textContent = data.bot.detail;
    $('focus-progress').style.width = `${data.bot.progress}%`;

    const timeline = $('activity-timeline');
    timeline.innerHTML = '';
    if (!data.timeline.length) {
      timeline.appendChild(make('p', 'muted', 'No activity yet.'));
    } else {
      data.timeline.slice(0, 8).forEach((item) => {
        const row = make('div', `timeline-item ${item.kind || ''}`);
        row.appendChild(make('strong', '', item.title));
        row.appendChild(make('p', '', `${item.detail || ''} · ${relativeTime(item.time)}`));
        timeline.appendChild(row);
      });
    }

    const commits = $('commit-list');
    commits.innerHTML = '';
    if (!data.recent_commits.length) {
      commits.appendChild(make('p', 'muted', 'No commits yet.'));
    } else {
      data.recent_commits.slice(0, 6).forEach((commit) => {
        const row = make('div', 'list-item');
        const link = make('a', '', commit.message || commit.sha);
        link.href = commit.url || '#';
        link.target = '_blank';
        link.rel = 'noreferrer';
        row.append(link, make('span', '', commit.sha || relativeTime(commit.date)));
        commits.appendChild(row);
      });
    }

    const issues = $('issue-list');
    issues.innerHTML = '';
    if (!data.open_issues.length) {
      issues.appendChild(make('p', 'muted', 'No issues yet. Open one with the auto label to queue work.'));
    } else {
      data.open_issues.slice(0, 8).forEach((issue) => {
        const row = make('div', 'list-item');
        const link = make('a', '', `#${issue.number} ${issue.title}`);
        link.href = issue.url || '#';
        link.target = '_blank';
        link.rel = 'noreferrer';
        const state = make('span', issue.state === 'closed' ? 'closed' : 'open', issue.state || 'open');
        row.append(link, state);
        issues.appendChild(row);
      });
    }
  }

  function fromGitHub(commits, issues) {
    const autoIssues = issues.filter((issue) => issue.labels.some((label) => label.name === 'auto'));
    const open = autoIssues.filter((issue) => issue.state === 'open');
    const closed = autoIssues.filter((issue) => issue.state === 'closed');

    const recent_commits = commits.map((item) => ({
      sha: item.sha.slice(0, 7),
      message: item.commit.message.split('\n')[0],
      url: item.html_url,
      date: item.commit.author.date
    }));

    const open_issues = issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      updated_at: issue.updated_at,
      labels: issue.labels.map((label) => label.name)
    }));

    const timeline = [
      ...open_issues.map((issue) => ({
        time: issue.updated_at,
        kind: issue.state === 'closed' ? 'done' : 'task',
        title: `#${issue.number} ${issue.title}`,
        detail: issue.state === 'closed' ? 'Completed' : 'Queued for the agent'
      })),
      ...recent_commits.map((commit) => ({
        time: commit.date,
        kind: 'commit',
        title: commit.message,
        detail: `Commit ${commit.sha}`
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      generated_at: new Date().toISOString(),
      bot: {
        status: 'online',
        current_task: open.length ? `Building: #${open[0].number} ${open[0].title}` : 'Waiting for a new issue labelled auto',
        detail: open.length ? 'An auto-labelled issue is queued right now.' : 'No queued issues. Open one to start the next build.',
        progress: open.length ? 35 : 100
      },
      stats: {
        open_tasks: open.length,
        completed_tasks: closed.length,
        total_commits: recent_commits.length
      },
      timeline,
      recent_commits,
      open_issues
    };
  }

  async function load() {
    let data = FALLBACK;

    try {
      const snapshot = await getJSON('data/activity.json', 5000);
      data = { ...data, ...snapshot };
    } catch (_) {
      // Keep the embedded fallback when opened from file:// or offline.
    }
    render(data, false);

    try {
      const [commits, issues] = await Promise.all([
        getJSON(`https://api.github.com/repos/${REPO}/commits?per_page=6`),
        getJSON(`https://api.github.com/repos/${REPO}/issues?state=all&sort=updated&per_page=10`)
      ]);
      render(fromGitHub(commits, issues.filter((issue) => !issue.pull_request)), true);
    } catch (_) {
      // Static snapshot is already on screen.
    }
  }

  load();
})();
