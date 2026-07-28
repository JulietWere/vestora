import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import Transaction from "../models/transaction.js";

const router = express.Router();

// =====================
// GENERATE REFERRAL CODE
// =====================
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// =====================
// REGISTER USER
// =====================
router.post("/register", async (req, res) => {
  try {
    const { username, password, referralCode } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashed,
      referralCode: generateReferralCode(),
      referredBy: null
    });

    // 🔥 MOVE THIS UP so it's accessible later
    let refUser = null;

    // =====================
    // REFERRAL PROCESSING (BEFORE SAVE)
    // =====================
    if (referralCode) {
      refUser = await User.findOne({ referralCode });

      if (refUser) {
        newUser.referredBy = refUser._id;

        await Referral.updateOne(
          { user: refUser._id },
          {
            $push: { referredUsers: newUser._id }
          }
        );
      }
    }

    await newUser.save();
    console.log("REF USER FOUND:", refUser);

    // =====================
    // BONUS AFTER SAVE (SAFE NOW)
    // =====================
    if (refUser) {
      const bonus = 50;

      await User.updateOne(
        { _id: refUser._id },
        { $inc: { balance: bonus } }
      );

      await Transaction.create({
        user: refUser._id,
        type: "Referral Bonus",
        amount: bonus,
        status: "Completed"
      });
    }

    // =====================
    // CREATE REFERRAL RECORD
    // =====================
    await Referral.create({
      code: newUser.referralCode,
      user: newUser._id,
      referredUsers: []
    });

    res.json({
      message: "User registered successfully!",
      user: newUser
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

export default router;