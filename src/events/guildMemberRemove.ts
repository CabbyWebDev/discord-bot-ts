import { Events, type GuildMember } from 'discord.js';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import { sendEmbedMessage } from '@/utils/embedUtils';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const memberLeftEmbed = createEmbed({
      color: '#FF4500',
      title: 'Member left',
      description: `${member.toString()} has left the server.`,
      thumbnail: member.user.displayAvatarURL(),
      author: {
        name: member.user.tag,
        iconUrl: member.user.displayAvatarURL(),
      },
      timestamp: true,
    });

    const { error: leftEmbedError } = await tryCatch(
      sendEmbedMessage(member.guild, memberLeftEmbed, config.channelIds.welcome)
    );

    if (leftEmbedError) {
      logger.error('Failed to send member left embed', leftEmbedError);
      return;
    }
  },
};
