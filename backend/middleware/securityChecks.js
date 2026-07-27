import User from "../models/User.js";

// prevent self-referral abuse
export const preventSelfReferral = async (req, res, next) => {
  try {
    const { referralCode, username } = req.body;

    if (referralCode && username) {
      const referrer = await User.findOne({ referralCode });

      if (referrer && referrer.username === username) {
        return res.status(400).json({
          message: "Self-referral is not allowed"
        });
      }
    }

    next();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};