import axios from 'axios';
import {
  twitchUserSchema,
  twitchStreamSchema,
  twitchFollowsSchema,
} from './types';
import config from '@/config';

export async function getTwitchUserData(
  channelName: string,
  accessToken: string
) {
  const { data: userData } = await axios.get(
    'https://api.twitch.tv/helix/users',
    {
      params: { login: channelName },
      headers: {
        'Client-ID': config.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!userData.data || !userData.data.length) {
    throw new Error(
      `Failed to fetch Twitch user data for username: ${channelName}`
    );
  }

  const parsedUserData = twitchUserSchema.safeParse(userData.data[0]);

  if (!parsedUserData.success) {
    throw new Error(
      `Invalid Twitch user data for channel: ${channelName}, ${parsedUserData.error.message}`
    );
  }

  return parsedUserData.data;
}

export async function getTwitchStreamData(
  channel: string,
  accessToken: string
) {
  const { data: streamData } = await axios.get(
    'https://api.twitch.tv/helix/streams',
    {
      params: { user_login: channel },
      headers: {
        'Client-ID': config.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!streamData.data || !streamData.data.length) return;

  const parsedStreamData = twitchStreamSchema.safeParse(streamData.data[0]);

  if (!parsedStreamData.success) {
    throw new Error(
      `Invalid Twitch stream data for channel: ${channel}, ${parsedStreamData.error.message}`
    );
  }

  return parsedStreamData.data;
}

export async function getTwitchUserFollows(
  userId: string,
  accessToken: string
) {
  const { data: followsData } = await axios.get(
    'https://api.twitch.tv/helix/channels/followers',
    {
      params: {
        broadcaster_id: userId,
      },
      headers: {
        'Client-ID': config.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!followsData) {
    throw new Error(
      `Failed to fetch twitch user follows data, user id: ${userId}`
    );
  }

  const parsedFollows = twitchFollowsSchema.safeParse(followsData.total);

  if (!parsedFollows.success) {
    throw new Error(
      `Invalid Twitch user follows data for user id: ${userId}, ${parsedFollows.error.message}`
    );
  }

  return parsedFollows.data;
}

export function isValidChannelUrl(url: string) {
  const channelName = url.match(
    /^(?:https:\/\/)?(?:www\.)?twitch\.tv\/([a-z0-9_]{3,25})$/
  )?.[1];

  if (!channelName) return;
  return channelName;
}

export async function getTwitchChannel(channel: string, accessToken: string) {
  const userData = await getTwitchUserData(channel, accessToken);
  const followers = await getTwitchUserFollows(userData.id, accessToken);
  const channelData = { ...userData, followers };
  return channelData;
}
