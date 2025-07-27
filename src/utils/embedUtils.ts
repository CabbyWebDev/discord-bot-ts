import { Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLogChannel, getMemberRoles } from './helpers';
import createEmbed from './createEmbed';
import logger from './logger';

type SourceType = Message | ChatInputCommandInteraction;

export async function sendEmbedLog(
  source: SourceType,
  embed: EmbedBuilder,
  channelId: string
) {
  const guild = source.guild;

  if (!guild)
    throw new Error(
      `Could not find guild for source of type ${
        source instanceof Message ? 'Message' : 'Interaction'
      } with id ${source.id}`
    );

  try {
    const logChannel = await getLogChannel(guild, channelId);

    if (!logChannel)
      throw new Error(`Could not find log channel with ID "${channelId}"`);

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      logger.error(
        `Failed to send embed log to channel ${logChannel.name}:`,
        err
      );
    }
  } catch (err) {
    logger.error('Failed to fetch log channel:', err);
  }
}

export function createMessageEmbed(message: Message, channelName: string) {
  const embed = createEmbed({
    color: '#95a5a6',
    title: 'Message',
    timestamp: true,
    author: {
      name: message.author.tag,
      iconUrl: message.author.displayAvatarURL(),
    },
    fields: [
      {
        name: 'Content',
        value: message.content || 'No message.',
      },
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
      embed.addFields({ name: 'Roles', value: memberRoles });
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

export function createInteractionEmbed(
  interaction: ChatInputCommandInteraction,
  channelName: string
) {
  const embed = createEmbed({
    color: '#3498db',
    timestamp: true,
    author: {
      name: interaction.user.tag,
      iconUrl: interaction.user.displayAvatarURL(),
    },
    fields: [
      {
        name: 'Command',
        value: `/${interaction.commandName}`,
      },
      {
        name: 'Channel',
        value: channelName,
      },
      {
        name: 'User ID',
        value: interaction.user.id,
      },
    ],
  });

  if (interaction.member) {
    const memberRoles = getMemberRoles(interaction.member);

    if (memberRoles) {
      embed.addFields({ name: 'Roles', value: memberRoles });
    }
  }

  return embed;
}

export function createDeleteEmbed(message: Message, channelName: string) {
  const embed = createEmbed({
    color: '#E53935',
    title: 'Message Deleted',
    description: message.content,
    timestamp: true,
    author: {
      name: 'paska',
    },
    fields: [
      {
        name: 'Channel',
        value: channelName,
      },
      {
        name: 'User Id',
        value: 'paska',
      },
    ],
  });

  return embed;
}
