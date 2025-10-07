import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import * as twitchService from '@/services/twitch';
import * as youtubeService from '@/services/youtube';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';

export default {
  data: new SlashCommandBuilder()
    .setName('showchannels')
    .setDescription('Shows Twitch or YouTube channels.')
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
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const channelsService = interaction.options.getString('service') as string;

    if (channelsService === 'twitch') {
      const { data: twitchChannels, error: twitchChannelsError } =
        await tryCatch(twitchService.getAllChannels(interaction.guild.id));

      if (twitchChannelsError) {
        await interaction.reply({
          content: '❌ Something went wrong while fetching twitch channels.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (!twitchChannels.length) {
        await interaction.reply({
          content: '⚠️ Twitch channels not found.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const channelLinks = twitchChannels.map(
        (c) => `[**${c.channelName}**](https://twitch.tv/${c.channelName})`
      );
      const channelNames = channelLinks.join(', ');

      const twitchChannelsEmbed = createEmbed({
        color: '#9146FF',
        title: 'Twitch Channels',
        description: channelNames,
        timestamp: true,
      });

      await interaction.reply({
        embeds: [twitchChannelsEmbed],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (channelsService === 'youtube') {
      const { data: youtubeChannels, error: youtubeChannelsError } =
        await tryCatch(youtubeService.getAllChannels(interaction.guild.id));

      if (youtubeChannelsError) {
        await interaction.reply({
          content: '❌ Something went wrong while fetching youtube channels.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (!youtubeChannels.length) {
        await interaction.reply({
          content: '⚠️ YouTube channels not found.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const channelLinks = youtubeChannels.map(
        (c) => `[**${c.channelName}**](https://youtube.com/${c.channelName})`
      );
      const channelNames = channelLinks.join(', ');
      const youtubeChannelsEmbed = createEmbed({
        color: '#f03d3d',
        title: 'YouTube Channels',
        description: channelNames,
        timestamp: true,
      });

      await interaction.reply({
        embeds: [youtubeChannelsEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
