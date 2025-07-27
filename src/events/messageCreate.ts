import { Events, Message } from 'discord.js';
import { createMessageEmbed, sendEmbedLog } from '../utils/embedUtils';
import { getChannelName } from '../utils/helpers';
import { logChannels } from '../config/main';
import logger from '../utils/logger';
import config from '../config/main';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    if (config.enableMessageLogs) {
      const channelName = getChannelName(message.channel);
      const messageEmbed = createMessageEmbed(message, channelName);

      try {
        await sendEmbedLog(
          message,
          messageEmbed,
          logChannels.messagesChannelId
        );
      } catch (err) {
        logger.error('Failed to send embed message log:', err);
      }
    }
  },
};
