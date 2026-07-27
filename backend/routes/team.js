import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { getLevel1, getLevel2, getLevel3 } from "../utils/getReferralLevels.js";

const router = express.Router();


// =====================================
// GET DIRECT REFERRALS BY USER ID
// Example: /api/team?userId=xxxxx
// =====================================
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("USER ID RECEIVED:", userId);

    if (!userId || userId === "undefined") {
      return res.json([]);
    }

    let referrerId;

    // CASE 1: If it's a referral code (like FR521L)
    const refByCode = await User.findOne({ referralCode: userId });

    if (refByCode) {
      referrerId = refByCode._id;
    }

    // CASE 2: If it's a Mongo ObjectId
    else if (mongoose.Types.ObjectId.isValid(userId)) {
      referrerId = new mongoose.Types.ObjectId(userId);
    }

    // CASE 3: Invalid input
    else {
      return res.status(400).json({
        message: "Invalid userId or referralCode"
      });
    }

    const users = await User.find({
      referredBy: referrerId
    }).lean();

    return res.json(users);

  } catch (err) {
    console.error("❌ TEAM FETCH ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

// =====================================
// GET FULL REFERRAL LEVELS (1,2,3)
// Example: /api/team/levels/J3ZDUY
// =====================================
router.get("/levels/:referralCode", async (req, res) => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.json({
        level1: [],
        level2: [],
        level3: []
      });
    }

    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      return res.json({
        level1: [],
        level2: [],
        level3: []
      });
    }

    const userId = referrer._id;

    const level1 = await getLevel1(userId);
    const level2 = await getLevel2(userId);
    const level3 = await getLevel3(userId);

    return res.json({
      level1,
      level2,
      level3
    });

  } catch (err) {
    console.error("❌ LEVEL FETCH ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});


// =====================================
// OPTIONAL: DEBUG ROUTE (REMOVE IN PROD)
// =====================================
router.get("/debug/all", async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// =====================================
// SAFETY NOTE
// Removed conflicting route:
// router.get("/:referralCode")
// It breaks routing and causes wrong handler execution
// =====================================


export default router;