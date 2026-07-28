import express from "express";
import jwt from "jsonwebtoken";
import Investment from "../models/Investment.js";
import User from "../models/User.js";
import { distributeReferralBonus } from "../utils/referralBonus.js";
import Transaction from "../models/transaction.js";

const router = express.Router();

console.log("🔥 THIS IS THE FILE RUNNING");


// CREATE INVESTMENT
router.post("/create", async (req, res) => {
  try {
    const { userId, packageId, investedAmount, dailyReturn, name } = req.body || {};

    if (!userId || !packageId || !investedAmount || !dailyReturn) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amount = Number(investedAmount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid invested amount" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const existing = await Investment.findOne({
      user: userId,
      packageId,
      status: "active"
    });

    if (existing) {
      return res.status(400).json({ message: "Already invested in this package" });
    }

    const investment = await Investment.create({
      user: userId,
      packageId,
      investedAmount: amount,
      dailyReturn: Number(dailyReturn),
      name: name || packageId,
      startDate: new Date(),
      lastClaimDate: new Date(),
      totalEarned: 0,
      status: "active"
    });

       user.balance -= amount;
await user.save();

// 🔥 REFERRAL BONUSES
await distributeReferralBonus(userId, amount);

    res.status(201).json({
      message: "Investment created successfully",
      investment,
      balance: user.balance
    });

  } catch (err) {
    console.error("❌ INVEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// ✅ CLAIM (MUST COME BEFORE /:userId)
    router.put("/claim/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    let decoded;

try {
  decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (err) {
  return res.status(401).json({
    message: "Invalid or expired token"
  });
}

    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        message: "Investment not found"
      });
    }

    if (investment.user.toString() !== decoded._id) {
      return res.status(403).json({
        message: "Not your investment"
      });
    }
    
   const ONE_DAY = 24 * 60 * 60 * 1000;
    

    const now = Date.now();
    const lastClaim = investment.lastClaimDate
  ? new Date(investment.lastClaimDate).getTime()
  : new Date(investment.createdAt).getTime();
  
  console.log("===== CLAIM TIME DEBUG =====");
console.log("Now:", new Date(now));
console.log("Last Claim:", new Date(lastClaim));
console.log("Difference (ms):", now - lastClaim);
console.log("Difference (hours):", (now - lastClaim) / (1000 * 60 * 60));
console.log("Required (hours):", ONE_DAY / (1000 * 60 * 60));
console.log("============================");

    if (now - lastClaim < ONE_DAY) {
      return res.status(400).json({
        message: "Claim not ready yet"
      });
    }

      const pendingDays = Math.floor((now - lastClaim) / ONE_DAY);

console.log("======== CLAIM DEBUG ========");
console.log("Investment ID:", investment._id);
console.log("Daily Return:", investment.dailyReturn);
console.log("Pending Days:", pendingDays);
console.log("Last Claim:", investment.lastClaimDate);
console.log("Now:", new Date());

const earnings = pendingDays * Number(investment.dailyReturn || 0);

console.log("Earnings:", earnings);
console.log("=============================");

investment.totalEarned = (investment.totalEarned || 0) + earnings;

// Move lastClaimDate forward by the claimed days
investment.lastClaimDate = new Date(
  lastClaim + (pendingDays * ONE_DAY)
);

await investment.save();

   const user = await User.findById(investment.user);

if (!user) {
  return res.status(404).json({
    message: "User not found"
  });
}

user.balance += earnings;
await user.save();

res.json({
  message: "Claim successful",
  earnings,
  newBalance: user.balance,
  investment
});
  } catch (err) {
    console.error("❌ CLAIM ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// GET USER INVESTMENTS
router.get("/:userId", async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.params.userId
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + (inv.investedAmount || 0),
      0
    );

    const totalEarned = investments.reduce(
      (sum, inv) => sum + (inv.totalEarned || 0),
      0
    );

    const activeCount = investments.filter(inv => inv.status === "active").length;

    res.json({
      investments,
      totalInvested,
      totalEarned,
      activeCount
    });

  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;