import './style.css';
import { Navbar } from './components/Navbar.js';
import { DarkModeToggle } from './components/DarkModeToggle.js';
import { DepositModal } from './components/DepositModal.js';
import { WithdrawModal } from './components/WithdrawModal.js';
import { AuthForms } from './components/AuthForms.js';
import { 
  loginUser, 
  registerUser, 
  fetchPortfolio, 
  fetchTransactions, 
  createInvestment,
  fetchInvestments,
  claimInvestment,
  fetchTeam,
  deposit,
  withdraw
} from './components/api.js';

import { AdminLogin } from './admin/AdminLogin.js';
import { AdminDashboard } from './admin/AdminDashboard.js';
import axios from 'axios';
import { renderTeam } from './pages/TeamPage.js';
import { io } from "socket.io-client";

// main.js - top of file
// ---------------------------
const timers = {};
// ---------------------------


// 1️⃣ Connect to backend socket
window.socket = io("https://vestora-backend-xrhn.onrender.com");



// 3️⃣ Join user-specific socket room
if (window.currentUser?._id) {
  window.socket.emit("joinUserRoom", window.currentUser._id);
}

// Optional: join admin room if current user is admin
if (window.currentUser?.isAdmin === true) {
  console.log("Joining admin room");
  window.socket.emit("joinAdminRoom");
}


// 5️⃣ Function to update balance in the UI

function updateBalanceUI(balance) {
  const el = document.getElementById("balanceDisplay");
  if (el) {
    el.textContent = `Wallet Balance: KES ${Number(balance).toLocaleString()}`;
  }
}
updateBalanceUI(window.currentUser?.balance || 0);



// ------------------- DEPOSIT ATTEMPT NOTIFICATION -------------------
    window.socket.on("depositAttempt", async (deposit) => {
  if (!window.currentUser) return;

  if (String(deposit.user) === String(window.currentUser._id)) {

    const depositTime = deposit.date
      ? new Date(deposit.date).toLocaleString()
      : new Date().toLocaleString();

    alert(
      `💰 M-Pesa Deposit Attempt\n` +
      `User: ${window.currentUser.username}\n` +
      `Amount: KES ${Number(deposit.amount || 0).toLocaleString()}\n` +
      `Status: ${deposit.status || "Pending Approval"}\n` +
      `Time: ${depositTime}`
    );

    const latestTransactions = await fetchTransactions();

    if (typeof updateTransactionsTable === "function") {
      updateTransactionsTable(latestTransactions);
    }

    if (typeof updateDashboard === "function") {
      updateDashboard();
    }
  }
});

// ------------------- WALLET UPDATE -------------------
window.socket.on("walletUpdate", updatedUser => {
  if (!window.currentUser) {
    console.warn("Wallet update ignored — no current user");
    return;
  }

  const currentUserId = window.currentUser._id || window.currentUser.id;

  if (String(updatedUser.userId) === String(currentUserId)) {
    window.currentUser.balance = updatedUser.balance || 0;
    const userBalance = window.currentUser.balance;

    if (balanceDisplay) {
      balanceDisplay.textContent = `Wallet Balance: KES ${userBalance.toLocaleString()}`;
    }
    

    if (typeof updateDashboard === "function") updateDashboard();
    if (typeof updateTransactionsTable === "function") updateTransactionsTable();
  }
});
// ------------------- REFERRAL BONUS UPDATES -------------------
window.socket.on("referralBonusUpdated", (bonus) => {
  if (!window.currentUser) return;

  if (bonus.user === window.currentUser._id) {
    console.log("Referral bonus updated:", bonus);

    // Update your referral bonus UI
    dashboard.updateReferralBonus(bonus);
  }
});


// -------------------
// Expose API to AuthForms
// -------------------
window.loginUser = loginUser;
window.registerUser = registerUser;

// -------------------
// Logout
// -------------------
function logout() {

  localStorage.removeItem("user");
  localStorage.removeItem("token");

  window.currentUser = null;
  window.userInvestments = [];
  transactions = [];

  if (window.socket) {
    window.socket.disconnect();
  }

  location.reload();
}

window.logout = logout;

// -------------------
// Root app
// -------------------
const app = document.getElementById('app');
app.className = 'min-h-screen bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 p-6 text-gray-900 dark:text-gray-100';

// -------------------
// Initialize auth
// -------------------
const auth = AuthForms((token, user) => {
  window.currentUser = user; // 🔴 REQUIRED
  const cleanUser = {
  _id: user._id,
  username: user.username,
  balance: user.balance,
  bonus: user.bonus,
  referralCode: user.referralCode,
  isBlocked: user.isBlocked,
  isAdmin: user.isAdmin,
  token: token
};

localStorage.setItem("user", JSON.stringify(cleanUser));
window.currentUser = cleanUser;

startDashboard(token, cleanUser);
});

