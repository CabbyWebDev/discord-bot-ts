import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import * as twitchService from '@/services/twitch';
import * as youtubeService from '@/services/youtube';
import tryCatch from '@/utils/tryCatch';

export default {
  data: new SlashCommandBuilder()
    .setName('deletechannel')
    .setDescription('Delete Twitch or YouTube channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('service')
        .setDescription('Choose service')
        .setRequired(true)
        .addChoices(
          { name: 'YouTube', value: 'youtube' },
          { name: 'Twitch', value: 'twitch' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('channel')
        .setDescription('Enter the channel name')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channelService = interaction.options.getString('service') as string;
    const channelName = interaction.options.getString('channel') as string;

    if (channelService === 'twitch') {
      const { data: channelStored } = await tryCatch(
        twitchService.isChannelStored(channelName, interaction.guild.id)
      );

      if (!channelStored) {
        await interaction.reply({
          content: `⚠️ Twitch channel: **${channelName}** has already been deleted or does not exist.`,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const { error: channelDeleteError } = await tryCatch(
        twitchService.deleteChannel(channelName, interaction.guild.id)
      );

      if (channelDeleteError) {
        await interaction.reply({
          content: '❌ Something went wrong while deleting the channel.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      await interaction.reply({
        content: `✅ **${channelName}** twitch channel has been deleted.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (channelService === 'youtube') {
      const { data: channelStored } = await tryCatch(
        youtubeService.isChannelStored(channelName, interaction.guild.id)
      );

      if (!channelStored) {
        await interaction.reply({
          content: `⚠️ YouTube channel ${channelName} has already been deleted or does not exist.`,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const { error: channelDeleteError } = await tryCatch(
        youtubeService.deleteChannel(channelName, interaction.guild.id)
      );

      if (channelDeleteError) {
        await interaction.reply({
          content: '❌ Something went wrong while deleting the channel.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      await interaction.reply({
        content: `✅ ${channelName} youtube channel has been deleted.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
