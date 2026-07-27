import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/transaction.js";

// =========================
// REFERRAL RATES
// =========================
const LEVEL_1_RATE = 0.08; // 8%
const LEVEL_2_RATE = 0.04; // 4%
const LEVEL_3_RATE = 0.02; // 2%

export async function distributeReferralBonus(userId, amount) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {

      const user = await User.findById(userId).session(session);

      if (!user) return;

      // =========================
      // LEVEL 1
      // =========================
      if (user.referredBy) {

        const level1User = await User.findById(user.referredBy).session(session);

        if (
          level1User &&
          level1User._id.toString() !== userId.toString()
        ) {

          const bonus1 = Number((amount * LEVEL_1_RATE).toFixed(2));

          // ADD BONUS
          await User.updateOne(
            { _id: level1User._id },
            {
              $inc: {
                balance: bonus1,
                level1Earnings: bonus1
              }
            },
            { session }
          );

          // SAVE TRANSACTION
          await Transaction.create(
            [
              {
                user: level1User._id,
                type: "Deposit",
                amount: bonus1,
                status: "Completed",
                mpesaMessage: `Level 1 referral bonus from ${user.username}`,
                referralProcessed: true
              }
            ],
            { session }
          );

          // =========================
          // LEVEL 2
          // =========================
          if (level1User.referredBy) {

            const level2User = await User.findById(level1User.referredBy).session(session);

            if (
              level2User &&
              level2User._id.toString() !== userId.toString()
            ) {

              const bonus2 = Number((amount * LEVEL_2_RATE).toFixed(2));

              // ADD BONUS
              await User.updateOne(
                { _id: level2User._id },
                {
                  $inc: {
                    balance: bonus2,
                    level2Earnings: bonus2
                  }
                },
                { session }
              );

              // SAVE TRANSACTION
              await Transaction.create(
                [
                  {
                    user: level2User._id,
                    type: "Deposit",
                    amount: bonus2,
                    status: "Completed",
                    mpesaMessage: `Level 2 referral bonus from ${user.username}`,
                    referralProcessed: true
                  }
                ],
                { session }
              );

              // =========================
              // LEVEL 3
              // =========================
              if (level2User.referredBy) {

                const level3User = await User.findById(level2User.referredBy).session(session);

                if (
                  level3User &&
                  level3User._id.toString() !== userId.toString()
                ) {

                  const bonus3 = Number((amount * LEVEL_3_RATE).toFixed(2));

                  // ADD BONUS
                  await User.updateOne(
                    { _id: level3User._id },
                    {
                      $inc: {
                        balance: bonus3,
                        level3Earnings: bonus3
                      }
                    },
                    { session }
                  );

                  // SAVE TRANSACTION
                  await Transaction.create(
                    [
                      {
                        user: level3User._id,
                        type: "Deposit",
                        amount: bonus3,
                        status: "Completed",
                        mpesaMessage: `Level 3 referral bonus from ${user.username}`,
                        referralProcessed: true
                      }
                    ],
                    { session }
                  );
                }
              }
            }
          }
        }
      }

    });

    console.log("✅ Referral bonuses distributed successfully");

  } catch (err) {

    console.error("❌ REFERRAL BONUS ERROR:", err.message);

  } finally {

    session.endSession();

  }
}