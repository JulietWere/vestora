// src/components/InviteFriends.js
export function InviteFriends(container, user) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'flex flex-col items-center gap-2 mb-6';
  header.innerHTML = `
    <h1 class="text-2xl font-bold">Invite Friends</h1>
    <p class="text-gray-500">Share your referral code with friends!</p>
  `;

  const referralSection = document.createElement('div');
  referralSection.className = 'text-center p-4 bg-white dark:bg-gray-700 rounded shadow';
  referralSection.innerHTML = `
    <p>Your referral code: <b id="myCode">${user.referralCode || 'N/A'}</b></p>
    <button id="copyBtn" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Copy</button>
  `;

  container.append(header, referralSection);

  const copyBtn = document.getElementById('copyBtn');
  const myCodeEl = document.getElementById('myCode');

  copyBtn.addEventListener('click', () => {
    if (myCodeEl.textContent !== 'N/A') {
      navigator.clipboard.writeText(myCodeEl.textContent);
      alert('Referral code copied!');
    }
  });
}
