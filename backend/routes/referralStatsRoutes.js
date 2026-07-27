import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ===============================
// TOP EARNERS
// ===============================
router.get("/top-earners", async (req, res) => {
  try {
    const users = await User.find({}, "username level1Earnings level2Earnings level3Earnings balance");

    const sorted = users
      .map(u => ({
        username: u.username,
        totalEarnings:
          (u.level1Earnings || 0) +
          (u.level2Earnings || 0) +
          (u.level3Earnings || 0),
        balance: u.balance
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    res.json(sorted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// USER REFERRAL BREAKDOWN
// ===============================
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      username: user.username,
      referralCode: user.referralCode,
      level1: user.level1Earnings || 0,
      level2: user.level2Earnings || 0,
      level3: user.level3Earnings || 0,
      total:
        (user.level1Earnings || 0) +
        (user.level2Earnings || 0) +
        (user.level3Earnings || 0)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;