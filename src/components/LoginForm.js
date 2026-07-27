// src/components/LoginForm.js
import { loginUser } from './api.js';

export function LoginForm(onLogin) {
  const form = document.createElement('form');
  form.className =
    'login-form max-w-sm mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow flex flex-col gap-4 relative z-50';

  // ---------- USERNAME ----------
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Username';
  usernameInput.required = true;
  usernameInput.className =
    'w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const usernameError = document.createElement('div');
  usernameError.className = 'text-red-600 dark:text-red-400 text-sm h-5';

  // ---------- PASSWORD ----------
  const passwordWrapper = document.createElement('div');
  passwordWrapper.className = 'relative w-full';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = 'Password';
  passwordInput.required = true;
  passwordInput.className = usernameInput.className + ' pr-16';

  const passwordError = document.createElement('div');
  passwordError.className = 'text-red-600 dark:text-red-400 text-sm h-5';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.innerText = 'Show';
  toggleBtn.className =
    'absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded';
  toggleBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerText = 'Hide';
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerText = 'Show';
    }
  });

  passwordWrapper.append(passwordInput, toggleBtn);

  // ---------- SUBMIT BUTTON ----------
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.innerText = 'Log In';
  submitBtn.className =
    'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow transition-colors duration-200';

  // ---------- APPEND TO FORM ----------
  form.appendChild(usernameInput);
  form.appendChild(usernameError);
  form.appendChild(passwordWrapper);
  form.appendChild(passwordError);
  form.appendChild(submitBtn);

  // ---------- FORM SUBMIT HANDLER ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    usernameError.innerText = '';
    passwordError.innerText = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) return (usernameError.innerText = 'Username required');
    if (!password) return (passwordError.innerText = 'Password required');

    submitBtn.disabled = true;
    submitBtn.innerText = 'Logging in...';

    try {
      const data = await loginUser(username, password);

      if (data?.token && data?.user) {
        // --- Store token and user globally ---
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        window.currentUser = data.user;

        // --- Call the passed in onLogin callback ---
        if (typeof onLogin === 'function') onLogin(data.token, data.user);

        // --- Open deposit modal AFTER login ---
        import('./DepositModal.js').then(({ DepositModal }) => {
          const overlay = DepositModal({
            onSuccess: () => console.log('Deposit completed!')
          });
          document.body.appendChild(overlay);
        });

        // --- Show login success toast ---
        showToast('Login successful');

      } else {
        passwordError.innerText = data?.error || 'Wrong username or password';
      }
    } catch (err) {
      console.error(err);
      passwordError.innerText = 'Login failed';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Log In';
    }
  });

  // ---------- TOAST ----------
  const toast = document.createElement('div');
  toast.className =
    'mt-2 bg-green-600 text-white px-4 py-2 rounded shadow opacity-0 transition-opacity duration-300 flex items-center gap-2 fixed top-5 right-5 z-50';
  const toastMsg = document.createElement('span');
  toast.appendChild(toastMsg);
  document.body.appendChild(toast);

  function showToast(msg) {
    toastMsg.innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
    }, 2000);
  }

  return form;
}