app.appendChild(auth);

// -------------------
// State
// -------------------


let userBalance = 0;
let transactions = [];
 let currentTab = "Home";
const activeInvestments = [];
const tabButtons = {};


// -------------------
// Animate numbers
// -------------------
function animateValue(element, start, end, duration = 1000) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    element.innerText = `KES ${Math.floor(start + (end - start) * progress).toLocaleString()}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
  async function loadPortfolioData() {
  const portfolio = await fetchPortfolio();

  activeInvestments.length = 0;
  if (portfolio?.investments) {
    activeInvestments.push(...portfolio.investments);
  }

  transactions = (await fetchTransactions()) || [];
}

async function startDashboard(token, userFromLogin) {
  app.innerHTML = "";
  console.log(
  "TABLE CHECK:",
  document.getElementById("transactionsBody") ? "READY" : "NOT CREATED YET"
);

  let savedUser = JSON.parse(localStorage.getItem("user"));

  // 🔥 Prefer fresh login user, fallback to saved user
  const user = userFromLogin || savedUser;

  if (!user || !user._id) {
    console.error("No valid user found");
    return;
  }

  window.currentUser = user;

  console.log("FINAL USER:", window.currentUser);
  const tabNames = [
  'Home',
  'Transactions',
  'Invest',
  'Claim',
  'Team',
  'Myself'
];

if (user.isAdmin) {
  tabNames.push('Admin');
}

console.log("TAB NAMES:", tabNames);

  // ✅ IMPORTANT: always use backend value, NOT overwritten one
  userBalance = user.balance ?? 0;
  

  // ✅ Save CLEAN user ONLY (never overwrite with partial data)
  localStorage.setItem(
    "user",
    JSON.stringify({
      _id: user._id,
      username: user.username,
      token: user.token,
      balance: user.balance,
      bonus: user.bonus,
      referralCode: user.referralCode,
      isBlocked: user.isBlocked,
      isAdmin: user.isAdmin
    })
  );

  // ✅ Socket join (ONLY ONCE, ONLY WITH VALID ID)
    if (window.socket && user._id) {
  console.log("JOINING ROOM:", user._id);
  window.socket.emit("joinUserRoom", user._id);
}

  // -----------------------
  // Fetch fresh portfolio
  // -----------------------
let portfolio;

try {
  portfolio = await fetchPortfolio();
  
  console.log("PORTFOLIO RESPONSE:", portfolio);

  // ✅ SAVE INVESTMENTS (THIS IS THE MISSING PIECE)
  window.userInvestments = portfolio.investments || [];

  console.log("🔥 SAVED INVESTMENTS:", window.userInvestments);

  if (portfolio?.balance != null) {
    userBalance = portfolio.balance;

    window.currentUser = window.currentUser || {};
    window.currentUser.balance = portfolio.balance;

    localStorage.setItem("user", JSON.stringify(window.currentUser));
  } else {
    console.warn("⚠️ Invalid portfolio response:", portfolio);
  }

} catch (err) {
  console.error("Failed to fetch portfolio", err);

  portfolio = {
    balance: userBalance,
    investments: []
  };

  // ✅ also handle fallback
  window.userInvestments = [];
}

window.socket.off("transactionUpdated"); // 🔥 prevent duplicates

window.socket.on("transactionUpdated", (data) => {
  console.log("🔥 REALTIME UPDATE:", data);

  if (!window.currentUser?._id) return;
  if (String(data.user._id) !== String(window.currentUser._id)) return;

  // ✅ update state
  userBalance = data.newBalance;
  window.currentUser.balance = data.newBalance;

  // ✅ persist
  localStorage.setItem("user", JSON.stringify(window.currentUser));

  // ✅ update UI
  const walletEl = document.getElementById("balanceDisplay");
  if (walletEl) {
    walletEl.textContent = `Wallet Balance: KES ${data.newBalance.toLocaleString()}`;
  }

  console.log("✅ Balance updated to:", data.newBalance);
});

  // --- Navbar ---
  const navbar = Navbar();
  app.appendChild(navbar);

  const toggle = DarkModeToggle();
  document.getElementById('dark-toggle').appendChild(toggle);

  const greeting = document.createElement('span');
  greeting.className = 'ml-4 text-white font-semibold';
  greeting.innerText = `Hello, ${window.currentUser.username}`;
  navbar.appendChild(greeting);

  const clock = document.createElement('span');
  clock.className = 'ml-4 text-white';
  navbar.appendChild(clock);
  setInterval(() => (clock.innerText = new Date().toLocaleTimeString()), 1000);

  // --- Tabs container ---
  const tabs = document.createElement('div');
  tabs.className = 'flex flex-wrap gap-2 mt-4 mb-4';
  app.appendChild(tabs);

  // --- Content container ---
  const content = document.createElement('div');
  content.className = 'w-full flex-1 flex flex-col gap-6';
  app.appendChild(content);

  // --- Balance display ---
  const balanceDisplay = document.createElement('div');
  balanceDisplay.id = 'balanceDisplay';
  balanceDisplay.className = 'text-lg font-bold';
  content.appendChild(balanceDisplay);
  balanceDisplay.textContent = `Wallet Balance: KES ${userBalance.toLocaleString()}`;

  // ============================
  // ✅ REAL-TIME LISTENERS
  // ============================

  // Deposit Attempt (Pending)


  // Deposit Approved
  window.socket.on("depositApproved", (deposit) => {
    if (!window.currentUser?._id) return;
    if (String(deposit.user) === String(window.currentUser._id)) {
      userBalance += Number(deposit.amount || 0);
      window.currentUser.balance = userBalance;
      localStorage.setItem("user", JSON.stringify(window.currentUser)); // persist updated balance

      const walletBalanceEl = document.getElementById("balanceDisplay");
      if (walletBalanceEl) {
        walletBalanceEl.textContent = `Wallet Balance: KES ${userBalance.toLocaleString()}`;
      }

      if (typeof updateDashboard === 'function') updateDashboard();
    }
  });

  

  // Generic Wallet Updates
  window.socket.on("walletUpdate", (data) => {
    if (!window.currentUser?._id) return;
    if (String(data.userId) === String(window.currentUser._id)) {
      userBalance = Number(data.balance || 0);
      window.currentUser.balance = userBalance;
      localStorage.setItem("user", JSON.stringify(window.currentUser)); // persist updated balance

      const walletBalanceEl = document.getElementById("balanceDisplay");
      if (walletBalanceEl) {
        walletBalanceEl.textContent = `Wallet Balance: KES ${userBalance.toLocaleString()}`;
      }

      if (typeof updateDashboard === 'function') updateDashboard();
    }
  });

  // -------------------
  // Global referral bonus listener
  // -------------------
  window.socket.on("referralBonus", (data) => {
    if (!window.currentUser) return;
    if (data.referralCode === window.currentUser.referralCode) {
      const referralEl = document.getElementById('referralValue');
      const currentValue = parseFloat(referralEl.innerText.replace(/[^\d]/g, '')) || 0;
      const newValue = currentValue + data.bonus;
      referralEl.innerText = `KES ${newValue.toLocaleString()}`;
      referralEl.classList.add('pulse');
      setTimeout(() => referralEl.classList.remove('pulse'), 400);

      updateDashboard();
    }
  });

  // --- Summary cards ---
  const summaryCards = document.createElement('div');
  summaryCards.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center';
  summaryCards.innerHTML = `
    <div class="p-4 bg-gradient-to-r from-green-300 to-green-500 rounded shadow flex flex-col items-center">
      <span class="text-2xl">💰</span>
      <p class="mt-2 font-bold">Portfolio Value</p>
      <p id="portfolioValue">KES 0</p>
    </div>
    <div class="p-4 bg-gradient-to-r from-blue-300 to-blue-500 rounded shadow flex flex-col items-center">
      <span class="text-2xl">📊</span>
      <p class="mt-2 font-bold">Investments</p>
      <p id="investmentsValue">0</p>
    </div>
    <div class="p-4 bg-gradient-to-r from-pink-300 to-pink-500 rounded shadow flex flex-col items-center">
      <span class="text-2xl">🎁</span>
      <p class="mt-2 font-bold">Referral Bonus</p>
      <p id="referralValue">KES 0</p>
    </div>
  `;
  content.appendChild(summaryCards);

  // --- Welcome message ---
  const welcome = document.createElement('div');
  welcome.className = 'text-center p-4 bg-white dark:bg-gray-700 rounded shadow';
  welcome.innerHTML = `
    <h2 class="text-xl font-bold">Welcome to Vestora</h2>
    <p>Explore your investments and manage your team easily.</p>
  `;
  content.appendChild(welcome);

  // --- Transactions Table ---
  const transactionsTable = document.createElement('div');
  transactionsTable.className = 'overflow-x-auto';
  transactionsTable.innerHTML = `
    <table class="min-w-full bg-white dark:bg-gray-700 rounded shadow">
      <thead class="bg-gray-200 dark:bg-gray-600">
        <tr>
          <th class="p-2">Date</th>
          <th class="p-2">Type</th>
          <th class="p-2">Amount</th>
          <th class="p-2">Status</th>
        </tr>
      </thead>
      <tbody id="transactionsBody"></tbody>
    </table>
  `;

  const transactionsBody = document.getElementById('transactionsBody');

// ----------------- Update Transactions Table -----------------
  function updateTransactionsTable(transactions = []) {
  console.log("🧾 updateTransactionsTable CALLED");
  console.log("DATA RECEIVED:", transactions);

  const el = document.getElementById("transactionsBody");

  console.log("TABLE DEBUG:", {
    element: el,
    exists: !!el,
    htmlFound: document.body.innerHTML.includes("transactionsBody")
  });

  const tableBody = el;

 
     if (!tableBody) {
  console.log("Transactions table is not currently rendered. Skipping update.");
  return;
}

  tableBody.innerHTML = "";

  if (!Array.isArray(transactions)) return;

  transactions.forEach(tx => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${new Date(tx.createdAt || tx.date).toLocaleString()}</td>
      <td>${tx.type}</td>
      <td>KES ${Number(tx.amount || 0).toLocaleString()}</td>
      <td>${tx.status}</td>
    `;

    tableBody.appendChild(row);
  });
}
  // -------------------
  // Dashboard State
  // -------------------
  let lastPortfolio = 0;
  let lastInvestments = 0;
