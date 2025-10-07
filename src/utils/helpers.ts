import {
  GuildMember,
  TextChannel,
  NewsChannel,
  type Client,
  type PublicThreadChannel,
  type PrivateThreadChannel,
  type Role,
  type Guild,
  type Channel,
  type APIInteractionGuildMember,
} from 'discord.js';
import config from '@/config';

export function getRandomColor() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat(config.locale || 'en-US').format(num);
}

export function formatDate(dateInput: Date | string, showClock = false) {
  const dateObject =
    typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(showClock && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  };

  return dateObject.toLocaleDateString(config.locale || 'en-US', options);
}

export function formatTime(timeInput: Date | string) {
  const timeObject =
    typeof timeInput === 'string' ? new Date(timeInput) : timeInput;

  return timeObject.toLocaleTimeString(config.locale || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getMemberRoles(
  member: GuildMember | APIInteractionGuildMember,
  guild?: Guild
): string[] {
  if (member instanceof GuildMember) {
    return member.roles.cache
      .filter((role) => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString());
  }

  if ('roles' in member && Array.isArray(member.roles) && guild) {
    return member.roles
      .map((id) => guild.roles.cache.get(id))
      .filter((role): role is Role => !!role && role.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString());
  }

  return [];
}

export function getChannelName(channel: Channel | null) {
  if (!channel) return 'Unknown channel';
  if ('name' in channel && channel.name) return channel.name;
  return 'Unkown channel name';
}

type WritableChannel =
  | TextChannel
  | NewsChannel
  | PublicThreadChannel
  | PrivateThreadChannel;

export async function getTextBasedChannel(
  guild: Guild,
  channelId: string
): Promise<WritableChannel> {
  const channel =
    guild.channels.cache.get(channelId) ??
    (await guild.channels.fetch(channelId));

  if (!channel) {
    throw new Error(`Failed to fetch text-based channel, ID: ${channelId}`);
  }

  if (!channel.isTextBased()) {
    throw new Error(
      `Channel: ${channel.name} is not a text-based (cannot send messages).`
    );
  }

  return channel as WritableChannel;
}

export async function getGuild(bot: Client, guildId?: string) {
  const guildCache = bot.guilds.cache.get(guildId || config.guildId);
  if (guildCache) return guildCache;

  const guildFetch = await bot.guilds.fetch(guildId || config.guildId);
  return guildFetch;
}
