import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  packageId: {
    type: String,
    required: true
  },

  // ✅ ADD THIS
  name: {
    type: String,
    required: true
  },

  // ✅ FIXED FIELD NAME
  investedAmount: {
    type: Number,
    required: true
  },

  // ✅ FIXED FIELD NAME
  dailyReturn: {
    type: Number,
    required: true
  },

  // ✅ ADD THIS
  duration: {
    type: Number,
    required: true
  },

  totalEarned: {
    type: Number,
    default: 0
  },

  lastClaimDate: {
    type: Date,
    default: Date.now
  },

  startDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    default: "active"
  }

}, { timestamps: true }); // ✅ adds createdAt automatically

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;