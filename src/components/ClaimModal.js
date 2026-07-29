// ClaimModal.js
import axios from 'axios';

export function ClaimModal(dashboard, table, activeInvestments, user) {
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
    return dashboard.children[0].querySelector('p');
  }

  function getReturnsCard() {
    return dashboard.children[2].querySelector('p');
  }

  function formatKES(amount) {
    return `KES ${amount.toLocaleString()}`;
  }

  // ---------------------------
  // Countdown timer function
  // ---------------------------
  function startInvestmentTimer(inv, timerEl, claimBtn = null) {
    function updateTimer() {
      const now = new Date();
      const lastClaim = new Date(inv.lastClaimDate);
      const elapsed = now - lastClaim;
      const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

      if (remainingMs <= 0) {
        timerEl.innerText = `Next Claim: Available Now`;

        if (claimBtn) {
          claimBtn.disabled = false;
          claimBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
          claimBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }

        clearInterval(interval);
      } else {
        const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        timerEl.innerText = `Next Claim: ${hrs}h ${mins}m ${secs}s`;
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  }

  // ---------------------------
  // Render investment cards
  // ---------------------------
  function renderClaims() {
    claimsContainer.innerHTML = '';
    const now = new Date();

    activeInvestments.forEach(inv => {
      const lastClaim = inv.lastClaimDate ? new Date(inv.lastClaimDate) : null;
      const elapsed = lastClaim ? now - lastClaim : 24 * 60 * 60 * 1000;
      const canClaim = elapsed >= 24 * 60 * 60 * 1000;

      const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

      const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const card = document.createElement('div');
      card.className = 'claim-card bg-white dark:bg-gray-700 p-4 rounded shadow flex flex-col items-center text-center';

      card.innerHTML = `
        <h2 class="text-lg font-semibold mb-1">${inv.name}</h2>
        <p class="mb-1">Daily Income: ${formatKES(inv.daily)}</p>
        <p class="mb-1">Last Claimed: ${lastClaim ? lastClaim.toLocaleString() : 'Never'}</p>
        <p class="mb-1 timer">${canClaim ? 'Available Now' : `${hrs}h ${mins}m ${secs}s`}</p>
        <button class="claim-btn px-4 py-2 rounded font-semibold text-white hover:opacity-90 transition w-full ${canClaim ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}" ${canClaim ? '' : 'disabled'}>Claim</button>
      `;

      const claimBtn = card.querySelector('.claim-btn');
      const timerEl = card.querySelector('.timer');

      startInvestmentTimer(inv, timerEl, claimBtn);

      // ✅ FIXED CLAIM LOGIC (SECURE VERSION)
      claimBtn.addEventListener('click', async () => {
        if (!canClaim) return;

         try {
  const res = await axios.put(
    `https://vestora-backend-xrhn.onrender.com/api/investments/claim/${inv._id}`
  );

          alert(res.data.message || 'Claim successful');

          location.reload();

        } catch (err) {
          console.error('Claim failed', err);
          alert(err.response?.data?.message || 'Claim failed');
        }
      });

      claimsContainer.appendChild(card);
    });
  }

  renderClaims();
  const interval = setInterval(renderClaims, 1000);

  backBtn.addEventListener('click', () => {
    overlay.remove();
    clearInterval(interval);
  });

  overlay.addEventListener('remove', () => clearInterval(interval));

  return overlay;
}