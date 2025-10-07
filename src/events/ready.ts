import { type Client, Events } from 'discord.js';
import updateBotPresence from '@/utils/updatePresence';
import checkExpiredBans from '@/utils/expiredBans';
import checkYoutubeVideos from '@/api/youtube/notifier';
import checkTwitchStreams from '@/api/twitch/notifier';
import checkCs2Updates from '@/api/cs2/notifier';
import logger from '@/utils/logger';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(bot: Client) {
    logger.info(`${bot.user?.tag} is up and running!`);
    updateBotPresence(bot);
    checkExpiredBans(bot);
    checkYoutubeVideos(bot);
    checkTwitchStreams(bot);
    checkCs2Updates(bot);
  },
};
