// src/components/adminApi.js
import axios from "axios";

const BASE_URL = "https://vestora-backend-xrhn.onrender.com";

export async function adminApprove(transactionId, token) {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/transactions/approve`,
      { transactionId },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (err) {
    console.error("Admin approve failed:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Admin approve failed");
  }
}

export async function adminReject(transactionId, token) {
  try {
         const res = await axios.post(
  `${BASE_URL}/api/transactions/reject-withdraw`,
  { transactionId },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }
);
    return res.data;
  } catch (err) {
    console.error("Admin reject failed:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Admin reject failed");
  }
}