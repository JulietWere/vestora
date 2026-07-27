import mongoose from "mongoose";
import { nanoid } from "nanoid";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    token: {
      type: String,
      default: null
    },

    referralCode: {
      type: String,
      unique: true,
      index: true
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

      bonus: {
  type: Number,
  default: 0,
  min: 0
},

// Tracks how much bonus this user has generated for their upline
generatedBonus: {
  type: Number,
  default: 0,
  min: 0
},

level1Earnings: {
  type: Number,
  default: 0,
  min: 0
},

    level2Earnings: {
      type: Number,
      default: 0,
      min: 0
    },

    level3Earnings: {
      type: Number,
      default: 0,
      min: 0
    },

    firstDepositDone: {
      type: Boolean,
      default: false
    },
     
      withdrawFullName: {
      type: String,
      default: ""
    },

    withdrawMpesaNumber: {
      type: String,
      default: ""
    }, 
    
    isBlocked: {
      type: Boolean,
      default: false
    },

    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

//
// ✅ SAFE referral code generator (NO middleware crash)
//
userSchema.pre("save", function () {
  if (!this.referralCode) {
    this.referralCode = nanoid(6).toUpperCase();
  }
});

//
// 🔒 hide sensitive fields
//
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.token;
    return ret;
  }
});

export default mongoose.model("User", userSchema);