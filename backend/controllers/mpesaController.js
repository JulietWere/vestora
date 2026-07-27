import { stkPush } from "../services/stkPush.js";

export const initiateSTK = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        message: "Phone and amount are required"
      });
    }

    const response = await stkPush(phone, amount);

    return res.status(200).json({
      message: "STK Push initiated",
      data: response
    });

  } catch (err) {
    console.error("🔥 STK PUSH ERROR FULL:", err.response?.data || err.message || err);

    return res.status(500).json({
      message: "STK Push failed",
      error: err.response?.data || err.message
    });
  }
};