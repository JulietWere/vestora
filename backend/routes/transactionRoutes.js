import Transaction from "../models/transaction.js";
import User from "../models/User.js";
import { distributeReferralBonus } from "../utils/referralBonus.js";

app.post("/api/transactions/approve", async (req, res) => {
  try {
    const { transactionId, adminId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (tx.status === "Completed") {
      return res.status(400).json({ message: "Already approved" });
    }

    const user = await User.findById(tx.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // =========================
    // 1. CREDIT USER BALANCE
    // =========================
    user.balance = (user.balance || 0) + tx.amount;
    await user.save();

    // =========================
    // 2. UPDATE TRANSACTION
    // =========================
    tx.status = "Completed";
    tx.approvedBy = adminId;
    tx.approvedAt = new Date();

    // =========================
    // 3. REFERRAL BONUS (SAFE)
    // =========================
    if (!tx.referralProcessed) {
      await distributeReferralBonus(user._id, tx.amount, tx._id);
      tx.referralProcessed = true;
    }

    await tx.save();

    res.json({
      message: "Transaction approved successfully",
      transaction: tx
    });

  } catch (err) {
    console.error("APPROVAL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});