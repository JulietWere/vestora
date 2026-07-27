import User from "../models/User.js";

// ==========================
// LEVEL 1
// Direct referrals
// ==========================
export async function getLevel1(userId) {
  return await User.find({ referredBy: userId }, "-password -__v").lean();
}

// ==========================
// LEVEL 2
// Referrals of Level 1 users
// ==========================
export async function getLevel2(userId) {
  const level1 = await getLevel1(userId);
  const level1Ids = level1.map(user => user._id);

  if (level1Ids.length === 0) return [];

  return await User.find(
    { referredBy: { $in: level1Ids } },
    "-password -__v"
  ).lean();
}

// ==========================
// LEVEL 3
// Referrals of Level 2 users
// ==========================
export async function getLevel3(userId) {
  const level2 = await getLevel2(userId);
  const level2Ids = level2.map(user => user._id);

  if (level2Ids.length === 0) return [];

  return await User.find(
    { referredBy: { $in: level2Ids } },
    "-password -__v"
  ).lean();
}

// ==========================
// FULL TEAM (LEVEL 1 + 2 + 3)
// ==========================
export async function getTeam(userId) {
  const level1 = await getLevel1(userId);
  const level2 = await getLevel2(userId);
  const level3 = await getLevel3(userId);

  return [...level1, ...level2, ...level3];
}