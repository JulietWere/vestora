export function TransactionsTable() {
  const tableContainer = document.createElement('div');
  tableContainer.className = 'mt-8 overflow-x-auto bg-white dark:bg-gray-700 shadow rounded p-4';

  tableContainer.innerHTML = `
    <h2 class="text-lg font-semibold mb-4 dark:text-gray-200">Recent Transactions</h2>
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-100 dark:bg-gray-600">
          <th class="p-2">Date</th>
          <th class="p-2">Type</th> 
          <th class="p-2">Amount</th>
          <th class="p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b dark:border-gray-500">
          <td class="p-2">2026-01-10</td>
          <td class="p-2">Deposit</td>
          <td class="p-2">$500</td>
          <td class="p-2 text-green-600 dark:text-green-400">Completed</td>
        </tr>
        <tr class="border-b dark:border-gray-500">
          <td class="p-2">2026-01-12</td>
          <td class="p-2">Investment</td>
          <td class="p-2">$1,200</td>
          <td class="p-2 text-yellow-500 dark:text-yellow-400">Pending</td>
        </tr>
        <tr class="border-b dark:border-gray-500">
          <td class="p-2">2026-01-15</td>
          <td class="p-2">Withdrawal</td>
          <td class="p-2">$300</td>
          <td class="p-2 text-red-600 dark:text-red-400">Failed</td>
        </tr>
      </tbody>
    </table>
  `;
  return tableContainer;
}
