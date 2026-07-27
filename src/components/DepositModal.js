// src/components/DepositModal.js
import { parseMpesaMessage } from './mpesaParser.js';
import { fetchTransactions, fetchPortfolio } from "./api.js";
import { io } from "socket.io-client";

function showToast(message) {
  alert(message);
}

function formatKES(amount) {
  return `KES ${Number(amount).toLocaleString()}`;
}

async function loadHistory() {
  try {
    await fetchTransactions();
  } catch (err) {
    console.error("Failed to refresh transactions:", err);
  }
}

export function DepositModal({ onSuccess }) {
  const socket = io("http://localhost:5000");

  // --- Overlay and modal setup ---
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 overflow-auto";

  const modal = document.createElement("div");
  modal.className = "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4 p-4 relative max-h-[80vh] overflow-y-auto";

  // --- Close button ---
  const closeBtn = document.createElement("button");
  closeBtn.innerText = "×";
  closeBtn.className = "absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-2xl font-bold";
  closeBtn.addEventListener("click", () => overlay.remove());
  modal.appendChild(closeBtn);

  // --- Title ---
  const title = document.createElement("h2");
  title.innerText = "Deposit via M-PESA";
  title.className = "text-xl font-bold text-gray-800 dark:text-gray-100";
  modal.appendChild(title);

  // --- M-PESA account info ---
  const mpesaWrapper = document.createElement("div");
  mpesaWrapper.className = "flex flex-col gap-2";

  const mpesaText = document.createElement("p");
  mpesaText.innerText = "Send money to:";
  mpesaText.className = "text-gray-800 dark:text-gray-100";
  mpesaWrapper.appendChild(mpesaText);

  const numberWrapper = document.createElement("div");
  numberWrapper.className = "flex gap-2 items-center";

  const mpesaNumber = document.createElement("span");
  mpesaNumber.innerText = "0793607223"; // your account
  mpesaNumber.className = "font-bold text-blue-600 dark:text-blue-400 underline cursor-pointer";

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy";
  copyBtn.className = "px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(mpesaNumber.innerText);
    showToast("M-PESA number copied!");
  });

  numberWrapper.appendChild(mpesaNumber);
  numberWrapper.appendChild(copyBtn);
  mpesaWrapper.appendChild(numberWrapper);

  const mpesaNote = document.createElement("p");
  mpesaNote.innerText = "Your deposit will be approved by admin before reflecting.";
  mpesaNote.className = "text-sm text-gray-600 dark:text-gray-300";
  mpesaWrapper.appendChild(mpesaNote);

  modal.appendChild(mpesaWrapper);

  // --- Amount selection ---
  const amounts = [1200, 2400, 6500, 9700];
  const amountWrapper = document.createElement("div");
  amountWrapper.className = "flex flex-col gap-2 mt-2";

  amounts.forEach((amt, idx) => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "depositAmount";
    radio.value = amt;
    if (idx === 0) radio.checked = true;

    const span = document.createElement("span");
    span.innerText = `KES ${Number(amt).toLocaleString()}`;

    label.appendChild(radio);
    label.appendChild(span);
    amountWrapper.appendChild(label);
  });
  modal.appendChild(amountWrapper);

  // --- M-PESA message input ---
  const msgLabel = document.createElement("label");
  msgLabel.innerText = "Paste M-PESA confirmation message:";
  msgLabel.className = "text-gray-700 dark:text-gray-300 text-sm mt-2";
  modal.appendChild(msgLabel);

  const msgInput = document.createElement("textarea");
  msgInput.placeholder = "Paste your M-PESA message here";
  msgInput.className = "p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full resize-none";
  msgInput.rows = 3;
  modal.appendChild(msgInput);

  // --- Highlighted preview ---
  const highlightedPreview = document.createElement("div");
  highlightedPreview.className = "p-2 border rounded bg-yellow-100 dark:bg-yellow-700 text-gray-800 dark:text-gray-100 min-h-[40px] break-words";
  modal.appendChild(highlightedPreview);

  msgInput.addEventListener("input", () => {
    const text = msgInput.value;
    const match = text.match(/\d{3,}/);
    if (match) {
      const amount = match[0];
      const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      highlightedPreview.innerHTML = escapedText.replace(
        new RegExp(amount, "g"),
        `<span class="bg-yellow-300 dark:bg-yellow-500 font-bold">${amount}</span>`
      );
    } else highlightedPreview.innerText = text;
  });

  // --- Deposit button ---
  const submitBtn = document.createElement("button");
  submitBtn.innerText = "Deposit";
  submitBtn.className = "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow transition disabled:opacity-50 disabled:cursor-not-allowed";
  modal.appendChild(submitBtn);



  // --- Submit deposit handler ---
  submitBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    console.log("TOKEN FROM LOCALSTORAGE:", token);
    if (!token) return showToast("No user logged in");

    const selected = modal.querySelector('input[name="depositAmount"]:checked');
    const value = Number(selected.value);
    const sms = msgInput.value.trim();

    if (!sms) return showToast("Paste M-PESA message");
    if (isNaN(value) || value <= 0) return showToast("Select a valid amount!");

    const parsed = parseMpesaMessage(sms);
    if (!parsed.amount || !/confirmed/i.test(sms)) return showToast("Invalid M-PESA message");
    if (parsed.amount !== value) return showToast(`Amount mismatch! Selected ${formatKES(value)}, but SMS shows ${formatKES(parsed.amount)}`);

    // STK Push simulation
    showToast(`STK Push received for ${formatKES(value)} ✅`);
    submitBtn.disabled = true;

    try {
      const res = await fetch("http://localhost:5000/api/transactions/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ amount: value, mpesaMessage: sms })
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || "Failed to submit deposit");

      await loadHistory();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      showToast("Failed to submit deposit");
      submitBtn.disabled = false;
    }
  });

  // --- Real-time update after admin approval ---
  socket.on("depositApproved", async (tx) => {
    const loggedUser = localStorage.getItem("username");
    if (tx.userName === loggedUser) {
      showToast(`Deposit of ${formatKES(tx.amount)} approved ✅`);
      await loadHistory();

      // Update wallet balance
      const portfolio = await fetchPortfolio();
      const balEl = document.getElementById("balance");
      if (balEl) balEl.innerText = formatKES(portfolio.balance);
    }
  });

  

  overlay.appendChild(modal);
  return overlay;
}