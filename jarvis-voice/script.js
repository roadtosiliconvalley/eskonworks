const logEl = document.getElementById('log');
const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const statusHint = document.getElementById('statusHint');
const reactor = document.getElementById('reactor');
const textForm = document.getElementById('textForm');
const textCommand = document.getElementById('textCommand');
const voiceToggle = document.getElementById('voiceToggle');
const supportNote = document.getElementById('supportNote');
const clearBtn = document.getElementById('clearBtn');
const commandChips = document.getElementById('commandChips');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

const JOKES = [
  'Why did the computer go to therapy? It had too many bytes of unresolved issues.',
  'I would tell you a joke about UDP, but you might not get it.',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'There are only 10 kinds of people: those who understand binary and those who don’t.'
];

const QUICK = ['hello', 'what time is it', 'tell me a joke', 'system status', 'who are you', 'help'];

function logLine(text, kind) {
  const line = document.createElement('div');
  line.className = `log-line ${kind}`;
  const label = kind === 'you' ? 'You' : kind === 'jarvis' ? 'J.A.R.V.I.S.' : 'System';
  line.innerHTML = `<span class="who">${label}</span>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text, hint, mode) {
  statusText.textContent = text;
  statusHint.textContent = hint;
  document.body.classList.toggle('is-listening', mode === 'listening');
  document.body.classList.toggle('is-error', mode === 'error');
  reactor.classList.toggle('listening', mode === 'listening');
}

function speak(text) {
  if (!voiceToggle.checked || !('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (_) { /* speech is optional */ }
}

function replyFor(raw) {
  const command = raw.trim().toLowerCase();
  if (!command) return null;
  if (/^(hello|hi|hey|good (morning|afternoon|evening))\b/.test(command)) {
    return 'Good day, sir. J.A.R.V.I.S. at your service.';
  }
  if (/\b(time|clock)\b/.test(command)) {
    return `The time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  }
  if (/\b(date|day)\b/.test(command)) {
    return `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`;
  }
  if (/\b(joke|funny)\b/.test(command)) {
    return JOKES[Math.floor(Math.random() * JOKES.length)];
  }
  if (/\b(status|diagnostic|systems)\b/.test(command)) {
    return 'All systems nominal. Arc reactor stable, suit diagnostics green, and no threats detected.';
  }
  if (/\b(who are you|your name|identity)\b/.test(command)) {
    return 'I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. A fictional interface concept built with HTML, CSS and JavaScript.';
  }
  if (/\b(projects|portfolio|home)\b/.test(command)) {
    return 'The project index is one click away — use the “All projects” link at the top of this page.';
  }
  if (/\b(light|lights|brightness|theme)\b/.test(command)) {
    document.body.classList.toggle('bright');
    return document.body.classList.contains('bright')
      ? 'Ambient lighting adjusted to daytime mode.'
      : 'Ambient lighting returned to workshop default.';
  }
  if (/\b(clear|wipe)\b/.test(command)) {
    logEl.innerHTML = '';
    return 'Conversation log cleared.';
  }
  if (/\b(help|commands|what can you do)\b/.test(command)) {
    return 'Available protocols: greetings, time, date, jokes, system status, identity, lighting, projects, clear, and goodbye.';
  }
  if (/\b(stop|goodbye|bye|stand by)\b/.test(command)) {
    if (listening) stopListening();
    return 'Standing by, sir.';
  }
  if (/\b(thank|thanks)\b/.test(command)) {
    return 'You are entirely welcome.';
  }
  return 'I am afraid I have no protocol for that, sir. Say “help” for a list of available commands.';
}

function respond(command) {
  const reply = replyFor(command);
  if (reply === null) return;
  logLine(command, 'you');
  window.setTimeout(() => {
    logLine(reply, 'jarvis');
    speak(reply);
  }, 260);
}

function stopListening() {
  if (recognition && listening) {
    try { recognition.stop(); } catch (_) { /* ignore */ }
  }
  listening = false;
  micBtn.textContent = '🎙️ Start listening';
  micBtn.classList.remove('active');
  setStatus('Standby', 'Press the microphone to begin.', 'idle');
}

function startListening() {
  if (!recognition) return;
  try {
    recognition.start();
    listening = true;
    micBtn.textContent = '⏹️ Stop listening';
    micBtn.classList.add('active');
    setStatus('Listening…', 'Speak a command. I am listening.', 'listening');
  } catch (_) {
    setStatus('Standby', 'Microphone could not be started.', 'error');
  }
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1][0].transcript;
    respond(last);
  };
  recognition.onerror = (event) => {
    const message = event.error === 'not-allowed'
      ? 'Microphone permission was denied.'
      : `Speech error: ${event.error}.`;
    setStatus('Error', message, 'error');
  };
  recognition.onend = () => { if (listening) stopListening(); };
  supportNote.textContent = 'Voice recognition supported in this browser. You can also type any command below.';
} else {
  micBtn.disabled = true;
  setStatus('Text mode', 'Voice recognition is unavailable — type a command below.', 'idle');
  supportNote.textContent = 'This browser does not support the Web Speech API. Typed commands still work.';
}

micBtn.addEventListener('click', () => { listening ? stopListening() : startListening(); });
textForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = textCommand.value;
  if (!value.trim()) return;
  respond(value);
  textCommand.value = '';
});
clearBtn.addEventListener('click', () => { logEl.innerHTML = ''; logLine('Log cleared.', 'system'); });
QUICK.forEach((command) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.textContent = command;
  chip.addEventListener('click', () => respond(command));
  commandChips.appendChild(chip);
});
