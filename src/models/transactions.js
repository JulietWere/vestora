import express from "express";
import Transaction from "../models/transaction.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ----------------- DEPOSIT -----------------
router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, mpesaMessage } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: "MPESA Deposit",
      amount,
      currency: "KES",
      mpesaMessage: mpesaMessage || "",
      status: "Pending Approval",
      createdAt: new Date()
    });

    res.json(transaction);

  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET ALL TRANSACTIONS -----------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

export default router;
