import {
  type Client,
  Events,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { sendEmbedMessage } from '@/utils/embedUtils';
import { getChannelName, getMemberRoles } from '@/utils/helpers';
import createEmbed from '@/utils/createEmbed';
import tryCatch from '@/utils/tryCatch';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction, bot: Client) {
    if (!interaction.isChatInputCommand()) return;

    const command = bot.commands.get(interaction.commandName);
    const { error: commandError } = await tryCatch(
      command.execute(interaction, bot)
    );

    if (commandError) {
      logger.error(
        `Failed to execute command /${interaction.commandName}:`,
        commandError
      );

      return;
    }

    const interactionEmbed = newInteractionEmbed(
      interaction,
      getChannelName(interaction.channel)
    );

    if (!interaction.guild) {
      logger.error('Failed to send embed log, interaction guild not found');
      return;
    }

    const { error: embedError } = await tryCatch(
      sendEmbedMessage(
        interaction.guild,
        interactionEmbed,
        config.channelIds.commands
      )
    );

    if (embedError) {
      logger.error('Failed to send embed command log:', embedError);
    }
  },
};

function newInteractionEmbed(
  interaction: ChatInputCommandInteraction,
  channelName: string
) {
  const embed = createEmbed({
    color: '#3498db',
    title: `/${interaction.commandName}`,
    author: {
      name: interaction.user.tag,
      iconUrl: interaction.user.displayAvatarURL(),
    },
    footer: { text: channelName },
    timestamp: true,
  });

  if (interaction.member && interaction.guild) {
    const memberRoles = getMemberRoles(interaction.member, interaction.guild);

    if (memberRoles.length > 0) {
      embed.setDescription(`Member role: ${memberRoles[0]}`);
    }
  }

  return embed;
}
