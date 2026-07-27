import express from "express";
import User from "../models/User.js";
import Transaction from "../models/transaction.js";

const router = express.Router();

// ==========================
// ADMIN DASHBOARD STATS
// ==========================
router.get("/dashboard", async (req, res) => {
  try {
    // total users
    const totalUsers = await User.countDocuments();

    // total deposits
    const totalDepositsAgg = await Transaction.aggregate([
      { $match: { type: "Deposit", status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalDeposits = totalDepositsAgg[0]?.total || 0;

    // pending deposits
    const pendingDeposits = await Transaction.countDocuments({
      type: "Deposit",
      status: "Pending Approval"
    });

    // total withdrawals
    const totalWithdrawalsAgg = await Transaction.aggregate([
      { $match: { type: "Withdrawal", status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalWithdrawals = totalWithdrawalsAgg[0]?.total || 0;

    res.json({
      totalUsers,
      totalDeposits,
      pendingDeposits,
      totalWithdrawals
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;