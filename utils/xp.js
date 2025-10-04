import { discordBot } from "../index.js";
import fetch from "node-fetch";
import config from "../config.json" assert { type: "json" };

export function sendXp(user, amount) {
  if (amount <= 0) return;
  const channel = discordBot.channels.cache.get(config.discord.channelId);
  if (!channel) return;
  channel.send(`/give-xp member: @${user} amount: ${Math.floor(amount)}`);
}

export async function trackLurkers(channelName, watchtime, lurkerTime, lurkerXp) {
  try {
    const res = await fetch(`https://tmi.twitch.tv/group/user/${channelName}/chatters`);
    const data = await res.json();
    const allViewers = [...data.chatters.viewers, ...data.chatters.moderators, ...data.chatters.vips];
    allViewers.forEach(user => {
      if (!watchtime[user]) lurkerTime[user] = (lurkerTime[user] || 0) + lurkerXp;
    });
  } catch (err) {
    console.error("Error tracking lurkers:", err);
  }
}
