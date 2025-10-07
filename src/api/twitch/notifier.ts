import { type Client } from 'discord.js';
import { decryptAccessToken, getValidTwitchToken } from './auth';
import { getTwitchStreamData, getTwitchChannel } from './api';
import type { TwitchUser, TwitchStream } from './types';
import { formatNumber, formatDate, getGuild } from '@/utils/helpers';
import * as twitchService from '@/services/twitch';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import { sendEmbedMessage } from '@/utils/embedUtils';
import config from '@/config';
import logger from '@/utils/logger';

export default function checkTwitchStreams(bot: Client) {
  const refreshRate = 15 * 60 * 1000;

  async function checkNewStreams() {
    const { data: twitchChannels, error: twitchChannelsError } = await tryCatch(
      twitchService.getAllChannels(config.guildId)
    );

    if (twitchChannelsError) {
      logger.error(
        `Failed to fetch twitch channels from the database, guild id ${config.guildId}`,
        twitchChannelsError
      );

      return;
    }

    for (const twitchChannel of twitchChannels) {
      const { data: twitchToken, error: twitchTokenError } = await tryCatch(
        getValidTwitchToken()
      );

      if (!twitchToken || twitchTokenError) {
        logger.error('Failed to fetch valid twitch token', twitchTokenError);
        return;
      }

      const accessToken = decryptAccessToken(twitchToken);
      const { data: streamData, error: streamDataError } = await tryCatch(
        getTwitchStreamData(twitchChannel.channelName, accessToken)
      );

      if (streamDataError) {
        logger.error(
          `Failed to fetch twitch stream data, channel: ${twitchChannel.channelName}`,
          streamDataError
        );

        continue;
      }

      if (!streamData || twitchChannel.lastStreamId === streamData.id) continue;

      const { error: streamIdUpdateError } = await tryCatch(
        twitchService.updateTwitchStreamId(
          streamData.id,
          twitchChannel.channelId,
          twitchChannel.guildId
        )
      );

      if (streamIdUpdateError) {
        logger.error(
          `Failed to update last stream id, channel: ${twitchChannel.channelName}`,
          streamIdUpdateError
        );

        continue;
      }

      const { data: channelData, error: channelDataError } = await tryCatch(
        getTwitchChannel(twitchChannel.channelName, accessToken)
      );

      if (channelDataError) {
        logger.error(
          `Failed to fetch channel data, channel: ${twitchChannel.channelName}`,
          channelDataError
        );

        continue;
      }

      await sendTwitchLiveEmbed(channelData, streamData, bot);
    }

    setTimeout(checkNewStreams, refreshRate);
  }

  checkNewStreams();
}

async function sendTwitchLiveEmbed(
  channelData: TwitchUser,
  streamData: TwitchStream,
  bot: Client
) {
  const { data: guild, error: guildError } = await tryCatch(getGuild(bot));

  if (guildError) {
    logger.error('Failed to fetch guild while sending twitch live embed.');
    return;
  }

  const streamLiveEmbed = createEmbed({
    color: '#9146FF',
    title: `${channelData.display_name} started streaming!`,
    thumbnail: channelData.profile_image_url,
    description: streamData.title,
    image: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamData.user_login}-1280x720.jpg`,
    author: {
      name: channelData.display_name,
      iconUrl: channelData.profile_image_url,
      url: `https://www.twitch.tv/${channelData.login}`,
    },
    fields: [
      {
        name: 'Content',
        value: streamData.game_name,
      },
      {
        name: 'Viewers',
        value: formatNumber(streamData.viewer_count),
      },
      {
        name: 'Started At',
        value: formatDate(streamData.started_at, true),
      },
    ],
    timestamp: true,
  });

  const { error: streamEmbedError } = await tryCatch(
    sendEmbedMessage(guild, streamLiveEmbed, config.channelIds.twitchStreams)
  );

  if (streamEmbedError) {
    logger.error(
      'Failed to send twitch stream embed to the channel',
      streamEmbedError
    );

    return;
  }
}
