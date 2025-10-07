import { type Client, ActivityType } from 'discord.js';
import { getGuild, formatNumber } from './helpers';
import tryCatch from './tryCatch';
import logger from './logger';

export default function updateBotPresence(bot: Client) {
  const timeToRefresh = 15000;

  async function updatePresence() {
    const { data: guild, error: guildError } = await tryCatch(getGuild(bot));

    if (guildError) {
      logger.error(`Failed to fetch guild while updating bot presence.`);
      return;
    }

    //const allGuildMembers = guild?.members.cache.filter(
    //  (member) => !member.user.bot
    //).size;

    const onlineMembers = guild.members.cache.filter(
      (member) =>
        (member.presence?.status === 'online' ||
          member.presence?.status === 'dnd') &&
        !member.user.bot
    ).size;

    bot.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: `${formatNumber(onlineMembers)} Active members`,
          type: ActivityType.Watching,
        },
      ],
    });

    setTimeout(updatePresence, timeToRefresh);
  }

  updatePresence();
}
