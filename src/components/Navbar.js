export function Navbar() {
  const nav = document.createElement('nav');
  nav.className = 'w-full flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md';

  nav.innerHTML = `
    <h1 class="text-xl font-bold text-blue-700 dark:text-blue-400">Vestora</h1>
    <div id="dark-toggle"></div>
  `;
  return nav;
}
