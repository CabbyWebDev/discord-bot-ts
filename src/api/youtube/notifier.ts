import { type Client } from 'discord.js';
import { formatNumber, getGuild } from '@/utils/helpers';
import { sendEmbedMessage } from '@/utils/embedUtils';
import { getLatestVideoData, getChannelData, getLatestVideoId } from './api';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import * as youtubeService from '@/services/youtube';
import config from '@/config';
import logger from '@/utils/logger';

export default function checkYoutubeVideos(bot: Client) {
  const refreshRate = 15 * 60 * 1000;

  async function checkNewVideos() {
    const { data: guild, error: guildError } = await tryCatch(getGuild(bot));

    if (guildError) {
      logger.error('Failed to fetch guild while checking new youtube videos.');
      setTimeout(checkNewVideos, refreshRate);
      return;
    }

    const { data: youtubeChannels, error: youtubeChannelsError } =
      await tryCatch(youtubeService.getAllChannels(config.guildId));

    if (youtubeChannelsError) {
      logger.error(
        `Failed to fetch youtube channels, guild id ${config.guildId}`,
        youtubeChannelsError
      );

      setTimeout(checkNewVideos, refreshRate);
      return;
    }

    for (const { channelId } of youtubeChannels) {
      const { data: newVideoId, error: newVideoIdError } = await tryCatch(
        getLatestVideoId(channelId)
      );

      if (newVideoIdError) {
        logger.error(
          `Failed to fetch latest video id, channel id ${channelId}`,
          newVideoIdError
        );

        continue;
      }

      const { data: isPosted, error: isPostedError } = await tryCatch(
        youtubeService.isVideoPosted(channelId, guild.id, newVideoId)
      );

      if (isPostedError) {
        logger.error(
          `Failed to check is video posted or not, channel id: ${channelId}`,
          isPostedError
        );

        continue;
      }

      if (isPosted) continue;

      const { data: channelData, error: channelDataError } = await tryCatch(
        getChannelData(channelId)
      );

      if (channelDataError) {
        logger.error(
          `Failed to fetch channel data, channel id: ${channelId}`,
          channelDataError
        );

        continue;
      }

      const { data: videoData, error: videoDataError } = await tryCatch(
        getLatestVideoData(newVideoId)
      );

      if (videoDataError) {
        logger.error(
          `Failed to fetch video data, video id: ${newVideoId}`,
          videoDataError
        );

        continue;
      }

      const duration = formatVideoDuration(videoData.contentDetails.duration);
      const embed = createEmbed({
        color: '#ff4c4c',
        title: videoData.snippet.title,
        url: `https://www.youtube.com/watch?v=${newVideoId}`,
        image:
          videoData.snippet.thumbnails.maxres?.url ||
          videoData.snippet.thumbnails.high.url,
        author: {
          name: videoData.snippet.channelTitle,
          iconUrl: channelData.snippet.thumbnails.default.url,
          url: `https://www.youtube.com/channel/${channelId}`,
        },
        fields: [
          {
            name: '⏱️ Duration',
            value: duration,
            inline: true,
          },
        ],
        footer: {
          text: videoData.snippet.channelTitle,
          iconUrl: channelData.snippet.thumbnails.default.url,
        },
        timestamp: new Date(videoData.snippet.publishedAt),
      });

      if (videoData.statistics.viewCount) {
        const views = formatNumber(Number(videoData.statistics.viewCount));

        embed.addFields({
          name: '🔍 Views',
          value: views,
          inline: true,
        });
      }

      if (videoData.statistics.likeCount) {
        const likes = formatNumber(Number(videoData.statistics.likeCount));

        embed.addFields({
          name: '🔥 Likes',
          value: likes,
          inline: true,
        });
      }

      const { error: embedError } = await tryCatch(
        sendEmbedMessage(guild, embed, config.channelIds.messages)
      );

      if (embedError) {
        logger.error('Failed to send new youtube video embed', embedError);
        continue;
      }

      const { error: videoUpdateError } = await tryCatch(
        youtubeService.updatePostedVideo(channelId, guild.id, newVideoId)
      );

      if (videoUpdateError) {
        logger.error(
          `Failed to update youtube video, channel id: ${channelId}`
        );

        continue;
      }
    }

    setTimeout(checkNewVideos, refreshRate);
  }

  checkNewVideos();
}

export function formatVideoDuration(isoDuration: string) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'No duration';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  }

  return [minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}
