// backend/routes/admin.js
import express from "express";
import { getUsers, getTransactions } from "../controllers/adminController.js";
const router = express.Router();

// GET /admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // TODO: Add real auth check here using req.headers.authorization
    const users = await getUsers(); // fetch all users from DB
    const recentTransactions = await getTransactions(); // fetch all recent transactions
    res.json({ users, recentTransactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
