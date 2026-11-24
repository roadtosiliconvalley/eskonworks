const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
const toast = document.getElementById('toast');

menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

document.querySelectorAll('.faq-item button').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const open = item.classList.toggle('open');
    button.querySelector('span').textContent = open ? '−' : '+';
  });
});

let toastTimer = null;
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('[data-plan]').forEach((button) => {
  button.addEventListener('click', () => notify(`${button.dataset.plan} plan selected — demo only, no payment taken.`));
});
