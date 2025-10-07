import { type Client } from 'discord.js';
import * as banService from '@/services/ban';
import config from '@/config';
import tryCatch from './tryCatch';
import { getGuild } from './helpers';
import logger from './logger';

export default function checkExpiredBans(bot: Client) {
  const refreshRate = 1000 * 60 * 5;
  //const refreshRate = 5000;

  async function checkBans() {
    const { data: expiredBans, error: expiredBansError } = await tryCatch(
      banService.getExpiredGuildBans(config.guildId)
    );

    if (expiredBansError) {
      logger.error(
        `Failed to fetch bans from Discord guild (id: ${config.guildId})`,
        expiredBansError
      );

      return;
    }

    for (const memberBan of expiredBans) {
      const { data: guild, error: guildError } = await tryCatch(
        getGuild(bot, memberBan.guildId)
      );

      if (guildError) {
        logger.error(
          `Could not find guild with id: ${memberBan.guildId} while unbanning user ${memberBan.userId}.`
        );

        setTimeout(checkBans, refreshRate);
        return;
      }

      const { data: guildBans, error: guildBansError } = await tryCatch(
        guild.bans.fetch()
      );

      if (guildBansError) {
        logger.error(
          `Failed to fetch discord guild bans with guild id ${memberBan.guildId}:`,
          guildBansError
        );
        continue;
      }

      if (guildBans.has(memberBan.userId)) {
        const { error: unbanError } = await tryCatch(
          guild.members.unban(memberBan.userId, 'Ban expired.')
        );

        if (unbanError) {
          logger.error(
            `Failed to unban a user ${memberBan.userId}:`,
            unbanError
          );
          continue;
        }

        const { error: deleteBanError } = await tryCatch(
          banService.deleteBan(memberBan.userId, memberBan.guildId)
        );

        if (deleteBanError) {
          logger.error(
            `Failed to delete ban for user ${memberBan.userId} in the database.`
          );
        }
      }
    }

    setTimeout(checkBans, refreshRate);
  }

  checkBans();
}
