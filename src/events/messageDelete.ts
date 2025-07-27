import { Events, Message } from 'discord.js';
import { createDeleteEmbed, sendEmbedLog } from '../utils/embedUtils';
import { getChannelName } from '../utils/helpers';
import { logChannels } from '../config/main';
import logger from '../utils/logger';
import config from '../config/main';

export default {
  name: Events.MessageDelete,
  async execute(message: Message) {
    if (message.author.bot) return;

    if (config.enableMsgDeleteLogs) {
      const channelName = getChannelName(message.channel);
      const messageDeleteEmbed = createDeleteEmbed(message, channelName);

      try {
        await sendEmbedLog(
          message,
          messageDeleteEmbed,
          logChannels.messagesChannelId
        );
      } catch (err) {
        logger.error('Failed to send embed delete log:', err);
      }
    }
  },
};
