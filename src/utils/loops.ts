import { Client, ActivityType } from 'discord.js';
import {
  getExpiredBans,
  removeBan,
  type BanDataType,
} from '../database/dbUtils';
import config from '../config/main';
import logger from './logger';

export function startLoops(bot: Client) {
  updateGuildMembers(bot);
  checkExpiredBans(bot);
}

export function updateGuildMembers(bot: Client) {
  const refreshRate = 10000;

  setInterval(() => {
    const guild = bot.guilds.cache.get(config.guildId);
    //const allGuildMembers = guild?.members.cache.filter(
    //  (member) => !member.user.bot
    //).size;
    const onlineMembers = guild?.members.cache.filter(
      (member) => member.presence?.status === 'online' && !member.user.bot
    ).size;

    bot.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: `${onlineMembers} Active members`,
          type: ActivityType.Watching,
        },
      ],
    });
  }, refreshRate);
}

export function checkExpiredBans(bot: Client) {
  const refreshRate = 1000 * 60 * 5;

  setInterval(async () => {
    const expiredBans = getExpiredBans() as BanDataType[];

    for (const ban of expiredBans) {
      try {
        const guild = bot.guilds.cache.get(ban.guildId);

        if (!guild) {
          logger.warn(
            `Could not find guild with ID ${ban.guildId} while unbanning user ${ban.userId}.`
          );
          continue;
        }

        const discordBans = await guild.bans.fetch();

        if (discordBans.has(ban.userId)) {
          await guild.members.unban(ban.userId, 'Ban expired.');
          removeBan(ban.userId, ban.guildId);
        }
      } catch (err) {
        logger.error(
          `Failed to fetch discord ban list in guild ${ban.guildId}:`,
          err
        );
      }
    }
  }, refreshRate);
}
