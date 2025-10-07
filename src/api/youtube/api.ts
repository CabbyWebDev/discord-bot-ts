import axios from 'axios';
import Parser from 'rss-parser';
import config from '@/config';
import {
  youtubeSearchSchema,
  youtubeRssFeedSchema,
  youtubeVideoSchema,
  youtubeChannelSchema,
} from './types';

const parser = new Parser();

export async function getChannelIdFromUrl(channelUrl: string) {
  const channelIdMatch = channelUrl.match(
    /youtube\.com\/channel\/(UC[0-9A-Za-z_-]{22})(?=$|[/?#])/
  )?.[1];

  const channelNameMatch = channelUrl.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(@[A-Za-z0-9._-]+)(?=$|[/?#])/
  )?.[1];

  if (!channelIdMatch && !channelNameMatch) {
    throw new Error('Invalid YouTube channel URL');
  }

  const searchUrl = channelIdMatch
    ? `https://www.googleapis.com/youtube/v3/channels?part=id&id=${channelIdMatch}&key=${config.ytApiKey}`
    : `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channelNameMatch}&key=${config.ytApiKey}`;

  const { data: searchData } = await axios.get(searchUrl);
  const parsedData = youtubeSearchSchema.parse(searchData);

  if (!parsedData.items[0]) throw new Error('Invalid YouTube channel URL');

  return parsedData.items[0].id;
}

export async function getLatestVideoId(channelId: string) {
  const feed = await parser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  );
  const parsedFeed = youtubeRssFeedSchema.parse(feed);

  if (!parsedFeed.items || !parsedFeed.items.length) {
    throw new Error('Youtube channel not found');
  }

  const normalVideos = parsedFeed.items.filter((feed) => {
    if (!feed.link) return false;
    if (feed.link.includes('/shorts/')) return false;
    return true;
  });

  if (!normalVideos[0] || !normalVideos.length) {
    throw new Error('No videos found');
  }

  const latestVideoId = normalVideos[0].id.split(':').pop();
  if (!latestVideoId) throw new Error('Invalid video id format');

  return latestVideoId;
}

export async function getLatestVideoData(videoId: string) {
  const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${config.ytApiKey}`;
  const { data: videoData } = await axios.get(videoUrl);
  const parsedVideoData = youtubeVideoSchema.parse(videoData);

  if (!parsedVideoData.items[0] || !parsedVideoData.items.length) {
    throw new Error('No video data found');
  }

  return parsedVideoData.items[0];
}

export async function getChannelData(channelId: string) {
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${config.ytApiKey}`;
  const { data: channelData } = await axios.get(channelUrl);
  const parsedChannelData = youtubeChannelSchema.parse(channelData);

  if (!parsedChannelData.items[0] || !parsedChannelData.items.length) {
    throw new Error('No channel data found');
  }

  return parsedChannelData.items[0];
}
