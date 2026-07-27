// src/components/AboutUsModal.js
export function AboutUsModal(closeCallback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto';

  const modal = document.createElement('div');
  modal.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4 p-6 relative';

  // --- Close button ---
  const closeBtn = document.createElement('button');
  closeBtn.innerText = '×';
  closeBtn.className = 'absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-2xl font-bold';
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    if (closeCallback) closeCallback();
  });
  modal.appendChild(closeBtn);

  // --- Title ---
  const title = document.createElement('h2');
  title.innerText = 'About Vestora';
  title.className = 'text-2xl font-bold text-gray-800 dark:text-gray-100';
  modal.appendChild(title);

  // --- Content ---
  const content = document.createElement('div');
  content.className = 'flex flex-col gap-3 text-gray-700 dark:text-gray-200';
  content.innerHTML = `
    <p>Welcome to <strong>Vestora</strong> – your trusted investment platform! 
    We empower users to manage investments, track returns, and grow wealth efficiently.</p>

    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Our Mission</h3>
    <p>To provide a transparent, secure, and user-friendly platform that enables financial growth for everyone.</p>

    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Our Vision</h3>
    <p>To be the leading digital investment platform in Africa, fostering wealth creation and financial literacy.</p>

    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Contact Us</h3>
    <p>Email: support@vestora.com<br>Phone: 0793607223</p>
  `;
  modal.appendChild(content);

  overlay.appendChild(modal);
  return overlay;
}
