import axios from 'axios';
import { cs2UpdateSchema } from './types';

export async function fetchLatestCs2Update() {
  const { data: cs2News } = await axios.get(
    'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/',
    {
      params: {
        appid: 730,
        count: 1,
        maxlength: 300,
        format: 'json',
      },
    }
  );

  if (!cs2News || !cs2News.appnews.newsitems[0]) {
    throw new Error('Failed to fetch CS2 update data from the Steam API');
  }

  const parsedCs2Update = cs2UpdateSchema.safeParse(
    cs2News.appnews.newsitems[0]
  );

  if (!parsedCs2Update.success) {
    throw new Error('Invalid CS2 update data received from Steam API');
  }

  return parsedCs2Update.data;
}
