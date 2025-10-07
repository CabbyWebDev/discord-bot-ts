import { Events, type GuildMember } from 'discord.js';
import { formatDate } from '@/utils/helpers';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import { sendEmbedMessage } from '@/utils/embedUtils';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const memberJoinedEmbed = createEmbed({
      color: '#52DDAD',
      title: 'Member joined',
      description: `${member.toString()} has joined the server.`,
      thumbnail: member.user.displayAvatarURL(),
      author: {
        name: member.user.tag,
        iconUrl: member.user.displayAvatarURL(),
      },
      fields: [
        {
          name: 'Account age',
          value: formatMemberAge(member.user.createdAt),
        },
        {
          name: 'Account created',
          value: formatDate(member.user.createdAt),
        },
      ],
      timestamp: true,
    });

    const { error: joinedEmbedError } = await tryCatch(
      sendEmbedMessage(
        member.guild,
        memberJoinedEmbed,
        config.channelIds.welcome
      )
    );

    if (joinedEmbedError) {
      logger.error('Failed to send joined embed', joinedEmbedError);
      return;
    }
  },
};

function pluralize(value: number, singular: string, plural?: string) {
  return `${value} ${value === 1 ? singular : plural ?? singular + 's'}`;
}

function formatMemberAge(joinedAt: Date): string {
  const now = new Date();

  let delta = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);

  const years = Math.floor(delta / (3600 * 24 * 365));
  delta -= years * 3600 * 24 * 365;

  const months = Math.floor(delta / (3600 * 24 * 30));
  delta -= months * 3600 * 24 * 30;

  const days = Math.floor(delta / (3600 * 24));
  delta -= days * 3600 * 24;

  const hours = Math.floor(delta / 3600);
  delta -= hours * 3600;

  const minutes = Math.floor(delta / 60);
  const parts: string[] = [];

  if (years) parts.push(pluralize(years, 'year'));
  if (months) parts.push(pluralize(months, 'month'));
  if (days) parts.push(pluralize(days, 'day'));

  if (parts.length === 0) {
    if (hours) parts.push(pluralize(hours, 'hour'));
    if (minutes) parts.push(pluralize(minutes, 'minute'));
  }

  return parts.join(', ');
}
