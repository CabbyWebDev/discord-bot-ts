import { Client, Events, ChatInputCommandInteraction } from 'discord.js';
import { createInteractionEmbed, sendEmbedLog } from '../utils/embedUtils';
import { getChannelName } from '../utils/helpers';
import { logChannels } from '../config/main';
import logger from '../utils/logger';
import config from '../config/main';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction, bot: Client) {
    if (!interaction.isChatInputCommand()) return;

    const command = bot.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, bot);

      if (config.enableCommandLogs) {
        const channelName = getChannelName(interaction.channel);
        const interactionEmbed = createInteractionEmbed(
          interaction,
          channelName
        );

        try {
          await sendEmbedLog(
            interaction,
            interactionEmbed,
            logChannels.commandsChannelId
          );
        } catch (err) {
          logger.error('Failed to send embed command log:', err);
        }
      }
    } catch (err) {
      logger.error(
        `Failed to execute command ${interaction.commandName}:`,
        err
      );
    }
  },
};
