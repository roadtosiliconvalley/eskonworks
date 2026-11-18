const STORAGE_KEY = 'eskonworks-markdown';
const source = document.getElementById('source');
const preview = document.getElementById('preview');
const counts = document.getElementById('counts');
const saved = document.getElementById('saved');

const SAMPLE = '# Hello from eskonworks\n\nThis is a **live Markdown preview**.\n\n- Write on the left\n- See it here on the right\n- Saved in your browser\n\n> No server. No dependencies. Just HTML, CSS and JS.\n';

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}

function inline(text) {
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return result;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  let html = '';
  let paragraph = [];
  let list = [];
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${inline(paragraph.join(' '))}</p>`;
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      html += `<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
      list = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      html += `<blockquote>${inline(quote.join(' '))}</blockquote>`;
      quote = [];
    }
  };
  const flushAll = () => { flushParagraph(); flushList(); flushQuote(); };

  lines.forEach((line) => {
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      return;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      list.push(line.replace(/^\s*[-*]\s+/, ''));
      return;
    }
    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      quote.push(line.replace(/^>\s?/, ''));
      return;
    }
    if (/^---+$/.test(line.trim())) {
      flushAll();
      html += '<hr>';
      return;
    }
    if (!line.trim()) {
      flushAll();
      return;
    }
    paragraph.push(line.trim());
  });

  flushAll();
  return html;
}

function update() {
  const value = source.value;
  preview.innerHTML = renderMarkdown(value);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  counts.textContent = `${words} word${words === 1 ? '' : 's'} · ${value.length} character${value.length === 1 ? '' : 's'}`;
  localStorage.setItem(STORAGE_KEY, value);
  saved.textContent = 'Saved locally';
}

function surround(before, after = before) {
  const start = source.selectionStart;
  const end = source.selectionEnd;
  const selected = source.value.slice(start, end) || 'text';
  source.value = source.value.slice(0, start) + before + selected + after + source.value.slice(end);
  source.selectionStart = start + before.length;
  source.selectionEnd = start + before.length + selected.length;
  source.focus();
  update();
}

function prefixLines(prefix) {
  const value = source.value;
  const start = source.selectionStart;
  const end = source.selectionEnd;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
  const block = value.slice(lineStart, lineEnd) || 'text';
  const transformed = block.split('\n').map((line) => prefix + line).join('\n');
  source.value = value.slice(0, lineStart) + transformed + value.slice(lineEnd);
  source.selectionStart = lineStart;
  source.selectionEnd = lineStart + transformed.length;
  source.focus();
  update();
}

function insertLink() {
  const start = source.selectionStart;
  const end = source.selectionEnd;
  const label = source.value.slice(start, end) || 'link text';
  const snippet = `[${label}](https://example.com)`;
  source.value = source.value.slice(0, start) + snippet + source.value.slice(end);
  source.selectionStart = start + label.length + 3;
  source.selectionEnd = source.selectionStart + 'https://example.com'.length;
  source.focus();
  update();
}

document.querySelectorAll('[data-wrap]').forEach((button) => {
  button.addEventListener('click', () => surround(button.dataset.wrap));
});
document.querySelectorAll('[data-prefix]').forEach((button) => {
  button.addEventListener('click', () => prefixLines(button.dataset.prefix));
});
document.querySelector('[data-link]').addEventListener('click', insertLink);

document.getElementById('downloadBtn').addEventListener('click', () => {
  const blob = new Blob([source.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'eskonworks-note.md';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!source.value || confirm('Clear this note?')) {
    source.value = '';
    update();
    source.focus();
  }
});

source.addEventListener('input', () => {
  saved.textContent = 'Saving…';
  update();
});

source.value = localStorage.getItem(STORAGE_KEY) ?? SAMPLE;
update();
