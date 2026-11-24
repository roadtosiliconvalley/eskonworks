const ciphers = document.getElementById('ciphers');
const options = document.getElementById('options');
const shiftInput = document.getElementById('shift');
const shiftValue = document.getElementById('shiftValue');
const input = document.getElementById('input');
const output = document.getElementById('output');
const note = document.getElementById('note');
let cipher = 'caesar';

function caesar(text, shift) {
  return text.replace(/[a-z]/gi, (char) => {
    const start = char === char.toUpperCase() ? 65 : 97;
    return String.fromCharCode(start + (char.charCodeAt(0) - start + shift + 26) % 26);
  });
}
function atbash(text) {
  return text.replace(/[a-z]/gi, (char) => {
    const start = char === char.toUpperCase() ? 65 : 97;
    return String.fromCharCode(start + (25 - (char.charCodeAt(0) - start)));
  });
}
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
function fromBase64(text) {
  try {
    const binary = atob(text.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_) { return 'Invalid Base64 input.'; }
}

function transform() {
  const text = input.value;
  let result = '';
  if (cipher === 'caesar') result = caesar(text, Number(shiftInput.value));
  else if (cipher === 'rot13') result = caesar(text, 13);
  else if (cipher === 'atbash') result = atbash(text);
  else result = toBase64(text);
  output.value = result;
}

ciphers.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cipher]');
  if (!button) return;
  cipher = button.dataset.cipher;
  ciphers.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  options.hidden = cipher !== 'caesar';
  note.textContent = cipher === 'base64'
    ? 'Base64 encodes bytes, not encryption — anyone can decode it. Non-ASCII text is supported.'
    : 'These are learning demos, not secure encryption.';
  transform();
});
shiftInput.addEventListener('input', () => { shiftValue.textContent = shiftInput.value; transform(); });
input.addEventListener('input', transform);
document.getElementById('swapBtn').addEventListener('click', () => { input.value = output.value; transform(); });
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!output.value) return;
  try { await navigator.clipboard.writeText(output.value); } catch (_) { /* ignore */ }
  note.textContent = 'Output copied to clipboard.';
});

input.value = 'The quick brown fox jumps over the lazy dog.';
transform();
