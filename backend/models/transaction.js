import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      enum: ["Deposit", "Withdrawal"],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    mpesaMessage: {
      type: String
    },

    status: {
      type: String,
      enum: ["Pending Approval", "Completed", "Rejected"],
      default: "Pending Approval"
    },

    // 🚀 prevents double referral payouts
    referralProcessed: {
      type: Boolean,
      default: false
    },

    // 🔥 admin tracking (important for audit)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    approvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;