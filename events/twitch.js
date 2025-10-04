import { activeUsers, watchtime, lurkerTime } from "../index.js";
import { sendXp, trackLurkers } from "../utils/xp.js";

export function handleTwitchEvents(twitchClient, config) {
  twitchClient.on("message", (channel, tags, message, self) => {
    if (self) return;
    const user = tags["display-name"];

    if (config.twitch.trackChat) {
      activeUsers.add(user);
      watchtime[user] = (watchtime[user] || 0) + config.xp.message;
    }

    // Twitch commands
    if (config.commands.twitch.hello && message.toLowerCase() === "!hello") {
      twitchClient.say(channel, `Hello @${user}! Thanks for watching!`);
    }
    if (config.commands.twitch.xp && message.toLowerCase() === "!xp") {
      const xp = watchtime[user] || 0;
      twitchClient.say(channel, `@${user}, you have ${Math.floor(xp)} XP!`);
    }
    if (config.commands.twitch.leaderboard && message.toLowerCase() === "!leaderboard") {
      const leaderboard = Object.entries(watchtime)
        .concat(Object.entries(lurkerTime))
        .sort((a, b) => b[1] - a[1])
        .map(([u, xp], i) => `${i + 1}. ${u} — ${Math.floor(xp)} XP`)
        .join(" | ");
      twitchClient.say(channel, `Leaderboard: ${leaderboard}`);
    }
  });

  if (config.twitch.trackSubscriptions) {
    twitchClient.on("subscription", (channel, user) => sendXp(user, config.xp.subscription));
  }

  if (config.twitch.trackBits) {
    twitchClient.on("cheer", (channel, user, msg) => {
      const bits = parseInt(msg.bits) || 0;
      sendXp(user, bits * config.xp.bit);
    });
  }

  if (config.twitch.trackRaids) {
    twitchClient.on("raided", (channel, username, viewers) => {
      const bonusXp = config.xp.raidBonusBase + viewers * config.xp.raidBonusPerViewer;
      console.log(`Raid by ${username} with ${viewers} viewers! Giving ${bonusXp} XP`);
      sendXp(username, bonusXp);
    });
  }

  // Increment chat and lurker XP every interval
  setInterval(() => {
    activeUsers.forEach(user => {
      watchtime[user] = (watchtime[user] || 0) + config.xp.chatMinute;
    });
    activeUsers.clear();

    if (config.twitch.trackLurkers) {
      trackLurkers(config.twitch.channel, watchtime, lurkerTime, config.xp.lurkerMinute);
    }
  }, config.timers.checkIntervalMs);
}
