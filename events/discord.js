import { postLeaderboard } from "../utils/leaderboard.js";
import { sendXp } from "../utils/xp.js";
import { SlashCommandBuilder, Routes } from "discord.js";
import { REST } from "@discordjs/rest";

export function handleDiscordEvents(discordBot, config, watchtime, lurkerTime) {
  // Register slash commands if enabled
  if (config.discord.slashCommandsEnabled) {
    const commands = [];

    if (config.commands.discord.xp) commands.push(new SlashCommandBuilder().setName("xp").setDescription("Check your XP").toJSON());
    if (config.commands.discord.leaderboard) commands.push(new SlashCommandBuilder().setName("leaderboard").setDescription("Show XP leaderboard").toJSON());
    if (config.commands.discord.boost) commands.push(
      new SlashCommandBuilder()
        .setName("boost")
        .setDescription("Give XP to a member")
        .addUserOption(opt => opt.setName("member").setDescription("Target member").setRequired(true))
        .addNumberOption(opt => opt.setName("amount").setDescription("XP amount").setRequired(true))
        .toJSON()
    );

    const rest = new REST({ version: "10" }).setToken(config.discord.token);
    rest.put(Routes.applicationGuildCommands(discordBot.user.id, config.discord.guildId), { body: commands })
      .then(() => console.log("Slash commands registered"))
      .catch(console.error);
  }

  discordBot.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.user.username;

    if (interaction.commandName === "xp" && config.commands.discord.xp) {
      const userXp = watchtime[user] || 0;
      await interaction.reply(`${user}, you have ${Math.floor(userXp)} XP!`);
    }

    if (interaction.commandName === "leaderboard" && config.commands.discord.leaderboard) {
      await postLeaderboard(discordBot, config.discord.channelId, watchtime, lurkerTime);
      await interaction.reply("Leaderboard posted to channel!");
    }

    if (interaction.commandName === "boost" && config.commands.discord.boost) {
      const targetUser = interaction.options.getUser("member").username;
      const amount = interaction.options.getNumber("amount");
      sendXp(targetUser, amount);
      await interaction.reply(`Gave ${amount} XP to ${targetUser}`);
    }
  });

  // End-of-stream message
  discordBot.on("messageCreate", msg => {
    if (msg.channel.id !== config.discord.channelId) return;
    if (msg.content.toLowerCase() === config.discord.endStreamCommand) {
      postLeaderboard(discordBot, config.discord.channelId, watchtime, lurkerTime);
      Object.keys(watchtime).forEach(k => delete watchtime[k]);
      Object.keys(lurkerTime).forEach(k => delete lurkerTime[k]);
    }
  });
}
