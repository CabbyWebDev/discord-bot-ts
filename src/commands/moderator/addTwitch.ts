import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
} from 'discord.js';
import buttonInteraction from '@/utils/buttonInteraction';
import * as twitchService from '@/services/twitch';
import {
  getTwitchChannel,
  getTwitchStreamData,
  isValidChannelUrl,
} from '@/api/twitch/api';
import { getValidTwitchToken, decryptAccessToken } from '@/api/twitch/auth';
import type { TwitchUser, TwitchStream } from '@/api/twitch/types';
import { formatNumber, formatDate } from '@/utils/helpers';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import logger from '@/utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('addtwitch')
    .setDescription('Add a Twitch streamer to receive updates')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Enter Twitch channel URL')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channelUrl = interaction.options.getString('url') as string;
    const channelName = isValidChannelUrl(channelUrl);

    if (!channelName) {
      await interaction.reply({
        content: '❌ Invalid Twitch channel URL.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { data: twitchToken, error: twitchTokenError } = await tryCatch(
      getValidTwitchToken()
    );

    if (!twitchToken || twitchTokenError) {
      logger.error('Failed to fetch valid twitch token', twitchTokenError);
      return;
    }

    const accessToken = decryptAccessToken(twitchToken);
    const { data: twitchUser, error: channelDataError } = await tryCatch(
      getTwitchChannel(channelName, accessToken)
    );

    if (channelDataError) {
      await interaction.reply({
        content: '⚠️ The channel already exists on the list.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { data: channelStored } = await tryCatch(
      twitchService.isChannelStored(twitchUser.login, interaction.guild.id)
    );

    if (channelStored) {
      await interaction.reply({
        content: '⚠️ The channel already exists on the list.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { data: streamData } = await tryCatch(
      getTwitchStreamData(twitchUser.login, accessToken)
    );

    const addChannelEmbed = await createAddTwitchEmbed(twitchUser);
    const { error: buttonError } = await tryCatch(
      createEmbedButtons(
        interaction,
        addChannelEmbed,
        twitchUser,
        streamData ?? null
      )
    );

    if (buttonError) {
      logger.error('Something went wrong while using buttons', buttonError);
      return;
    }
  },
};

async function createEmbedButtons(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  channelData: TwitchUser,
  streamData: TwitchStream | null
) {
  const message = `Add **${channelData.display_name}** Twitch channel?`;
  const buttons = [
    {
      id: `addTwitchChannel:${interaction.id}`,
      label: 'Add Channel',
      style: ButtonStyle.Success,
    },
    {
      id: `cancelTwitchChannel:${interaction.id}`,
      label: 'Cancel',
      style: ButtonStyle.Danger,
    },
  ];

  const { data: buttonPress, error: buttonPressError } = await tryCatch(
    buttonInteraction(interaction, buttons, message, embed)
  );

  if (buttonPressError || !buttonPress) {
    logger.error('Error during button interaction', buttonPressError);
    return;
  }

  if (buttonPress?.customId === buttons[0]?.id) {
    if (!interaction.guild) return;

    const { error: newChannelError } = await tryCatch(
      twitchService.addNewChannel(
        channelData.id,
        interaction.guild.id,
        channelData.login,
        streamData?.id ?? null
      )
    );

    if (newChannelError) {
      await buttonPress.update({
        content: `❌ Failed to add **${channelData.display_name}** twitch channel.`,
        components: [],
      });

      return;
    }

    await buttonPress.update({
      content: `✅ **${channelData.display_name}** twitch channel has been added.`,
      components: [],
    });
  }

  if (buttonPress.customId === buttons[1]?.id) {
    await buttonPress.update({
      content: '❌ Channel addition canceled.',
      components: [],
      embeds: [],
    });
  }
}

function createAddTwitchEmbed(twitchUser: TwitchUser) {
  const membership =
    twitchUser.broadcaster_type.charAt(0).toUpperCase() +
    twitchUser.broadcaster_type.slice(1);

  const embed = createEmbed({
    color: '#9146FF',
    thumbnail: twitchUser.profile_image_url,
    author: {
      name: twitchUser.display_name,
      iconUrl: twitchUser.profile_image_url,
      url: `https://www.twitch.tv/${twitchUser.login}`,
    },
    fields: [
      {
        name: 'Membership',
        value: membership || 'No membership.',
      },
      {
        name: 'Followers',
        value: formatNumber(twitchUser.followers),
      },
      {
        name: 'Created At',
        value: formatDate(twitchUser.created_at),
      },
    ],
    timestamp: true,
  });

  return embed;
}
