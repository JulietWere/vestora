// src/admin/AdminDashboard.js
import axios from "axios";
import { io } from "socket.io-client";
import { adminApprove, adminReject } from "../admin/adminApi.js";

export async function AdminDashboard({ token, admin }) {
    const socket = io("https://vestora-backend-xrhn.onrender.com");

  const container = document.createElement("div");
  container.className = "w-full min-h-screen flex flex-col gap-4 p-4";

  // ------------------ HEADER ------------------
  const header = document.createElement("div");
  header.className = "flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-100 dark:bg-gray-800 rounded shadow gap-3";

  const title = document.createElement("h2");
  title.innerText = `Admin Dashboard - ${admin.username}`;
  title.className = "text-xl md:text-2xl font-bold";

  // Search input
  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search user...";
  searchInput.className = "px-3 py-2 border rounded w-full md:w-64 dark:bg-gray-700";

  header.appendChild(title);
  header.appendChild(searchInput);
  container.appendChild(header);

  // ------------------ TABS ------------------
  const tabs = document.createElement("div");
  tabs.className = "flex flex-wrap gap-2";

  const tabNames = ["Users", "Transactions", "Pending Approvals"];
  const tabButtons = {};

  tabNames.forEach(name => {
    const btn = document.createElement("button");
    btn.innerText = name;
    btn.className = "px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400";
    tabs.appendChild(btn);
    tabButtons[name] = btn;
    btn.addEventListener("click", () => showTab(name));
  });

  container.appendChild(tabs);

  // ------------------ CONTENT ------------------
  const content = document.createElement("div");
  content.className = "flex-1 flex flex-col gap-4";
  container.appendChild(content);

  // ------------------ TOAST ------------------
  function showToast(message, color = "green") {
    const toast = document.createElement("div");
    toast.className = `
      fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50
      ${color === "green" ? "bg-green-600" :
        color === "red" ? "bg-red-600" :
        "bg-blue-600"}
    `;
    toast.innerText = message;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ------------------ FETCH DATA ------------------
async function fetchDashboardData() {
  let users = [];
  let recentTransactions = [];

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

    try {
  const resUsers = await axios.get(
    "https://vestora-backend-xrhn.onrender.com/api/users",
    config
  );
  users = resUsers.data;
} catch (err) {
  console.error("Users fetch failed:", err.response?.data || err.message);
}

   try {
  const resTx = await axios.get(
    "https://vestora-backend-xrhn.onrender.com/api/transactions",
    config
  );
  recentTransactions = resTx.data;
} catch (err) {
  console.error("Transactions fetch failed:", err.response?.data || err.message);
}

  return { users, recentTransactions };
}

  // ------------------ BUTTON HELPER ------------------
  const setButtonProcessing = (processing, btn) => {
    if (processing) {
      btn.dataset.originalText = btn.innerText;

      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin h-4 w-4 mr-2 inline-block text-white" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        </svg>
        Processing...
      `;
    } else {
      btn.disabled = false;
      btn.innerText = btn.dataset.originalText;
    }
  };

  // ------------------ USERS TAB ------------------
  async function renderUsers() {
    content.innerHTML = "";

    const data = await fetchDashboardData();
    let users = data.users || [];

    const search = searchInput.value.toLowerCase();
    if (search) {
      users = users.filter(u => u.username.toLowerCase().includes(search));
    }

    // Filters
    const controls = document.createElement("div");
    controls.className = "flex gap-2 flex-wrap";

    const sortBtn = document.createElement("button");
    sortBtn.innerText = "Sort by Balance";
    sortBtn.className = "px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded";

    sortBtn.onclick = () => {
      users.sort((a, b) => b.balance - a.balance);
      renderUsers();
    };

    controls.appendChild(sortBtn);
    content.appendChild(controls);

    if (!users.length) {
      content.innerHTML += "<p>No users found.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "min-w-full bg-white dark:bg-gray-700 rounded shadow";

    table.innerHTML = `
      <thead class="bg-gray-200 dark:bg-gray-600">
        <tr>
          <th class="p-2">Username</th>
          <th class="p-2">Balance</th>
          <th class="p-2">Blocked</th>
          <th class="p-2">Admin</th>
          <th class="p-2">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    users.forEach(user => {
      const row = document.createElement("tr");

      if (user.isBlocked) row.classList.add("bg-red-100");
      else if (user.isAdmin) row.classList.add("bg-blue-100");

      row.innerHTML = `
        <td class="p-2">${user.username}</td>
        <td class="p-2">KES ${user.balance.toLocaleString()}</td>
        <td class="p-2">${user.isBlocked ? "Yes" : "No"}</td>
        <td class="p-2">${user.isAdmin ? "Yes" : "No"}</td>
        <td class="p-2 flex gap-2"></td>
      `;

      const actions = row.children[4];

      const blockBtn = document.createElement("button");
      blockBtn.innerText = user.isBlocked ? "Unblock" : "Block";
      blockBtn.className = "px-2 py-1 bg-red-600 text-white rounded";

      blockBtn.onclick = async () => {
        if (!confirm("Confirm action?")) return;

       try {
  setButtonProcessing(true, blockBtn);

  await axios.put(
    `https://vestora-backend-xrhn.onrender.com/api/admin/block/${user.username}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

          showToast("User updated");
          renderUsers();
        } catch (err) {
          showToast("Failed action", "red");
        } finally {
          setButtonProcessing(false, blockBtn);
        }
      };

      const adminBtn = document.createElement("button");
      adminBtn.innerText = user.isAdmin ? "Revoke Admin" : "Make Admin";
      adminBtn.className = "px-2 py-1 bg-blue-600 text-white rounded";

     adminBtn.onclick = async () => {
  const actionText = user.isAdmin ? "revoke admin privileges from" : "make";
     const confirmed = confirm(
  `Are you sure you want to ${actionText} ${user.username}?`
);
if (!confirmed) return;

  try {
  setButtonProcessing(true, adminBtn);

  await axios.put(
    `https://vestora-backend-xrhn.onrender.com/api/admin/admin/${user.username}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
    showToast("Admin status updated");
    renderUsers();
  } catch {
    showToast("Failed admin update", "red");
  } finally {
    setButtonProcessing(false, adminBtn);
  }
};


      actions.appendChild(blockBtn);
      actions.appendChild(adminBtn);

      tbody.appendChild(row);
    });

    content.appendChild(table);
  }

  // ------------------ TRANSACTIONS TAB ------------------
  async function renderTransactions() {
    content.innerHTML = "";

    const data = await fetchDashboardData();
    const txs = data.recentTransactions || [];

    const stats = document.createElement("div");
    stats.className = "flex gap-2";

    stats.innerHTML = `
      <div class="p-2 bg-green-100 rounded">Completed: ${txs.filter(t => t.status === "Completed").length}</div>
      <div class="p-2 bg-yellow-100 rounded">Pending: ${txs.filter(t => t.status === "Pending Approval").length}</div>
    `;

    content.appendChild(stats);

    if (!txs.length) {
      content.innerHTML += "<p>No transactions</p>";
      return;
    }
      
    txs.reverse().forEach(tx => {
      const card = document.createElement("div");
      card.className = "p-3 bg-white dark:bg-gray-700 rounded shadow";

      card.innerHTML = `
        <div><strong>${tx.user?.username || 'Unknown'}</strong></div>
        <div>${tx.type}</div>
        <div>KES ${tx.amount.toLocaleString()}</div>
        <div>${tx.status}</div>
      `;

      content.appendChild(card);
    });
  }

  // ------------------ PENDING TAB ------------------
  async function renderPendingApprovals() {
  content.innerHTML = "";

  const data = await fetchDashboardData();
  const pending = data.recentTransactions.filter(t => t.status === "Pending Approval");

  if (!pending.length) {
    content.innerHTML = "<p>No pending approvals</p>";
    return;
  }

  pending.forEach(tx => {
    const card = document.createElement("div");
    card.className = "p-3 bg-white dark:bg-gray-700 rounded shadow flex gap-2 items-center";

    // Transaction info
    const info = document.createElement("div");
    info.innerHTML = `
  <div><strong>${tx.user?.username || 'Unknown User'}</strong></div>
  <div>${tx.type}</div>
  <div>KES ${tx.amount.toLocaleString()}</div>
`;

    // Approve button
    const approveBtn = document.createElement("button");
    approveBtn.innerText = "Approve";
    approveBtn.className = "px-2 py-1 bg-green-600 text-white rounded";

    // Reject button
    const rejectBtn = document.createElement("button");
    rejectBtn.innerText = "Reject";
    rejectBtn.className = "px-2 py-1 bg-red-600 text-white rounded";

    // Button processing helper
    const setButtonProcessing = (btn, processing) => {
      if (processing) {
        btn.dataset.originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 mr-1 inline-block text-white" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        </svg> Processing...`;
      } else {
        btn.disabled = false;
        btn.innerText = btn.dataset.originalText;
      }
    };

    // Approve click
    approveBtn.onclick = async () => {
      try {
        setButtonProcessing(approveBtn, true);
        await adminApprove(tx._id, token); // use backend helper

        showToast("Approved ✅");

        // Refresh users table to update balances
        await renderUsers();

        // Refresh pending approvals
        showTab("Pending Approvals");

        // Emit socket to update other admins in real-time
        socket.emit("transactionUpdated", tx);
      } catch (err) {
        showToast(err.message, "red");
      } finally {
        setButtonProcessing(approveBtn, false);
      }
    };

    // Reject click
    rejectBtn.onclick = async () => {
      try {
        setButtonProcessing(rejectBtn, true);
        await adminReject(tx._id, token); // use backend helper

        showToast("Rejected ❌", "red");

        // Refresh users table to update balances
        await renderUsers();

        // Refresh pending approvals
        showTab("Pending Approvals");

        // Emit socket to update other admins in real-time
        socket.emit("transactionUpdated", tx);
      } catch (err) {
        showToast(err.message, "red");
      } finally {
        setButtonProcessing(rejectBtn, false);
      }
    };

    card.appendChild(info);
    card.appendChild(approveBtn);
    card.appendChild(rejectBtn);

    content.appendChild(card);
  });
}

// ----------------- SOCKET REAL-TIME UPDATE -----------------
socket.on("transactionUpdated", (tx) => {
  // Re-render users to show updated balances
  renderUsers();

  // Refresh pending approvals tab if it's currently open
  if (content && content.contains(document.querySelector("div.flex-1"))) {
    showTab("Pending Approvals");
  }
});
  // ------------------ TAB SWITCH ------------------
  function showTab(tabName) {
    if (tabName === "Users") renderUsers();
    if (tabName === "Transactions") renderTransactions();
    if (tabName === "Pending Approvals") renderPendingApprovals();
  }

  searchInput.addEventListener("input", renderUsers);

  // ------------------ SOCKET UPDATES ------------------
  socket.on("newUser", renderUsers);
  socket.on("transactionUpdated", () => showTab("Pending Approvals"));

  showTab("Users");

  return container;
}
