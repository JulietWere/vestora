
import { DepositModal } from '../components/DepositModal.js';
import { WithdrawModal } from '../components/WithdrawModal.js';
import { fetchPortfolio, fetchTransactions } from '../services/api.js';

/**
 * Home Page
 * - Shows welcome message
 * - Shows real-time portfolio data
 * - Opens Deposit & Withdraw modals
 * - Displays transaction history
 */
export function Home(container, user) {
  container.innerHTML = '';

  // ------------------------
  // Header
  // ------------------------
  const header = document.createElement('div');
  header.className = 'flex flex-col items-center gap-2 mb-6';

  header.innerHTML = `
    <h1 class="text-2xl font-bold">Welcome to Vestora</h1>
    <p class="text-gray-500">Hello, ${user.name}</p>
  `;

  // ------------------------
  // Portfolio Summary
  // ------------------------
  const summary = document.createElement('div');
  summary.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6';

  const portfolioCard = (title, id, icon) => `
    <div class="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
      <div class="text-xl mb-1">${icon}</div>
      <div class="text-gray-500">${title}</div>
      <div id="${id}" class="text-xl font-bold">KES 0</div>
    </div>
  `;

  summary.innerHTML = `
    ${portfolioCard('Portfolio Value', 'portfolioValue', '📊')}
    ${portfolioCard('Active Investments', 'activeInvestments', '📈')}
    ${portfolioCard('Total Returns', 'totalReturns', '💰')}
  `;

  // ------------------------
  // Action Buttons
  // ------------------------
  const actions = document.createElement('div');
  actions.className = 'flex justify-center gap-4 mb-6';

  const depositBtn = document.createElement('button');
  depositBtn.className =
    'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded';
  depositBtn.innerHTML = '💵 Deposit';

  depositBtn.onclick = () => {
    document.body.appendChild(
      DepositModal(refreshDashboard)
    );
  };

  const withdrawBtn = document.createElement('button');
  withdrawBtn.className =
    'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded';
  withdrawBtn.innerHTML = '💸 Withdraw';

  withdrawBtn.onclick = () => {
    document.body.appendChild(
      WithdrawModal(refreshDashboard)
    );
  };

  actions.append(depositBtn, withdrawBtn);

  // ------------------------
  // Transactions Section
  // ------------------------
  const txSection = document.createElement('div');
  txSection.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow';

  txSection.innerHTML = `
    <h2 class="text-lg font-bold mb-3">Transaction History</h2>
    <div id="transactionsList" class="space-y-2 text-sm"></div>
  `;

  // ------------------------
  // Append All
  // ------------------------
  container.append(header, summary, actions, txSection);

  // ------------------------
  // Real-time Data Logic
  // ------------------------
  const portfolioValueEl = document.getElementById('portfolioValue');
  const activeInvestmentsEl = document.getElementById('activeInvestments');
  const totalReturnsEl = document.getElementById('totalReturns');
  const transactionsList = document.getElementById('transactionsList');

  async function refreshDashboard() {
    try {
      // Fetch real data from backend
      const portfolio = await fetchPortfolio(user.token);
      const transactions = await fetchTransactions(user.token);

      // Update summary
      portfolioValueEl.innerText = `KES ${(
        portfolio.balance +
        portfolio.invested +
        portfolio.returns
      ).toLocaleString()}`;

      activeInvestmentsEl.innerText = `KES ${portfolio.invested.toLocaleString()}`;
      totalReturnsEl.innerText = `KES ${portfolio.returns.toLocaleString()}`;

      // Render transactions
      transactionsList.innerHTML = '';

      if (!transactions.length) {
        transactionsList.innerHTML =
          '<div class="text-gray-400">No transactions yet</div>';
        return;
      }

      transactions.forEach(tx => {
        const row = document.createElement('div');
        row.className =
          'flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1';

        const statusColor =
          tx.status === 'Approved'
            ? 'text-green-600'
            : tx.status === 'Rejected'
            ? 'text-red-600'
            : 'text-yellow-600';

        row.innerHTML = `
          <span>${tx.type} – KES ${tx.amount.toLocaleString()}</span>
          <span class="${statusColor}">${tx.status}</span>
        `;

        transactionsList.appendChild(row);
      });
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
    }
  }

  // Initial load + real-time refresh
  refreshDashboard();
  setInterval(refreshDashboard, 5000);
}
