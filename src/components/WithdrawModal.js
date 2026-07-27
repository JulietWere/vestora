// src/components/WithdrawModal.js
import { withdraw } from '../components/api.js'; // adjust path
import axios from 'axios';

export function WithdrawModal({ userBalance = 0, onSuccess }) {
  // --- Overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto';

  // --- Modal ---
  const modal = document.createElement('div');
  modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4 p-6 relative';

  // --- Close Button ---
  const closeBtn = document.createElement('button');
  closeBtn.innerText = '×';
  closeBtn.className = 'absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-2xl font-bold';
  closeBtn.addEventListener('click', () => overlay.remove());
  modal.appendChild(closeBtn);

  // --- Title ---
  const title = document.createElement('h2');
  title.innerText = 'Withdraw Funds';
  title.className = 'text-xl font-bold text-gray-800 dark:text-gray-100';
  modal.appendChild(title);

  // --- Available Balance ---
  const balanceDisplay = document.createElement('div');
  balanceDisplay.className = 'p-2 bg-gray-100 dark:bg-gray-700 rounded shadow text-gray-800 dark:text-gray-100 font-bold';
  balanceDisplay.innerText = `Available Balance: KES ${userBalance.toLocaleString()}`;
  modal.appendChild(balanceDisplay);

  // --- Form Fields ---
  const form = document.createElement('div');
  form.className = 'flex flex-col gap-2';

  const fullNameInput = document.createElement('input');
  fullNameInput.placeholder = 'Full Name';
  fullNameInput.className = 'p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100';
  form.appendChild(fullNameInput);

  const mpesaNumberInput = document.createElement('input');
  mpesaNumberInput.placeholder = 'M-PESA Number';
  mpesaNumberInput.className = 'p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100';
  form.appendChild(mpesaNumberInput);

  const amountInput = document.createElement('input');
  amountInput.placeholder = 'Amount';
  amountInput.type = 'number';
  amountInput.className = 'p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100';
  form.appendChild(amountInput);

  modal.appendChild(form);

  // --- Save Details Button ---
  const saveBtn = document.createElement('button');
  saveBtn.innerText = 'Save Details';
  saveBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow transition';
  saveBtn.addEventListener('click', () => {
    if (!fullNameInput.value.trim() || !mpesaNumberInput.value.trim()) {
      return showToast('Enter both name and M-PESA number before saving!');
    }
        const user = JSON.parse(localStorage.getItem("user"));

localStorage.setItem(
  `withdrawFullName_${user._id}`,
  fullNameInput.value.trim()
);

localStorage.setItem(
  `withdrawMpesaNumber_${user._id}`,
  mpesaNumberInput.value.trim()
);
    showToast('Details saved! They will be pre-filled next time.');
  });
  modal.appendChild(saveBtn);

  // --- Prefill Saved Details ---
   const user = JSON.parse(localStorage.getItem("user"));

const savedName = localStorage.getItem(
  `withdrawFullName_${user._id}`
);

const savedMpesa = localStorage.getItem(
  `withdrawMpesaNumber_${user._id}`
);

if (savedName) fullNameInput.value = savedName;
if (savedMpesa) mpesaNumberInput.value = savedMpesa;
 
  // --- Submit Button ---
  const submitBtn = document.createElement('button');
  submitBtn.innerText = 'Withdraw';
  submitBtn.className = 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow transition disabled:opacity-50 disabled:cursor-not-allowed';
  modal.appendChild(submitBtn);

  // --- Toast ---
  const toast = document.createElement('div');
  toast.className = 'mt-2 bg-green-600 text-white px-4 py-2 rounded shadow opacity-0 transition-opacity duration-300 flex items-center gap-2';
  const toastMsg = document.createElement('span');
  toast.appendChild(toastMsg);
  modal.appendChild(toast);

  function showToast(msg) {
    toastMsg.innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
    }, 2000);
  }

 

  // --- Submit Withdrawal ---
  submitBtn.addEventListener('click', async () => {
    const name = fullNameInput.value.trim();
    const mpesaNo = mpesaNumberInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // --- Validations ---
    if (!name) return showToast('Enter full name!');
    if (!mpesaNo || !/^\d{9,12}$/.test(mpesaNo)) return showToast('Enter valid M-PESA number!');
    if (!amount || amount <= 0) return showToast('Enter a valid amount!');
    if (amount < 100) return showToast('Minimum withdrawal is KES 100!');
    if (amount > userBalance) return showToast('Insufficient balance!');

    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    try {
      const res = await withdraw({ amount, fullName: name, mpesaNumber: mpesaNo });

      if (res.success) {
        showToast(`Withdrawal of KES ${amount.toLocaleString()} submitted! Waiting for admin approval.`);
        amountInput.value = '';
        
      
        if (onSuccess) onSuccess(); // update wallet balance in parent
      } else {
        showToast(res.message || 'Failed to submit withdrawal.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      showToast(err.message || 'Failed to submit withdrawal.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Withdraw';
    }
  });

  overlay.appendChild(modal);
  return overlay;
}