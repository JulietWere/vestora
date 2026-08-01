import axios from "axios"

const BASE_URL = "https://vestora-backend-xrhn.onrender.com";

// ----------------- REGISTER -----------------
export async function registerUser(username, password, referralCode = null, referralLink = false) {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      username,
      password,
      referralCode,
      referralLink
    });
    return res.data;
  } catch (err) {
    console.error("Register failed:", err.response?.data || err.message);
    return { error: err.response?.data?.message || "Registration failed" };
  }
}

// ----------------- LOGIN -----------------
export async function loginUser(username, password) {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    });

    const token = res.data?.token;
    const user = res.data?.user;

    if (token && user) {
      // store safely
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // set global user
      window.currentUser = {
        _id: user._id,
        username: user.username,
        token: token,
        balance: user.balance || 0,
        referralCode: user.referralCode || "",
        bonus: user.bonus || 0
      };
    }

    return res.data;
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    return { error: err.response?.data?.message || "Login failed" };
  }
}
// ----------------- ADMIN LOGIN -----------------
export async function adminLogin(username, password) {
  try {
    const res = await axios.post(`${BASE_URL}/api/admin/login`, {
      username,
      password
    });
    return res.data;
  } catch (err) {
    console.error("Admin login failed:", err.response?.data || err.message);
    return { error: err.response?.data?.message || "Admin login failed" };
  }
}

// ----------------- FETCH PORTFOLIO -----------------
export async function fetchPortfolio() {
  const token = localStorage.getItem("token");

  if (!token) {
    return { balance: 0, investments: [] };
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/portfolio`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("FULL RESPONSE:", res.data);

    // 🔥 NORMALIZE RESPONSE HERE
    const data = res.data || {};

   return {
  balance: Number(data.balance) || 0,
  bonus: Number(data.bonus) || 0,
  totalEarned: Number(data.totalEarned) || 0,
  investments: Array.isArray(data.investments)
    ? data.investments.map(inv => ({
        ...inv,
        amount: Number(inv.amount) || 0,
        lastClaimDate: inv.lastClaimDate || new Date().toISOString()
      }))
    : []
};


  } catch (err) {
    console.error("Fetch portfolio failed:", err.response?.data || err.message);

    return {
      balance: 0,
      investments: []
    };
  }
}

// ----------------- FETCH TRANSACTIONS -----------------
export async function fetchTransactions() {

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found");
    return [];
  }

  try {

    const res = await axios.get(
      `${BASE_URL}/api/transactions`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("FETCHED TRANSACTIONS:", res.data);

    return Array.isArray(res.data)
      ? res.data
      : [];

  } catch (err) {

    console.error(
      "Fetch transactions failed:",
      err.response?.data || err.message
    );

    return [];
  }
}

// ----------------- DEPOSIT -----------------
export async function deposit(amount, mpesaMessage) {
  if (!window.currentUser?.token) throw new Error("No user logged in");

  try {
    const res = await axios.post(
      `${BASE_URL}/api/transactions/deposit`,
      { amount, mpesaMessage },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.currentUser.token}`
        }
      }
    );
    return res.data;
  } catch (err) {
    console.error("Deposit failed:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Deposit failed");
  }
}

// ----------------- WITHDRAW -----------------
export async function withdraw(data) {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("No user logged in");
return axios.post(
  "https://vestora-backend-xrhn.onrender.com/api/transactions/withdraw",
  data,
  {

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).then(res => res.data);
}

// ----------------- FETCH REFERRALS -----------------
export async function fetchReferrals(username) {
  try {
    const res = await axios.get(`${BASE_URL}/api/referrals/${username}`);
    return res.data;
  } catch (err) {
    console.error("Fetch referrals failed:", err.response?.data || err.message);
    return { totalBonus: 0, referrals: [] };
  }
}


// ----------------- FETCH TEAM MEMBERS -----------------
export async function fetchTeam() {
  const token = localStorage.getItem("token");

  if (!token) {
    return [];
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/team`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("TEAM RESPONSE:", res.data);

    return res.data.members || [];

  } catch (err) {
    console.error("Fetch team failed:", err.response?.data || err.message);
    return [];
  }
}

// ----------------- FETCH INVESTMENTS -----------------
export async function createInvestment(data) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No user logged in");
  }

   try {
  const res = await axios.post(
    "https://vestora-backend-xrhn.onrender.com/api/investments",
    {

        packageId: data.packageId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data;
  } catch (err) {
    console.error("createInvestment failed:", err.response?.data || err.message);
    throw err;
  }
}

// ----------------- FETCH INVESTMENTS -----------------
export async function fetchInvestments(userId) {
  const token = localStorage.getItem("token");

  if (!token || !userId) return [];

  try {
    const res = await axios.get(
      `${BASE_URL}/api/investments/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("FETCH INVESTMENTS RESPONSE:", res.data);

    return Array.isArray(res.data.investments)
      ? res.data.investments
      : [];

  } catch (err) {
    console.error(
      "fetchInvestments failed:",
      err.response?.data || err.message
    );

    return [];
  }
}

// ----------------- CLAIM INVESTMENT -----------------
export async function claimInvestment(investmentId) {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("No user logged in");

  if (!investmentId || typeof investmentId !== "string" || investmentId.length !== 24) {
    console.error("❌ Invalid ID sent:", investmentId);
    throw new Error("Invalid investment ID");
  }
  const res = await axios.put(
  `https://vestora-backend-xrhn.onrender.com/api/investments/claim/${investmentId}`,
  {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
}
