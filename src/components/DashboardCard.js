export function DashboardCard(title, value) {
  const card = document.createElement('div');
  card.className = 'p-6 bg-white dark:bg-gray-700 shadow rounded-lg flex flex-col justify-between';
  
  card.innerHTML = `
    <h2 class="text-lg font-semibold dark:text-gray-200">${title}</h2>
    <p class="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">${value}</p>
  `;

  return card;
}