async function updateDashboardData() {
  try {
    const portfolio = await fetchPortfolio();
    if (!portfolio) throw new Error("Invalid portfolio response");

    // sync balance
    userBalance = Number(portfolio.balance) || 0;
    window.currentUser.balance = userBalance;

    // sync investments
    activeInvestments.length = 0;
    if (Array.isArray(portfolio.investments)) {
      activeInvestments.push(...portfolio.investments);
    }

    // sync transactions
    transactions = (await fetchTransactions()) || [];

    // sync team bonus
      // sync team members
const referralCode = window.currentUser?.referralCode;
const teamMembers = await fetchTeam(referralCode);

// display the logged-in user's referral bonus
const referralEl = document.getElementById("referralValue");
if (referralEl) {
  referralEl.innerText = `KES ${(Number(portfolio.bonus) || 0).toLocaleString()}`;
}

    // update UI
    // update UI
if (typeof updateDashboard === "function") {
  updateDashboard();
}

    if (typeof updateDashboard === "function") {
  updateDashboard();
}

requestAnimationFrame(() => {
  if (currentTab === "Transactions") {
    updateTransactionsTable(transactions);
  }
});

  } catch (err) {
    console.error("Failed to update dashboard data:", err);
  }
}

async function refreshPortfolioUI() {
  try {
    const portfolio = await fetchPortfolio();

    if (!portfolio) return;

    // safe balance
    userBalance = Number(portfolio.balance) || 0;
    window.currentUser.balance = userBalance;

    // safe investments
    activeInvestments.length = 0;

    if (Array.isArray(portfolio.investments)) {
      activeInvestments.push(...portfolio.investments);
    }

    // UI update
    const walletEl = document.getElementById("balanceDisplay");
    if (walletEl) {
      walletEl.textContent =
        `Wallet Balance: KES ${(Number(userBalance) || 0).toLocaleString()}`;
    }

    updateDashboard();

  } catch (err) {
    console.error("refreshPortfolioUI failed:", err);
  }
}
 
  function updateDashboard() {
  const portfolioEl = document.getElementById('portfolioValue');
  const investmentsEl = document.getElementById('investmentsValue');

  // 1️⃣ SAFE SUM (prevents NaN crash)
  const totalInvestments = activeInvestments.reduce((sum, inv) => {
  return sum + (Number(inv.investedAmount) || 0);
}, 0);

  // 2️⃣ SAFE NUMBERS
  const safeBalance = Number(userBalance) || 0;
  const safeInvestments = Number(totalInvestments) || 0;

  // 3️⃣ SAFE DISPLAY (FIXED YOUR ORIGINAL BUG)
  balanceDisplay.textContent =
    `Wallet Balance: KES ${safeBalance.toLocaleString()}`;

  // 4️⃣ SAFE ANIMATIONS
  if (portfolioEl) {
    animateValue(
      portfolioEl,
      lastPortfolio || 0,
      safeBalance + safeInvestments
    );
  }

  if (investmentsEl) {
    animateValue(
      investmentsEl,
      lastInvestments || 0,
      safeInvestments
    );
  }

  // 5️⃣ SAFE STATE UPDATE (IMPORTANT FIX)
  lastPortfolio = safeBalance + safeInvestments;
  lastInvestments = safeInvestments;
}
  // -------------------
  // Tabs
  // -------------------
    tabNames.forEach(name => {
  console.log("Creating tab:", name);

  const btn = document.createElement('button');
  btn.innerText = name;
  btn.className =
    'px-4 py-2 rounded bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600';

  tabs.appendChild(btn);
  tabButtons[name] = btn;
  console.log("Added button:", btn.innerText);
console.log("Total buttons:", tabs.children.length);
console.log("Tabs HTML:", tabs.innerHTML);

  btn.addEventListener('click', () => showTab(name));
});

     async function showTab(tabName) {
  currentTab = tabName; // ✅ IMPORTANT FIX

  content.innerHTML = '';

  const safeBalance = Number(userBalance ?? 0);
  balanceDisplay.textContent =
    `Wallet Balance: KES ${safeBalance.toLocaleString()}`;

  content.appendChild(balanceDisplay);
  content.appendChild(summaryCards);
  content.appendChild(welcome);

  let tabContent;

    switch (tabName) {

  case 'Home':
    balanceDisplay.textContent =
      `Wallet Balance: KES ${Number(userBalance || 0).toLocaleString()}`;

    content.appendChild(balanceDisplay);
    content.appendChild(summaryCards);
    content.appendChild(welcome);

    tabContent = renderHome(user);
    break;

      case 'Transactions':
  content.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="transactionsBody"></tbody>
    </table>
  `;

  requestAnimationFrame(() => {
    updateTransactionsTable(transactions);
  });

  break;

  case 'Invest':
    tabContent = renderInvestDashboard();
    break;

    case 'Claim':
      tabContent = await renderClaimDashboard();
      break;

    case 'Team':
      await renderTeamDashboard(content, user);
      tabContent = null;
      break;

    case 'Myself':
      tabContent = renderProfile(user);
      break;

      case 'Admin':
  tabContent = await AdminDashboard({
    token,
    admin: user
  });
  break;
  }

  if (tabContent instanceof Node) {
    content.appendChild(tabContent);
  } else if (tabContent) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = tabContent;
    content.appendChild(wrapper);
  }

  updateDashboard();
}


  // -------------------
  // Render functions
  // -------------------
  function renderHome(user) {
  const container = document.createElement("div");
  const homeBox = document.createElement("div"); // ✅ FIX
  homeBox.className = 'flex flex-wrap gap-2 justify-center';
  


// --- Deposit Button ---
const depositBtn = document.createElement('button'); 
depositBtn.className = 'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded'; // ADD THIS
depositBtn.innerText = '💵 Deposit'; // ADD THIS 
depositBtn.addEventListener('click', () => {
  const modal = DepositModal({
    onSuccess: async (amount, mpesaMessage) => {
      try {
        // -------------------------------
        // 1️⃣ Instant Frontend Updates (Pending Approval)
        // -------------------------------
        const newDeposit = {
          date: new Date(),
          user: window.currentUser._id,
          type: 'Deposit',
          amount,
          status: 'Pending Approval'
        };
        transactions.push(newDeposit);

        updateTransactionsTable();
        updateDashboard();

        // Show M-Pesa-style alert for local submission
        const depositTime = newDeposit.date.toLocaleString();
        alert(
          `💰 M-Pesa Deposit Attempt\n` +
          `User: ${window.currentUser.username}\n` +
          `Amount: KES ${amount}\n` +
          `Status: Pending\n` +
          `Time: ${depositTime}`
        );

        // -------------------------------
        // 2️⃣ Call Backend API
        // -------------------------------
        await deposit(amount, mpesaMessage);
        await refreshPortfolioUI();

      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }
  });

  document.body.appendChild(modal);
});


  // --- Withdraw Button ---
  const withdrawBtn = document.createElement('button');
  withdrawBtn.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded';
  withdrawBtn.innerText = '🏧 Withdraw';
     withdrawBtn.addEventListener('click', () => {
  const modal = WithdrawModal({
    userBalance: user.balance, // ✅ safe direct access
    onSuccess: async () => {
      await refreshPortfolioUI();
      alert('Withdrawal request submitted!');
    }
  });

  document.body.appendChild(modal);
});

  homeBox.append(depositBtn, withdrawBtn);
  container.appendChild(homeBox);
  return container;


// ==============================
// GLOBAL STATE (IMPORTANT)
// ==============================
let activeInvestments = [];
let userBalance = 0;
const timers = {}; // prevent duplicate intervals


// ==============================
// INVEST DASHBOARD
// ==============================
}function renderInvestDashboard() {

  console.log("🔥 INVEST PAGE LOADED");

  if (!window.currentUser) {
    console.error("No user session");
    return document.createElement('div');
  }

  const currentInvestments = Array.isArray(window.userInvestments)
    ? window.userInvestments
    : [];

  console.log("📊 INVESTMENTS:", currentInvestments);

  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';

  // =========================
  // PACKAGES (ALWAYS SHOW)
  // =========================
  const packages = [
    { id: 'vip1', name: 'VIP 1', amount: 1200, dailyReturn: 75 },
    { id: 'vip2', name: 'VIP 2', amount: 2400, dailyReturn: 160 },
    { id: 'vip3', name: 'VIP 3', amount: 6500, dailyReturn: 288 },
    { id: 'vip4', name: 'VIP 4', amount: 9700, dailyReturn: 516 },
  ];

  packages.forEach(pkg => {

    const card = document.createElement('div');
    card.className = 'bg-gradient-to-r from-purple-400 to-pink-400 rounded shadow p-4 flex flex-col items-center gap-2';

    card.innerHTML = `
      <h3 class="text-lg font-bold">${pkg.name}</h3>
      <p>Price: KES ${pkg.amount.toLocaleString()}</p>
      <p>Daily Return: KES ${pkg.dailyReturn.toLocaleString()}</p>
      <p>Total Profit: KES ${(pkg.dailyReturn * 30).toLocaleString()}</p>
      <p class="timer text-sm text-gray-800 dark:text-gray-200">Next Claim: N/A</p>
    `;

    const investBtn = document.createElement('button');
    investBtn.innerText = 'Invest';
    investBtn.className = 'px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded text-white';

    const timerEl = card.querySelector('.timer');

    // =========================
    // EXISTING INVESTMENT CHECK
    // =========================
    const existingInvestment = currentInvestments.find(i => i.packageId === pkg.id);

    if (existingInvestment) {
      investBtn.innerText = 'Invested';
      investBtn.disabled = true;
      investBtn.classList.add('bg-gray-400');
      investBtn.classList.remove('bg-yellow-400');

      startInvestmentTimer(existingInvestment, timerEl);
    }

    // =========================
    // INVEST ACTION
    // =========================
    investBtn.addEventListener('click', async () => {

      const already = currentInvestments.find(i => i.packageId === pkg.id);
      if (already) return alert('Already invested in this package!');

      if (userBalance < pkg.amount) {
        return alert("Insufficient balance!");
      }

      try {
        investBtn.disabled = true;

        const res = await createInvestment({
          userId: window.currentUser._id,
          packageId: pkg.id,
          investedAmount: pkg.amount,
          dailyReturn: pkg.dailyReturn
        });

        const backendInvestment = res.investment ?? res;

        if (!backendInvestment) {
          throw new Error("No investment returned from backend");
        }

        const newInvestment = {
          _id: backendInvestment._id,
          user: backendInvestment.user,
          packageId: pkg.id,
          investedAmount: backendInvestment.investedAmount,
          dailyReturn: backendInvestment.dailyReturn,
          totalEarned: backendInvestment.totalEarned || 0,
          startDate: backendInvestment.startDate,
          lastClaimDate: backendInvestment.lastClaimDate || new Date().toISOString(),
          status: backendInvestment.status || "active"
        };

        // =========================
        // UPDATE BALANCE SAFELY
        // =========================
        userBalance = res.balance ?? window.currentUser.balance;
        window.currentUser.balance = userBalance;

        localStorage.setItem("user", JSON.stringify(window.currentUser));

        // =========================
        // UPDATE INVESTMENTS
        // =========================
        window.userInvestments = Array.isArray(window.userInvestments)
          ? [...window.userInvestments, newInvestment]
          : [newInvestment];

        console.log("✅ UPDATED INVESTMENTS:", window.userInvestments);

        startInvestmentTimer(newInvestment, timerEl);

        investBtn.innerText = 'Invested';
        investBtn.classList.add('bg-gray-400');
        investBtn.classList.remove('bg-yellow-400');

        updateDashboard();

      } catch (err) {
        console.error("❌ INVEST ERROR:", err);
        investBtn.disabled = false;
        alert("Investment failed");
      }
    });

    card.appendChild(investBtn);
    container.appendChild(card);
  });

  return container;
}
// ==============================
// TIMER SYSTEM (FIXED)
// ==============================
function startInvestmentTimer(inv, timerEl) {

  const id = inv._id || inv.packageId;

  if (timers[id]) {
    clearInterval(timers[id]);
  }

  function updateTimer() {
    const now = Date.now();

    const lastClaimTime = inv.lastClaimDate
      ? new Date(inv.lastClaimDate).getTime()
      : new Date(inv.startDate || inv.createdAt || Date.now()).getTime();

  
   
    const investmentPeriod = 24 * 60 * 60 * 1000; // 24 hours

const elapsed = now - lastClaimTime;
const remainingMs = Math.max(0, investmentPeriod - elapsed);

    // ✅ WHEN READY
    if (remainingMs <= 0) {
      timerEl.innerText = "✅ Claim Ready!";

      // 🔥 add style only once
      if (!timerEl.classList.contains("text-green-500")) {
        timerEl.classList.add("text-green-500", "font-bold");
      }

      return;
    }

    // ❌ remove green style if not ready
    timerEl.classList.remove("text-green-500", "font-bold");

    const hrs = Math.floor(remainingMs / 3600000);
    const mins = Math.floor((remainingMs % 3600000) / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);

    timerEl.innerText = `Next Claim: ${hrs}h ${mins}m ${secs}s`;
  }

  updateTimer();
  timers[id] = setInterval(updateTimer, 1000);
}


async function renderClaimDashboard() {

  const container = document.createElement('div');
  container.className = 'flex flex-col gap-4';

  const user =
    window.currentUser ||
    JSON.parse(localStorage.getItem("user"));

  if (!user?._id) {
    container.innerHTML = "<p>Please login again</p>";
    return container;
  }

  let investments = [];

try {
  investments = await fetchInvestments(window.currentUser._id);
  window.userInvestments = investments;
} catch (err) { 
  console.error("Failed to load investments:", err);
}
  console.log("💰 CLAIM RAW INVESTMENTS:", investments);
  console.log("Current user:", user);

  if (!investments.length) {
    container.innerHTML = "<p>No investments found</p>";
    return container;
  }

  // ---------------- PACKAGE MAP ----------------
  const packageMap = {
    vip1: { name: "VIP 1", amount: 1200, dailyReturn: 75, duration: "24 Hours", totalReturn: 2250 },
    vip2: { name: "VIP 2", amount: 2400, dailyReturn: 160, duration: "24 Hours", totalReturn: 4800 },
    vip3: { name: "VIP 3", amount: 6500, dailyReturn: 288, duration: "24 Hours", totalReturn: 8640 },
    vip4: { name: "VIP 4", amount: 9700, dailyReturn: 516, duration: "24 Hours", totalReturn: 15480 }
  };

 
  const ONE_DAY = 3 * 60 * 1000; // 3 minutes for testing

  // ---------------- HELPERS ----------------
  function getProgress(inv) {
    const last = inv.lastClaimDate
      ? new Date(inv.lastClaimDate)
      : new Date(inv.createdAt);

    return Math.min(((Date.now() - last.getTime()) / ONE_DAY) * 100, 100);
  }

  function getTimeLeft(inv) {
    const last = inv.lastClaimDate
      ? new Date(inv.lastClaimDate)
      : new Date(inv.createdAt);

    const diff = ONE_DAY - (Date.now() - last.getTime());

    if (diff <= 0) return "Ready";

    const m = Math.floor(diff / (1000 * 60));
    return `${m} min`;
  }

  function calculateEarnings(inv, pkg) {
    const startDate = new Date(inv.startDate || inv.createdAt || Date.now());
    const days = Math.floor((Date.now() - startDate) / ONE_DAY);
    return days * (pkg.dailyReturn || 0);
  }

  // ---------------- RENDER ----------------
  investments.forEach(inv => {

    const pkg = packageMap[inv.packageId] || {};
    const progress = getProgress(inv);
    const canClaim = progress >= 100;

    const card = document.createElement('div');
    card.className =
      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col gap-2 border";

    if (canClaim) {
      card.classList.add("ring-2", "ring-green-400", "animate-pulse");
    }

    const info = document.createElement('div');

    info.innerHTML = `
      <div class="flex justify-between">
        <p class="font-bold">${pkg.name || "Unknown Package"}</p>
        <span class="text-xs bg-green-100 text-green-700 px-2 rounded">ACTIVE</span>
      </div>

      <p>💰 Invested: KES ${(inv.investedAmount || 0).toLocaleString()}</p>
      <p>📈 Daily: KES ${(pkg.dailyReturn || 0).toLocaleString()}</p>
      <p>⏳ Duration: ${pkg.duration || "N/A"}</p>

      <p class="text-blue-600 font-semibold">
        📊 Earned: KES ${Number(inv.totalEarned || 0).toLocaleString()}
      </p>
    `;

    const bar = document.createElement("div");
    bar.className = "w-full bg-gray-200 h-2 rounded";

    const fill = document.createElement("div");
    fill.className = "bg-green-500 h-2 rounded";
    fill.style.width = `${progress}%`;

    bar.appendChild(fill);

    const timer = document.createElement("p");
    timer.innerText = `⏳ ${getTimeLeft(inv)}`;

    const btn = document.createElement("button");

    function updateBtn() {
      const ready = getProgress(inv) >= 100;

      btn.disabled = !ready;
      btn.innerText = ready ? "Claim Now" : "Locked";

      btn.className = ready
        ? "bg-yellow-500 text-white px-4 py-2 rounded"
        : "bg-gray-400 text-white px-4 py-2 rounded";
    }

    updateBtn();
      btn.addEventListener("click", async () => {
  try {
    const res = await claimInvestment(inv._id);

    console.log("CLAIM RESPONSE:", res);

    alert(`Claim successful! Earned: ${res.earnings}`);

    // ✅ update user balance
    if (window.currentUser) {
      window.currentUser.balance = res.newBalance;
    }

    localStorage.setItem("user", JSON.stringify(window.currentUser));

    // ✅ update UI
    const walletEl = document.getElementById("balanceDisplay");
    if (walletEl) {
      walletEl.textContent = `Wallet Balance: KES ${Number(res.newBalance).toLocaleString()}`;
    }

    // ✅ refresh investments
    window.userInvestments = await fetchInvestments(window.currentUser._id);

    // ✅ rerender claim dashboard
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.innerHTML = "";
      dashboard.appendChild(await renderClaimDashboard());
    }

  } catch (err) {
    console.error(err);
    alert("Claim failed");
  }
});

    card.appendChild(info);
    card.appendChild(bar);
    card.appendChild(timer);
    card.appendChild(btn);

    container.appendChild(card);
  });

  return container;
}


async function renderTeamDashboard(container, user) {
  container.innerHTML = '';

  if (!user || !user._id) {
    container.innerHTML = "<p>Please login again</p>";
    return;
  }
const teamContainer = document.createElement('div');

teamContainer.className =
  'flex flex-col gap-4 p-4 bg-yellow-50 dark:bg-gray-100 rounded shadow w-full max-w-3xl mx-auto';


const referralLink = `https://vestora.com/signup?ref=${user.referralCode || ''}`;

teamContainer.innerHTML = `
  <div class="flex flex-col gap-3">

    <div>
      <strong>Referral Code:</strong> ${user.referralCode || 'N/A'}
    </div>

    <div class="flex flex-col md:flex-row md:items-center gap-2">

      <div class="break-all">
        <strong>Referral Link:</strong>

        <a 
          href="${referralLink}" 
          target="_blank"
          class="text-purple-700 font-semibold hover:text-pink-600 underline"
        >
          ${referralLink}
        </a>
      </div>

      <button 
        id="copyBtn"
        class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg font-bold hover:scale-105 transition"
      >
        Copy
      </button>

    </div>

  </div>

  

  <h4 class="font-bold text-lg mt-2" id="title">
    Invited Members (0)
  </h4>

  <div id="list" class="flex flex-col gap-2 max-h-64 overflow-y-auto p-2 bg-white rounded shadow">
    Loading...
  </div>
`;

container.appendChild(teamContainer);

const membersList = teamContainer.querySelector("#list");
const membersTitle = teamContainer.querySelector("#title");



// COPY BUTTON
const copyBtn = teamContainer.querySelector("#copyBtn");

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(referralLink);

    copyBtn.textContent = "Copied!";
    
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 2000);

  } catch (err) {
    console.error("Copy failed:", err);
  }
});

 async function loadTeam() {
  try {
    console.log("USER ID:", user._id);
    console.log("REFERRAL CODE:", user.referralCode);
  const res = await fetch("/api/team", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

      const data = await res.json();
      const members = data.members || [];

    console.log("TEAM RESPONSE:", members);
    console.log("TEAM API RESPONSE:", data);

    membersList.innerHTML = '';

  

    membersTitle.innerText = `Invited Members (Total: ${members.length})`;


    if (members.length === 0) {
      membersList.innerHTML = '<p class="text-gray-500">No referrals yet</p>';
      return;
    }

    members.forEach(member => {
      const div = document.createElement('div');
      div.className = 'p-2 bg-green-100 rounded';

      div.innerHTML = `
        <div><strong>${member.username}</strong></div>
        <div>Bonus: KES ${member.generatedBonus || 0}</div>
        
        
      `;

      membersList.appendChild(div);
    });

  } catch (err) {
    console.error("TEAM ERROR:", err);
    membersList.innerHTML =
      '<p class="text-red-500">Failed to load team</p>';
  }
}
  await loadTeam()
}



  // -------------------
  // Admin dashboard
  // -------------------
  async function startAdminDashboard(token, admin) {
    app.innerHTML = '';
    try {
      const dashboardNode = await AdminDashboard({ token, admin });
      app.appendChild(dashboardNode);
    } catch (err) {
      console.error(err);
      app.innerHTML = '<p>Failed to load admin dashboard</p>';
    }
  }
  

  // -------------------
  // Initial load
  // -------------------
 showTab('Home');
updateDashboardData();
}