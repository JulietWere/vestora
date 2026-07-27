import express from "express";
import { initiateSTK } from "../controllers/mpesaController.js";

const router = express.Router();

/**
 * =====================================
 * STK PUSH INITIATION
 * =====================================
 * POST /api/mpesa/stkpush
 */
router.post("/stkpush", initiateSTK);

/**
 * =====================================
 * MPESA CALLBACK
 * =====================================
 * POST /api/mpesa/callback
 */
router.post("/callback", async (req, res) => {
  console.log("MPESA CALLBACK RECEIVED:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const stk = req.body?.Body?.stkCallback;

    // If structure is invalid
    if (!stk) {
      console.log("Invalid callback structure received");
      return res.json({
        ResultCode: 0,
        ResultDesc: "Ignored"
      });
    }

    // SUCCESSFUL PAYMENT
    if (stk.ResultCode === 0) {
      const items = stk.CallbackMetadata?.Item || [];

      const amount = items.find(i => i.Name === "Amount")?.Value;
      const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
      const phone = items.find(i => i.Name === "PhoneNumber")?.Value;
      const transactionDate = items.find(i => i.Name === "TransactionDate")?.Value;

      console.log("✅ PAYMENT SUCCESS:");
      console.log({
        amount,
        receipt,
        phone,
        transactionDate
      });

      /**
       * =====================================
       * TODO: BUSINESS LOGIC HERE
       * =====================================
       * - Save transaction to DB
       * - Update user balance
       * - Calculate referral bonus
       * - Mark order as paid
       */

    } else {
      // FAILED PAYMENT
      console.log("❌ PAYMENT FAILED:");
      console.log("Reason:", stk.ResultDesc);
    }

    // ALWAYS respond quickly to Safaricom
    return res.json({
      ResultCode: 0,
      ResultDesc: "Success"
    });

  } catch (error) {
    console.error("🔥 Callback Error:", error);

    return res.json({
      ResultCode: 0,
      ResultDesc: "Error handled"
    });
  }
});

export default router;