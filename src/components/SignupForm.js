import { registerUser } from './api.js';

export function SignupForm() {
  const form = document.createElement('form');
  form.className =
    'signup-form max-w-sm mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow flex flex-col gap-4 relative z-50';

  // ---------- INPUTS ----------
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Username';
  usernameInput.required = true;
  usernameInput.className =
    'w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500';
  const usernameError = document.createElement('div');
  usernameError.className = 'text-red-600 dark:text-red-400 text-sm h-5';

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
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    toggleBtn.innerText = passwordInput.type === 'password' ? 'Show' : 'Hide';
  });
  passwordWrapper.append(passwordInput, toggleBtn);

  // ---------- REFERRAL CODE ----------
  const referralInput = document.createElement('input');
  referralInput.type = 'text';
  referralInput.placeholder = 'Referral Code';
  referralInput.className = usernameInput.className;
  const referralError = document.createElement('div');
  referralError.className = 'text-red-600 dark:text-red-400 text-sm h-5';

  // Detect referral from URL
  const urlParams = new URLSearchParams(window.location.search);
  const referralCodeFromURL = urlParams.get('ref');
  if (referralCodeFromURL) {
    referralInput.value = referralCodeFromURL;
    referralInput.required = true; 
    referralInput.readOnly = true; 
  }

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.innerText = 'Sign Up';
  submitBtn.className =
    'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow transition-colors duration-200';

  // ---------- APPEND TO FORM ----------
  form.append(
    usernameInput,
    usernameError,
    passwordWrapper,
    passwordError,
    referralInput,
    referralError,
    submitBtn
  );

  // ---------- SUBMIT HANDLER ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    usernameError.innerText = '';
    passwordError.innerText = '';
    referralError.innerText = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const referralCode = referralInput.value.trim() || null;
    const referralLink = !!referralCodeFromURL;

    if (!username) return (usernameError.innerText = 'Username required');
    if (!password) return (passwordError.innerText = 'Password required');
    if (referralLink && !referralCode)
      return (referralError.innerText = 'Referral code required');

    submitBtn.disabled = true;
    submitBtn.innerText = 'Signing up...';

    console.log("SIGNUP PAYLOAD:", { username, password, referralCode, referralLink });

    try {
      const data = await registerUser(username, password, referralCode, referralLink);
      console.log("SIGNUP RESPONSE:", data);

      
          if (data?.message === "User registered successfully!") {
        // ---------- SHOW REFERRAL CODE ----------
        const code = data.referralCode;


        // Remove previous referral display if exists
        const prevRefDisplay = document.getElementById('referral-display');
        if (prevRefDisplay) prevRefDisplay.remove();

        const refDiv = document.createElement('div');
        refDiv.id = 'referral-display';
        refDiv.className = 'mt-4 p-4 bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 rounded';

        refDiv.innerHTML = `
          <p><strong>Signup successful!</strong></p>
          <p>Your referral code is: <strong>${code}</strong></p>
        `;

        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.innerText = 'Copy';
        copyBtn.className =
          'ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(code);
          copyBtn.innerText = 'Copied!';
          setTimeout(() => (copyBtn.innerText = 'Copy'), 1500);
        });

        refDiv.appendChild(copyBtn);
        form.appendChild(refDiv);

        // Optionally reset form
        form.reset();

        // ---------- REDIRECT TO LOGIN AFTER 3 SECONDS ----------
        setTimeout(() => {
          window.location.href = '/login'; // Change to your login page route
        }, 3000);
      } else if (data?.error) {
        // Show backend error clearly
        if (data.error.includes('Referral')) referralError.innerText = data.error;
        else usernameError.innerText = data.error;
      } else {
        usernameError.innerText = 'Signup failed';
      }
    } catch (err) {
      console.error(err);
      passwordError.innerText = 'Signup failed';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sign Up';
    }
  });

  return form;
}

// ---------- DASHBOARD REDIRECT PLACEHOLDER ----------
function startDashboard(token, user) {
  console.log("Redirecting to user dashboard:", user);
}
