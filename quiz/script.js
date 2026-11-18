const QUESTIONS = [
  {
    question: 'Which HTML element is used for the largest page heading?',
    options: ['<heading>', '<h1>', '<header>', '<title>'],
    answer: 1,
    explanation: '<h1> is the top-level heading. <header> is a structural element, not a heading.'
  },
  {
    question: 'In CSS, which property changes the color of text?',
    options: ['background-color', 'font-color', 'color', 'text-color'],
    answer: 2,
    explanation: 'The color property sets the foreground (text) color. background-color sets the fill behind it.'
  },
  {
    question: 'Which JavaScript keyword declares a block-scoped variable?',
    options: ['var', 'let', 'static', 'global'],
    answer: 1,
    explanation: 'let and const are block-scoped. var is function-scoped.'
  },
  {
    question: 'What does the CSS box-sizing: border-box rule include in an element width?',
    options: ['Content only', 'Content and padding', 'Content, padding and border', 'Content, padding, border and margin'],
    answer: 2,
    explanation: 'border-box makes width include content, padding and border — margin is still outside.'
  },
  {
    question: 'Which method adds an element to the end of a JavaScript array?',
    options: ['push()', 'pop()', 'shift()', 'unshift()'],
    answer: 0,
    explanation: 'push() appends to the end. pop() removes from the end; shift/unshift work at the start.'
  }
];

const $ = (id) => document.getElementById(id);
let index = 0;
let score = 0;
let answered = false;

function paintBest() {
  const best = Number(localStorage.getItem('eskonworks-quiz-best')) || 0;
  $('best-score').textContent = best ? `Best: ${best} / ${QUESTIONS.length}` : 'Best: —';
}

function render() {
  const q = QUESTIONS[index];
  answered = false;
  $('question-count').textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
  $('quiz-progress').style.width = `${(index / QUESTIONS.length) * 100}%`;
  $('question').textContent = q.question;
  $('feedback').hidden = true;
  $('nextBtn').disabled = true;
  $('nextBtn').textContent = index === QUESTIONS.length - 1 ? 'See results →' : 'Next question →';

  const choices = $('choices');
  choices.innerHTML = '';
  q.options.forEach((option, optionIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = option;
    button.addEventListener('click', () => answer(optionIndex));
    choices.appendChild(button);
  });
}

function answer(optionIndex) {
  if (answered) return;
  answered = true;

  const q = QUESTIONS[index];
  const correct = optionIndex === q.answer;
  if (correct) score++;

  [...$('choices').children].forEach((button, i) => {
    button.disabled = true;
    if (i === q.answer) button.classList.add('correct');
    if (i === optionIndex && !correct) button.classList.add('wrong');
  });

  const feedback = $('feedback');
  feedback.hidden = false;
  feedback.textContent = `${correct ? '✓ Correct. ' : '✗ Not quite. '}${q.explanation}`;
  $('nextBtn').disabled = false;
}

function showResults() {
  $('quiz-panel').hidden = true;
  $('result-panel').hidden = false;
  $('result-score').textContent = `${score} / ${QUESTIONS.length}`;
  $('result-title').textContent = score === QUESTIONS.length ? 'Perfect score!' : score >= 3 ? 'Well done!' : 'Keep practicing!';
  $('result-detail').textContent = score === QUESTIONS.length
    ? 'You know your way around the web platform.'
    : `You got ${Math.round((score / QUESTIONS.length) * 100)}% correct. Try again to beat your best.`;

  const best = Number(localStorage.getItem('eskonworks-quiz-best')) || 0;
  if (score > best) localStorage.setItem('eskonworks-quiz-best', String(score));
  paintBest();
}

function restart() {
  index = 0;
  score = 0;
  $('quiz-panel').hidden = false;
  $('result-panel').hidden = true;
  render();
}

$('nextBtn').addEventListener('click', () => {
  if (index === QUESTIONS.length - 1) {
    showResults();
  } else {
    index++;
    render();
  }
});
$('restartBtn').addEventListener('click', restart);

paintBest();
render();
