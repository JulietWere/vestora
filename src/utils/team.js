// utils/team.js
export async function fetchTeam(referralCode) {
  try {
    if (!referralCode) return [];

    const res = await fetch(`/api/team/invited/${referralCode}`);
    if (!res.ok) throw new Error('Failed to fetch team members');

    const data = await res.json();

    return data.invitedMembers.map(u => ({
      username: u.username,
      bonus: u.bonus || 0,
      joinedAt: u.joinedAt || u.createdAt || new Date()
    }));

  } catch (err) {
    console.error('fetchTeam error:', err);
    return [];
  }
}