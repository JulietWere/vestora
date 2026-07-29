import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log("🔥 JWT CHECK:", process.env.JWT_SECRET);

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./models/User.js";
import Transaction from "./models/transaction.js";
import Referral from "./models/Referral.js";
import Investment from "./models/Investment.js";
import jwt from "jsonwebtoken";
import authMiddleware from "./middleware/authMiddleware.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import { getTeam } from "./utils/getReferralLevels.js";
 import { distributeReferralBonus } from "./utils/referralBonus.js";
 import adminRoutes from "./routes/adminRoutes.js";
 import referralStatsRoutes from "./routes/referralStatsRoutes.js";
 import mpesaRoutes from "./routes/mpesaRoutes.js";
 


console.log("🚀 SERVER FILE RUNNING: server.js");

console.log("🚀 SERVER INSTANCE STARTED");


// ------------------ App & Server ------------------
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// ------------------ Middleware ------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

app.use("/api/investments", investmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/referrals", referralStatsRoutes);
app.use("/api/mpesa", mpesaRoutes);



const getReferralTree = async (userId) => {
     const direct = await User.find({ referredBy: userId })
  .select("username referralCode generatedBonus referredBy")
  .lean();

  let result = [...direct];

  for (const user of direct) {
    const children = await getReferralTree(user._id);
    result = result.concat(children);
  }

  return result;
};


app.get("/debug-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    console.log("🔥 MONGOOSE USER:", user);

    const raw = await mongoose.connection.db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    console.log("🧪 RAW USER:", raw);

    res.json({
      mongooseResult: user,
      rawMongo: raw
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ------------------ Admin Data ------------------
const admins = [
  { username: "admin", password: "200720", token: "ADMIN123TOKEN" }
];

// ------------------ Admin Auth Middleware ------------------
async function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Admin token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
// ------------------ Admin Login ------------------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password required" });

  const admin = admins.find(a => a.username === username);
  if (!admin || admin.password !== password) return res.status(401).json({ message: "Invalid admin credentials" });

  res.json({ message: "Admin login successful", token: admin.token, admin: { username: admin.username } });
});


app.get("/api/admin/transactions", async (req, res) => {
  try {

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate("user", "username");

    res.json(transactions);

  } catch (err) {
    console.error("ADMIN TRANSACTIONS ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// ------------------ register ------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, referralCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // check existing user
    const exists = await User.findOne({
      username: new RegExp(`^${username}$`, "i")
    });

    if (exists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    let referredBy = null;

    // referral logic (ONLY lookup)
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });

      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }

      // prevent self referral
      if (referrer.username === username) {
        return res.status(400).json({ message: "Self referral not allowed" });
      }

      referredBy = referrer._id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const myReferralCode = nanoid(6).toUpperCase();

    const newUser = await User.create({
      username,
      password: hashedPassword,
      referralCode: myReferralCode,
      referredBy
    });

    res.status(201).json({
      message: "User registered successfully!",
      referralCode: myReferralCode
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------ Login ------------------
console.log("🔥 AUTH ROUTES LOADED");
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("🔥 BODY RECEIVED:", req.body);
    const { username, password } = req.body;

    // ✅ validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // ✅ find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ blocked check
    if (user.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    // ✅ check JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET not set in .env" });
    }

    // ✅ create token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🧾 LOGIN USER:", user.username);
console.log("🆔 USER ID:", user._id);
console.log("🎟️ TOKEN:", token);

    // ✅ response
    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        balance: user.balance,
        bonus: user.bonus,
        referralCode: user.referralCode,
        isBlocked: user.isBlocked,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

function calculateEarnings(inv) {
  const now = Date.now();

  const start = new Date(inv.startDate || inv.createdAt).getTime();
  const lastClaim = new Date(inv.lastClaimDate || inv.createdAt).getTime();

  const from = Math.max(start, lastClaim);

  const days = Math.floor((now - from) / (24 * 60 * 60 * 1000));

  if (days <= 0) return 0;

  return days * (inv.dailyReturn || 0);
}

// ------------------ Get Portfolio ------------------
  
app.get("/api/portfolio", async (req, res) => {
  try {
    console.log("🔥 PORTFOLIO ROUTE HIT");

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No auth header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

       const user = await User.findById(decoded._id);

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

console.log("👤 Logged in user:", user._id);

const investments = await Investment.find({ user: user._id });

console.log("📦 Investments found:", investments);

const allInvestments = await Investment.find();

console.log("🗄️ ALL INVESTMENTS:", allInvestments);

let totalEarned = 0;

    const updatedInvestments = await Promise.all(
  investments.map(async (inv) => {

    const earned = calculateEarnings(inv);

    totalEarned += inv.totalEarned || 0;

    return {
      ...inv.toObject(),
      pendingEarned: earned
    };
  })
);

    console.log("📦 INVESTMENTS:", updatedInvestments.length);
    console.log("💰 TOTAL EARNED (CALCULATED):", totalEarned);

    res.json({
      balance: user.balance,
      investments: updatedInvestments,
      bonus: user.bonus,
      username: user.username,
      totalEarned
    });

  } catch (err) {
    console.error("❌ PORTFOLIO ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// ------------------ Get Current User ------------------
app.get("/api/team", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    // Get all levels
    const team = await getReferralTree(user._id);

    console.log("LOGGED IN USER:", user.username, user._id);
     console.log("TEAM FOUND:", team);


    res.json({
      user: {
        username: user.username,
        referralCode: user.referralCode,
        bonus: user.bonus,
        level1Earnings: user.level1Earnings,
        level2Earnings: user.level2Earnings,
        level3Earnings: user.level3Earnings
      },
      members: team
    });


  } catch (err) {

    console.error("TEAM ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// ------------------ Get All Users ------------------
app.get("/api/users", async (req, res) => {
  try {
    const { referredBy } = req.query;

    // ✅ return all users if no filter
    if (!referredBy || referredBy === "undefined") {
      const users = await User.find({}, "-password -__v").lean();
      return res.json(users);
    }

    // ✅ find referrer by referralCode
    const referrer = await User.findOne({ referralCode: referredBy });

    if (!referrer) return res.json([]);

    // 🔥 LEVEL 1
    const level1 = await User.find({ referredBy: referrer._id });

    const level1Ids = level1.map(u => u._id);

    // 🔥 LEVEL 2
    const level2 = await User.find({ referredBy: { $in: level1Ids } });

    const level2Ids = level2.map(u => u._id);

    // 🔥 LEVEL 3
    const level3 = await User.find({ referredBy: { $in: level2Ids } });

    // combine team
    const team = [...level1, ...level2, ...level3];

    return res.json(team);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------ Block / Unblock ------------------
app.put("/api/admin/block/:username", adminAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    io.emit("userUpdated", user);
    res.json({ message: `User ${user.isBlocked ? "blocked" : "unblocked"}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Make / Revoke Admin ------------------
app.put("/api/admin/admin/:username", adminAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isAdmin = !user.isAdmin;
    await user.save();

    io.emit("userUpdated", user);
    res.json({ message: `User ${user.isAdmin ? "granted" : "revoked"} admin`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Deposit ------------------
app.post("/api/transactions/deposit", async (req, res) => {
  try {
    // ---------------- AUTH ----------------
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized: Missing Authorization header"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: Missing token"
      });
    }

    // ---------------- VERIFY TOKEN ----------------
    const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);

console.log("DECODED:", decoded);
console.log("SEARCHING FOR ID:", decoded._id);

const user = await User.findById(decoded._id);

console.log("FOUND USER:", user);

if (!user) {
  return res.status(404).json({
    message: "User not found"
  });
}


    // ---------------- REQUEST DATA ----------------
console.log("REQ.BODY:", req.body);
console.log("AMOUNT:", req.body.amount);
console.log("TYPE OF AMOUNT:", typeof req.body.amount);

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid deposit amount"
      });
    }

    // ---------------- CREATE PENDING DEPOSIT ----------------
     const deposit = new Transaction({
  user: user._id,
  type: "Deposit",
  amount: Number(amount),
  status: "Pending Approval"
});

    await deposit.save();

    // ---------------- RESPONSE ----------------
    res.status(200).json({
      message: "Deposit submitted and waiting for admin approval",
      transaction: deposit
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

app.get("/api/transactions/history", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const transactions = await Transaction.find({
  user: decoded._id,
  type: "Deposit"
}).sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }
});

// ------------------ Withdraw ------------------
app.post("/api/transactions/withdraw", async (req, res) => {
  try {
    console.log("AUTH HEADER:", req.headers.authorization);

    // ---------------- TOKEN EXTRACTION ----------------
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    console.log("TOKEN ONLY:", token);

    // ---------------- VERIFY TOKEN ----------------
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("DECODED TOKEN:", decoded);
    } catch (err) {
      console.log("JWT ERROR:", err.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    // ---------------- FIND USER ----------------
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { amount } = req.body;

// validation
if (!amount || amount < 100) {
      return res.status(400).json({
        message: "Minimum withdrawal is KES 100"
      });
    }

if (user.balance < amount) {
  return res.status(400).json({ message: "Insufficient balance" });
}

// ✅ DEDUCT BALANCE HERE
await User.updateOne(
  { _id: user._id },
  { $inc: { balance: -amount } }
);

// create transaction
const tx = await Transaction.create({
  user: user._id,
  type: "Withdrawal",
  amount: Number(amount),
  status: "Pending Approval",
});

io.emit("newTransaction", tx);

res.json({
  success: true,
  message: "Withdrawal submitted, waiting for admin approval",
  transaction: tx
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/user/withdraw-details", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);

    res.json({
      success: true,
      withdrawFullName: user.withdrawFullName,
      withdrawMpesaNumber: user.withdrawMpesaNumber
    });

  } catch (err) {
    console.error("GET WITHDRAW DETAILS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


app.post("/api/transactions/reject-withdraw", async (req, res) => {

    // =========================
    // 🔐 VERIFY ADMIN
    // =========================
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
        message: "Invalid token"
      });
    }


    const admin = await User.findById(decoded._id);

    if (!admin || admin.isAdmin !== true) {
      return res.status(403).json({
        message: "Admin access required"
      });
    }
  const { transactionId } = req.body;

  const tx = await Transaction.findById(transactionId);
  if (!tx || tx.status !== "Pending Approval") {
    return res.status(400).json({ message: "Invalid transaction" });
  }

  // refund user
  await User.updateOne(
    { _id: tx.user },
    { $inc: { balance: tx.amount } }
  );

  tx.status = "Rejected";
  await tx.save();

  res.json({ message: "Withdrawal rejected and refunded" });
});

// ------------------ Get All Transactions ------------------
app.get("/api/transactions", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded._id);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    let transactions;

    if (currentUser.isAdmin) {
      // Admin sees all transactions
      transactions = await Transaction.find()
        .populate("user", "username")
        .sort({ createdAt: -1 });
    } else {
      // Users see only their own
      transactions = await Transaction.find({
        user: currentUser._id
      }).sort({ createdAt: -1 });
    }

    res.json(transactions);

  } catch (err) {
    console.error("TRANSACTIONS ERROR:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
});
  
// --- Socket Listener for Real-Time Admin-Approved Deposits ---
  app.post("/api/admin/transactions/approve", async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const user = await User.findById(tx.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User:", user.username);
    console.log("Transaction Type:", tx.type);

    // =========================
    // 💰 DEPOSIT APPROVAL
    // =========================
    if (tx.type === "Deposit") {

      if (tx.status !== "Completed") {
        user.balance += tx.amount;
        tx.status = "Completed";
        tx.approvedAt = new Date();
      }

      // Referral bonus ONLY on deposits
      if (user.referredBy && !tx.referralProcessed) {

        const referrer = await User.findById(user.referredBy);

        console.log("Referrer:", referrer);

        if (referrer) {

          const bonus = tx.amount * 0.1;

          console.log("BONUS:", bonus);

            referrer.balance += bonus;
referrer.bonus += bonus;
referrer.level1Earnings += bonus;

// Save how much this referred user has earned for the upline
user.generatedBonus = (user.generatedBonus || 0) + bonus;

      await user.save();

const savedUser = await User.findById(user._id).lean();

console.log("SAVED USER:", {
  username: savedUser.username,
  generatedBonus: savedUser.generatedBonus
});

await referrer.save();

io.to(referrer._id.toString()).emit("referralBonus", {
  referralCode: referrer.referralCode,
  bonus
});

io.to(referrer._id.toString()).emit("walletUpdate");

tx.referralProcessed = true;
        }
      }
    }


    // =========================
    // 💸 WITHDRAWAL APPROVAL
    // =========================
    else if (tx.type === "Withdrawal") {

      // Balance was already deducted when withdrawal was created
      tx.status = "Completed";
      tx.approvedAt = new Date();

    }


    await user.save();
    await tx.save();


    res.json({
      message: `${tx.type} approved successfully`,
      transaction: tx
    });


  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Investment Routes ------------------
app.post("/api/investments", async (req, res) => {
  try {
    console.log("🔥 CREATE INVESTMENT HIT");

    // ---------------- AUTH ----------------
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ---------------- INPUT ----------------
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ message: "Package ID required" });
    }

    console.log("📦 PACKAGE:", packageId);

    // ---------------- PACKAGE CONFIG ----------------
       const PACKAGES = {
  vip1: { name: "VIP 1", amount: 1200, daily: 75, duration: 30 },
  vip2: { name: "VIP 2", amount: 2400, daily: 160, duration: 30 },
  vip3: { name: "VIP 3", amount: 6500, daily: 288, duration: 30 },
  vip4: { name: "VIP 4", amount: 9700, daily: 516, duration: 30 }
};


    const pkg = PACKAGES[packageId];

    if (!pkg) {
      return res.status(400).json({ message: "Invalid package" });
    }

    // ---------------- PREVENT DUPLICATE ----------------
    const existing = await Investment.findOne({
      user: decoded._id,
      packageId
    });

    if (existing) {
      return res.status(400).json({
        message: "Already invested in this package"
      });
    }

    // ---------------- GET USER ----------------
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < pkg.amount) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    // ---------------- DEDUCT BALANCE ----------------
    user.balance -= pkg.amount;

    // ---------------- CREATE INVESTMENT ----------------
    const investment = new Investment({
      user: decoded._id,
      packageId,
      name: pkg.name,
      investedAmount: pkg.amount,
      dailyReturn: pkg.daily,
      duration: pkg.duration,
      totalEarned: 0,
      status: "active",
      startDate: new Date(),
      lastClaimDate: new Date()
    });

    await investment.save();
    await user.save();
     
    const savedInvestment = await Investment.findById(investment._id);
console.log("✅ Saved investment from DB:", savedInvestment);
    console.log("✅ INVESTMENT SAVED:", investment);

    // ---------------- RESPONSE ----------------
    res.status(201).json({
      message: "Investment created successfully",
      balance: user.balance,
      investment
    });

  } catch (err) {
    console.error("🔥 CREATE INVESTMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/investments/:packageId", async (req, res) => {
  try {
    const { packageId } = req.params;
    const { userId, lastClaimDate } = req.body;

    const inv = await Investment.findOne({ packageId, user: userId });
    if (!inv) return res.status(404).json({ message: "Investment not found" });

    inv.lastClaimDate = lastClaimDate;
    await inv.save();

    res.json(inv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update investment" });
  }
});


setInterval(async () => {
  try {
    console.log("⚡ AUTO EARNINGS RUNNING...");

    const investments = await Investment.find();

    for (let inv of investments) {
      if (!inv.amount || inv.amount <= 0) continue;

      const user = await User.findById(inv.user);
      if (!user) continue;

      // 💰 DAILY PROFIT (10%)
      const profit = inv.amount * 0.1;

      user.balance = Number(user.balance || 0) + profit;
      await user.save();

      inv.totalEarned = Number(inv.totalEarned || 0) + profit;
      inv.lastClaimDate = new Date();

      await inv.save();
    }

    console.log("✅ AUTO EARNINGS COMPLETED");
  } catch (err) {
    console.error("🔥 AUTO EARN ERROR:", err);
  }
}, 24 * 60 * 60 * 1000); // every 24 hours


// ------------------ Socket.io ------------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1️⃣ Join a room for a specific user
  socket.on("joinUserRoom", (userId) => {
    socket.join(userId); // Room name = user ID
    console.log(`Socket ${socket.id} joined room for user: ${userId}`);
  });

  // 2️⃣ Optional: Admin room
  socket.on("joinAdminRoom", () => {
    socket.join("adminRoom");
    console.log(`Socket ${socket.id} joined admin room`);
  });

  // 3️⃣ Handle disconnect
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);

  res.status(500).json({
    message: err.message,
    stack: err.stack
  });
})
// ------------------ Start Server ------------------

const startServer = async () => {
  try {
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI starts with:", process.env.MONGO_URI?.substring(0, 30));
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected ✅");
    console.log("📦 DB NAME:", mongoose.connection.db.databaseName);
    console.log("🖥️ HOST:", mongoose.connection.host);

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log("Server running on port", PORT, "🚀");
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err); // 👈 IMPORTANT
    process.exit(1);
  }
};

startServer();  `                                                                                                                                                                                             `
