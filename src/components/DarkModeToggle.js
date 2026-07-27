export function DarkModeToggle() {
  const btn = document.createElement('button');
  btn.className = 'px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600';
  btn.innerText = 'Toggle Dark Mode';

  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  return btn;
}
