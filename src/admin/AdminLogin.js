// src/admin/AdminLogin.js
import { AdminDashboard } from './AdminDashboard.js';
import axios from 'axios';

export function AdminLogin() {
  const container = document.createElement('div');
  container.className =
    'min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4';

  const card = document.createElement('div');
  card.className =
    'bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-sm flex flex-col gap-4';

  const title = document.createElement('h2');
  title.innerText = 'Admin Login';
  title.className = 'text-xl font-bold text-center';
  card.appendChild(title);

  // Username
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Username';
  usernameInput.className =
    'p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full';
  card.appendChild(usernameInput);

  // Password
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = 'Password';
  passwordInput.className =
    'p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full';
  card.appendChild(passwordInput);

  // Login button
  const loginBtn = document.createElement('button');
  loginBtn.innerText = 'Login';
  loginBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
  card.appendChild(loginBtn);

  // Toast
  const toast = document.createElement('div');
  toast.className =
    'mt-2 bg-red-600 text-white px-4 py-2 rounded shadow opacity-0 transition-opacity duration-300 text-center';
  card.appendChild(toast);

  function showToast(msg) {
    toast.innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
    }, 2000);
  }

  // ------------------- Login Handler -------------------
  loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) return showToast('Enter username and password!');

       try {
  // Call backend login endpoint
  const res = await axios.post('https://vestora-backend-xrhn.onrender.com/api/admin/login', {
    username,
    password
  });

      const { token, admin } = res.data;

      // Store token and username locally if needed
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUsername', admin.username);

      // Show dashboard
      container.innerHTML = '';
      container.appendChild(await AdminDashboard({ token, admin }));

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Login failed. Check backend.';
      showToast(msg);
    }
  });

  container.appendChild(card);
  return container;
}
