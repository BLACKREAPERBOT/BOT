import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import tmi from "tmi.js";
import fs from "fs";
import express from "express";

// Load config.json without using "assert" syntax
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

// Express server for UptimeRobot / monitoring
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Import event handlers
import { handleTwitchEvents } from "./events/twitch.js";
import { handleDiscordEvents } from "./events/discord.js";

// Shared Data
export const watchtime = {};
export const lurkerTime = {};
export const activeUsers = new Set();

// Discord Bot
export const discordBot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
discordBot.login(process.env.DISCORD_TOKEN);
discordBot.once("ready", () => console.log(`Discord bot logged in as ${discordBot.user.tag}`));

// Twitch Bot
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: { reconnect: true },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH
  },
  channels: [process.env.TWITCH_CHANNEL]
});

twitchClient.connect().catch(console.error);

// Initialize event handlers
handleTwitchEvents(twitchClient, config);
handleDiscordEvents(discordBot, config, watchtime, lurkerTime);

// Optional: handle uncaught promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});
