import axios from 'axios';

export function ClaimModal(dashboard, table, activeInvestments) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';

  const modal = document.createElement('div');
  modal.className = 'bg-white dark:bg-gray-800 rounded shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto';
  overlay.appendChild(modal);

  modal.innerHTML = `
    <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Claim Daily Earnings</h3>
    <div id="claimsContainer" class="flex flex-col gap-4 mb-4"></div>
    <button id="backBtn" class="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 w-full">Back</button>
  `;

  const claimsContainer = modal.querySelector('#claimsContainer');
  const backBtn = modal.querySelector('#backBtn');

  function getBalanceCard() {
    return dashboard.children[0].querySelector('p'); // Available Balance
  }

  function getReturnsCard() {
    return dashboard.children[2].querySelector('p'); // Returns
  }

  function formatKES(amount) {
    return `KES ${amount.toLocaleString()}`;
  }

  // -----------------------------
  // Render all active investments
  // -----------------------------
  function renderClaims() {
    claimsContainer.innerHTML = '';
    const now = new Date();

    activeInvestments.forEach(inv => {
      const lastClaim = inv.lastClaimDate ? new Date(inv.lastClaimDate) : null;
      const elapsed = lastClaim ? now - lastClaim : 24 * 60 * 60 * 1000; // allow claim if never claimed
      const canClaim = elapsed >= 24 * 60 * 60 * 1000;

      const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
      const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const card = document.createElement('div');
      card.className = 'claim-card bg-white dark:bg-gray-700 p-4 rounded shadow flex flex-col items-center text-center';
      card.innerHTML = `
        <h2 class="text-lg font-semibold mb-1">${inv.name}</h2>
        <p class="mb-1">Daily Income: ${formatKES(inv.dailyReturn)}</p>
        <p class="mb-1">Last Claimed: ${lastClaim ? lastClaim.toLocaleString() : 'Never'}</p>
        <p class="mb-1">Next Claim: ${canClaim ? 'Available Now' : `${hrs}h ${mins}m ${secs}s`}</p>
        <button class="claim-btn px-4 py-2 rounded font-semibold text-white hover:opacity-90 transition w-full ${canClaim ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}" ${canClaim ? '' : 'disabled'}>Claim</button>
      `;

      const claimBtn = card.querySelector('.claim-btn');

      // -----------------------------
      // Claim button click
      // -----------------------------
      claimBtn.addEventListener('click', async () => {
        if (!canClaim) return;

        // Update dashboard balance
        const balanceCard = getBalanceCard();
        const returnsCard = getReturnsCard();
        let currentBalance = parseInt(balanceCard.innerText.replace(/KES|,/g, '')) || 0;
        let currentReturns = parseInt(returnsCard.innerText.replace(/KES|,/g, '')) || 0;

        balanceCard.innerText = formatKES(currentBalance + inv.dailyReturn);
        returnsCard.innerText = formatKES(currentReturns + inv.dailyReturn);

        // Update lastClaimDate
        inv.lastClaimDate = new Date().toISOString();

        // Add transaction row
        const tableBody = table.querySelector('tbody');
        const nowRow = new Date();
        const newRow = document.createElement('tr');
        newRow.className = 'border-b dark:border-gray-500';
        newRow.innerHTML = `
          <td class="p-2">${nowRow.toISOString().split('T')[0]}</td>
          <td class="p-2">Claim - ${inv.name}</td>
          <td class="p-2">${formatKES(inv.dailyReturn)}</td>
          <td class="p-2 text-green-600 dark:text-green-400">Completed</td>
        `;
        tableBody.prepend(newRow);
        if (tableBody.children.length > 10) tableBody.removeChild(tableBody.lastChild);

        // Disable button immediately
        claimBtn.disabled = true;
        claimBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        claimBtn.classList.add('bg-gray-400', 'cursor-not-allowed');

        // Save to backend
        try {
          await axios.post('http://localhost:3000/transactions', {
            date: nowRow.toISOString().split('T')[0],
            type: `Claim - ${inv.name}`,
            amount: inv.dailyReturn,
            status: 'Completed'
          });
        } catch (err) {
          console.error('Failed to save claim to API', err);
        }
      });

      claimsContainer.appendChild(card);
    });
  }

  // -----------------------------
  // Initial render
  // -----------------------------
  renderClaims();

  // -----------------------------
  // Auto-refresh countdown every second
  // -----------------------------
  const interval = setInterval(renderClaims, 1000);

  // -----------------------------
  // Back button
  // -----------------------------
  backBtn.addEventListener('click', () => {
    overlay.remove();
    clearInterval(interval);
  });

  overlay.addEventListener('remove', () => clearInterval(interval));

  return overlay;
}
