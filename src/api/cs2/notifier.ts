import { type Client } from 'discord.js';
import { fetchLatestCs2Update } from './api';
import * as cs2UpdatesService from '@/services/cs2';
import { sendEmbedMessage } from '@/utils/embedUtils';
import tryCatch from '@/utils/tryCatch';
import { getGuild } from '@/utils/helpers';
import createEmbed from '@/utils/createEmbed';
import config from '@/config';
import logger from '@/utils/logger';

export default function checkCs2Updates(bot: Client) {
  const timeToRefresh = 10 * 60 * 1000;

  async function checkUpdates() {
    const { data: newUpdate, error: newUpdateError } = await tryCatch(
      fetchLatestCs2Update()
    );

    if (newUpdateError) {
      logger.error(
        'Failed to fetch new CS2 update from the Steam API',
        newUpdateError
      );

      setTimeout(checkUpdates, timeToRefresh);
      return;
    }

    const { data: guild, error: guildError } = await tryCatch(getGuild(bot));

    if (guildError) {
      logger.error('Failed to fetch guild while checking cs2 updates.');
      setTimeout(checkUpdates, timeToRefresh);
      return;
    }

    const { data: previousId, error: previousUpdateError } = await tryCatch(
      cs2UpdatesService.getPreviousUpdateId(guild.id)
    );

    if (previousUpdateError) {
      logger.error(
        'Failed to fetch previous update id from the database',
        previousUpdateError
      );

      setTimeout(checkUpdates, timeToRefresh);
      return;
    }

    const isFirstUpdate = !previousId;
    const isNewUpdate = previousId !== newUpdate.gid;

    if (isFirstUpdate || isNewUpdate) {
      const { error: updateIdError } = await tryCatch(
        cs2UpdatesService.upsertLatestUpdateId(newUpdate.gid, guild.id)
      );

      if (updateIdError) {
        logger.error(
          'Failed to add new CS2 update id to the database',
          updateIdError
        );
      }
    }

    if (isNewUpdate && !isFirstUpdate) {
      const cs2UpdateEmbed = createEmbed({
        color: '#FFC30B',
        title: 'Release Notes',
        description: 'New update available now!',
        thumbnail: 'https://i.imgur.com/l4C4FBv.jpeg',
        url: newUpdate.url,
        author: {
          name: 'Counter-Strike 2',
          iconUrl: 'https://i.imgur.com/l4C4FBv.jpeg',
        },
        timestamp: true,
      });

      const { error: cs2EmbedError } = await tryCatch(
        sendEmbedMessage(guild, cs2UpdateEmbed, config.channelIds.updates)
      );

      if (cs2EmbedError) {
        logger.error(
          'Failed to send CS2 update embed to the channel',
          cs2EmbedError
        );

        setTimeout(checkUpdates, timeToRefresh);
        return;
      }
    }

    setTimeout(checkUpdates, timeToRefresh);
  }

  checkUpdates();
}
