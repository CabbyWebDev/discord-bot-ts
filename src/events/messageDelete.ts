import { Events, type Message } from 'discord.js';
import { sendEmbedMessage } from '@/utils/embedUtils';
import { getChannelName } from '@/utils/helpers';
import createEmbed from '@/utils/createEmbed';
import tryCatch from '@/utils/tryCatch';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.MessageDelete,
  async execute(message: Message) {
    if (!message.author || message.author.bot) return;

    if (message.partial) {
      const { data: fullMessage, error: fullMessageError } = await tryCatch(
        message.fetch()
      );

      if (fullMessageError) {
        logger.error('Failed to fetch partial message', fullMessageError);
        return;
      }

      message = fullMessage;
    }

    const messageDeletedEmbed = deletedMessageEmbed(
      message,
      getChannelName(message.channel)
    );

    if (!message.guild) {
      logger.error('Failed to find message guild.');
      return;
    }

    const { error: embedError } = await tryCatch(
      sendEmbedMessage(
        message.guild,
        messageDeletedEmbed,
        config.channelIds.messages
      )
    );

    if (embedError) {
      logger.error('Failed to send message deleted embed', embedError);
    }
  },
};

export function deletedMessageEmbed(message: Message, channelName: string) {
  const embed = createEmbed({
    color: '#E53935',
    title: 'Message Deleted',
    description: message.content,
    timestamp: true,
    author: {
      name: message.author.tag,
      iconUrl: message.author.displayAvatarURL(),
    },
    footer: {
      text: channelName,
    },
  });

  return embed;
}
