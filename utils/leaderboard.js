import { sendXp } from "./xp.js";

export async function postLeaderboard(discordBot, channelId, watchtime, lurkerTime) {
  const channel = discordBot.channels.cache.get(channelId);
  if (!channel) return;

  const leaderboard = Object.entries(watchtime)
    .concat(Object.entries(lurkerTime))
    .sort((a, b) => b[1] - a[1])
    .map(([user, xp], i) => `${i + 1}. ${user} — ${Math.floor(xp)} XP`)
    .join("\n");

  if (!leaderboard) {
    channel.send("No watchtime data recorded.");
    return;
  }

  channel.send(`📊 **Stream XP Leaderboard:**\n${leaderboard}`);

  Object.entries(watchtime).forEach(([user, xp]) => sendXp(user, xp));
  Object.entries(lurkerTime).forEach(([user, xp]) => sendXp(user, xp));
}
