const form = document.getElementById('loginForm');
const email = document.getElementById('email');
const password = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const toggle = document.getElementById('togglePassword');
const success = document.getElementById('success');

function setError(input, target, message) {
  target.textContent = message;
  input.classList.toggle('invalid', Boolean(message));
  return !message;
}

toggle.addEventListener('click', () => {
  const showing = password.type === 'text';
  password.type = showing ? 'password' : 'text';
  toggle.textContent = showing ? 'Show' : 'Hide';
  toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
});

email.addEventListener('input', () => setError(email, emailError, ''));
password.addEventListener('input', () => setError(password, passwordError, ''));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  success.hidden = true;

  const emailOk = setError(
    email,
    emailError,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Enter a valid email address.'
  );
  const passwordOk = setError(
    password,
    passwordError,
    password.value.length >= 8 ? '' : 'Password must be at least 8 characters.'
  );

  if (emailOk && passwordOk) {
    success.hidden = false;
  }
});
