import mongoose from "mongoose";

const referralEarningSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true
    },

    level: {
      type: Number,
      enum: [1, 2, 3],
      required: true
    },

    amount: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const ReferralEarning =
  mongoose.models.ReferralEarning ||
  mongoose.model("ReferralEarning", referralEarningSchema);

export default ReferralEarning;