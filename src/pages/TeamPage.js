
import QRCode from "qrcode";

export async function renderTeam(container, user) {
  if (!user) user = window.currentUser;

  const referralCode = user?.referralCode || '';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  container.innerHTML = '';

  // =============================
  // HEADER
  // =============================
  const header = document.createElement("div");
  header.className = "text-lg font-bold mb-2";
  header.innerText = `Hello, ${user?.username || "User"}`;
  container.appendChild(header);

  // =============================
  // BALANCE
  // =============================
  const balance = document.createElement("div");
  balance.className =
    "text-center p-3 bg-gray-100 dark:bg-gray-800 rounded mb-4 font-bold";
  balance.innerText = `Balance: KES ${user.balance?.toLocaleString() || 0}`;
  container.appendChild(balance);

  // =============================
  // REFERRAL SECTION (PRO MAX)
  // =============================
  const refDiv = document.createElement("div");
  refDiv.className =
    "p-4 bg-blue-100 dark:bg-blue-800 rounded shadow mb-6 relative";

  refDiv.innerHTML = `
    <p class="font-bold mb-2">Your Referral Code</p>

    <div class="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded mb-2">
      <span id="refCode">${referralCode}</span>
      <button id="copyCode">📋</button>
    </div>

    <p class="text-sm mb-1">Referral Link</p>

    <div class="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded">
      <span id="refLink" class="text-xs break-all">${referralLink}</span>
      <button id="copyLink">📋</button>
    </div>

    <div class="flex gap-2 mt-3">
      <button id="wa" class="px-3 py-1 bg-green-600 text-white rounded text-sm">WhatsApp</button>
      <button id="tg" class="px-3 py-1 bg-blue-500 text-white rounded text-sm">Telegram</button>
    </div>

    <div id="toast" class="hidden absolute bottom-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
      Copied!
    </div>

    <canvas id="qr" class="mt-3 bg-white p-2 rounded"></canvas>
  `;

  container.appendChild(refDiv);

  // =============================
  // QR CODE GENERATION
  // =============================
  setTimeout(() => {
    const qrCanvas = document.getElementById("qr");

    if (QRCode && referralLink) {
      QRCode.toCanvas(qrCanvas, referralLink, {
        width: 120
      });
    }
  }, 100);

  // =============================
  // COPY + SHARE LOGIC
  // =============================
  setTimeout(() => {
    const toast = document.getElementById("toast");

    const showToast = (msg) => {
      toast.innerText = msg;
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 1500);
    };

    document.getElementById("copyCode").onclick = () => {
      navigator.clipboard.writeText(referralCode);
      showToast("Code copied");
    };

    document.getElementById("copyLink").onclick = () => {
      navigator.clipboard.writeText(referralLink);
      showToast("Link copied");
    };

    document.getElementById("wa").onclick = () => {
      window.open(
        `https://wa.me/?text=Join me on Vestora: ${referralLink}`,
        "_blank"
      );
    };

    document.getElementById("tg").onclick = () => {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`,
        "_blank"
      );
    };
  }, 100);

  // =============================
  // TEAM STATS (LEVELS)
  // =============================
  const stats = document.createElement("div");
  stats.className = "grid grid-cols-3 gap-2 mb-4";

  stats.innerHTML = `
    <div class="bg-white dark:bg-gray-700 p-2 rounded text-center">
      <p class="font-bold">Level 1</p>
      <p>${user.level1Count || 0}</p>
    </div>
    <div class="bg-white dark:bg-gray-700 p-2 rounded text-center">
      <p class="font-bold">Level 2</p>
      <p>${user.level2Count || 0}</p>
    </div>
    <div class="bg-white dark:bg-gray-700 p-2 rounded text-center">
      <p class="font-bold">Level 3</p>
      <p>${user.level3Count || 0}</p>
    </div>
  `;

  container.appendChild(stats);

  // =============================
  // TEAM LIST
  // =============================
  const membersDiv = document.createElement("div");
  membersDiv.className = "bg-gray-100 dark:bg-gray-700 p-3 rounded";

  membersDiv.innerHTML = `<h3 class="font-bold mb-2">Your Team</h3><p>Loading...</p>`;
  container.appendChild(membersDiv);

  async function loadTeam() {
  try {
    // STEP 1: get referrer user by referralCode
    const refRes = await fetch(
      `http://localhost:5000/api/users?refCode=${referralCode}`
    );
    const refData = await refRes.json();

    const referrer = refData.find(u => u.referralCode === referralCode);

    if (!referrer) {
      membersDiv.innerHTML = "<p>No referrer found</p>";
      return;
    }

    // STEP 2: now use real user ID
    const res = await fetch(
      `http://localhost:5000/api/users?referredBy=${referrer._id}`
    );

    const data = await res.json();

    membersDiv.innerHTML = `<h3 class="font-bold mb-2">Your Team</h3>`;

    if (!data.length) {
      membersDiv.innerHTML += `<p>No referrals yet</p>`;
      return;
    }

    const ul = document.createElement("ul");

    data.forEach((u) => {
      const li = document.createElement("li");
      li.innerText = `${u.username} - KES ${u.balance}`;
      ul.appendChild(li);
    });

    membersDiv.appendChild(ul);

  } catch (err) {
    console.error(err);
    membersDiv.innerHTML = `<p class="text-red-500">Failed to load team</p>`;
  }
}

  await loadTeam();
}