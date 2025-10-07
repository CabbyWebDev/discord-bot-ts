import {
  SlashCommandBuilder,
  MessageFlags,
  ButtonStyle,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';
import {
  getChannelIdFromUrl,
  getLatestVideoId,
  getChannelData,
} from '@/api/youtube/api';
import * as youtubeService from '@/services/youtube';
import { formatNumber, formatDate } from '@/utils/helpers';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import buttonInteraction from '@/utils/buttonInteraction';
import logger from '@/utils/logger';
import { type YoutubeChannel } from '@/api/youtube/types';

export default {
  data: new SlashCommandBuilder()
    .setName('addyoutube')
    .setDescription('Add a YouTube channel to receive updates')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Enter YouTube channel URL')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channelUrl = interaction.options.getString('url') as string;
    const { data: channelId, error: channelIdError } = await tryCatch(
      getChannelIdFromUrl(channelUrl)
    );

    if (channelIdError) {
      await interaction.reply({
        content: `Invalid Youtube URL: ${channelUrl}.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { data: channelStored } = await tryCatch(
      youtubeService.isChannelStored(channelId, interaction.guild.id)
    );

    if (channelStored) {
      await interaction.reply({
        content: '⚠️ The channel already exists on the list.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { data: channelData, error: channelDataError } = await tryCatch(
      getChannelData(channelId)
    );

    if (channelDataError) {
      logger.error(
        `Failed to fetch channel data, channel id: ${channelId}`,
        channelDataError
      );

      return;
    }

    const addChannelEmbed = createAddChannelEmbed(channelId, channelData);
    const { error: buttonError } = await tryCatch(
      createEmbedButtons(
        interaction,
        channelId,
        addChannelEmbed,
        channelData.snippet.title,
        channelData.snippet.customUrl
      )
    );

    if (buttonError) {
      logger.error('Something went wrong while using buttons', buttonError);
    }
  },
};

function createAddChannelEmbed(channelId: string, channelData: YoutubeChannel) {
  const embed = createEmbed({
    color: '#f03d3d',
    thumbnail: channelData.snippet.thumbnails.high.url,
    author: {
      name: channelData.snippet.title,
      iconUrl: channelData.snippet.thumbnails.high.url,
      url: `https://www.youtube.com/channel/${channelId}`,
    },
    fields: [
      {
        name: 'Total Views',
        value: formatNumber(Number(channelData.statistics.viewCount)),
      },
    ],
    timestamp: true,
  });

  if (
    channelData.statistics.subscriberCount &&
    !channelData.statistics.hiddenSubscriberCount
  ) {
    embed.addFields({
      name: 'Subscribers',
      value: formatNumber(Number(channelData.statistics.subscriberCount)),
    });
  }

  embed.addFields(
    {
      name: 'Videos',
      value: formatNumber(Number(channelData.statistics.videoCount)),
    },
    {
      name: 'Created At',
      value: formatDate(channelData.snippet.publishedAt),
    }
  );

  return embed;
}

async function createEmbedButtons(
  interaction: ChatInputCommandInteraction,
  channelId: string,
  embed: EmbedBuilder,
  channelName: string,
  channelCustomName: string
) {
  const message = `Add **${channelName}** YouTube channel?`;
  const buttons = [
    {
      id: `addYoutubeChannel:${interaction.id}`,
      label: 'Add Channel',
      style: ButtonStyle.Success,
    },
    {
      id: `cancelYoutubeChannel:${interaction.id}`,
      label: 'Cancel',
      style: ButtonStyle.Danger,
    },
  ];

  const { data: buttonPress, error: buttonPressError } = await tryCatch(
    buttonInteraction(interaction, buttons, message, embed)
  );

  if (buttonPressError) {
    logger.error('Error during button interaction', buttonPressError);
    return;
  }

  switch (buttonPress?.customId) {
    case buttons[0]?.id:
      const { data: latestVideoId, error: latestVideoIdError } = await tryCatch(
        getLatestVideoId(channelId)
      );

      if (latestVideoIdError) {
        logger.error(
          `Failed to fetch latest video id, channel id: ${channelId}`,
          latestVideoIdError
        );

        return;
      }

      if (!interaction.guild) return;

      const { error: newChannelError } = await tryCatch(
        youtubeService.addNewChannel(
          channelCustomName,
          channelId,
          interaction.guild.id,
          latestVideoId
        )
      );

      if (newChannelError) {
        await buttonPress.update({
          content: `❌ Failed to add **${channelName}** youtube channel.`,
          components: [],
        });

        return;
      }

      await buttonPress.update({
        content: `✅ **${channelName}** youtube channel has been added.`,
        components: [],
      });

      break;
    case buttons[1]?.id:
      await buttonPress.update({
        content: '❌ Channel addition canceled.',
        components: [],
        embeds: [],
      });

      break;
  }
}
