import {
  GuildMember,
  TextChannel,
  Guild,
  type Channel,
  type APIInteractionGuildMember,
} from 'discord.js';
import logger from './logger';

export function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

export function getMemberRoles(
  member: GuildMember | APIInteractionGuildMember
) {
  if (!member && !('roles' in member)) return;
  if (!(member instanceof GuildMember)) return;

  const filteredRoles = member.roles.cache.filter(
    (role) => role.name !== '@everyone'
  );
  const memberRoles = filteredRoles.map((role) => role.toString()).join(', ');
  const rolesString = filteredRoles.size > 0 ? memberRoles : 'No roles';

  return rolesString;
}

export function getChannelName(channel: Channel | null) {
  if (channel instanceof TextChannel) {
    return channel.name;
  }

  return 'Unknown channel';
}

export async function getLogChannel(guild: Guild, channelId: string) {
  try {
    const logChannel = await guild.channels.fetch(channelId);

    if (!logChannel) {
      throw new Error(`Log channel with ID "${channelId}" not found.`);
    }

    if (!logChannel.isTextBased()) {
      throw new Error(
        `Channel ${logChannel.name} is not a text-based channel.`
      );
    }

    return logChannel;
  } catch (err) {
    logger.error(`Failed to fetch log channel with ID "${channelId}":`, err);
  }
}
