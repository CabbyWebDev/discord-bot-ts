import { Events, type Message } from 'discord.js';
import { sendEmbedMessage } from '@/utils/embedUtils';
import { getChannelName, getMemberRoles } from '@/utils/helpers';
import createEmbed from '@/utils/createEmbed';
import tryCatch from '@/utils/tryCatch';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    if (message.partial) {
      const { data: fullMessage, error: partialError } = await tryCatch(
        message.fetch()
      );

      if (partialError) {
        logger.error('Failed to fetch deleted partial message', partialError);
        return;
      }

      message = fullMessage;
    }

    const messageEmbed = newMessageEmbed(
      message,
      getChannelName(message.channel)
    );

    if (!message.guild) {
      logger.error('Failed to send embed log, message guild not found');
      return;
    }

    const { error: embedError } = await tryCatch(
      sendEmbedMessage(message.guild, messageEmbed, config.channelIds.messages)
    );

    if (embedError) {
      logger.error('Failed to send embed message log:', embedError);
    }
  },
};

function newMessageEmbed(message: Message, channelName: string) {
  const embed = createEmbed({
    color: '#95a5a6',
    title: 'Message',
    timestamp: true,
    description: message.content || 'No message.',
    author: {
      name: message.author.tag,
      iconUrl: message.author.displayAvatarURL(),
    },
    fields: [
      {
        name: 'User ID',
        value: message.author.id,
      },
      {
        name: 'Message ID',
        value: message.id,
      },
    ],
    footer: {
      text: channelName,
    },
  });

  const attachments = message.attachments;
  const imageAttachments = message.attachments.filter((att) =>
    att.contentType?.startsWith('image/')
  );

  if (imageAttachments.size === 1) {
    const firstImage = imageAttachments.first();
    if (firstImage) embed.setThumbnail(firstImage.url);
  }

  if (message.member) {
    const memberRoles = getMemberRoles(message.member);

    if (memberRoles) {
      embed.addFields({ name: 'Roles', value: memberRoles.join(', ') });
    }
  }

  if (attachments.size > 0) {
    const files = attachments
      .map((att) => `File: ${att.name}\nLink: ${att.url}`)
      .join('\n\n');

    embed.addFields({
      name: 'Files',
      value: files,
    });
  }

  return embed;
}
