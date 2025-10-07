import { type EmbedBuilder, type Guild } from 'discord.js';
import { getTextBasedChannel } from '@/utils/helpers';

export type ChannelEmbed = {
  channelId: string;
  embed: EmbedBuilder;
};

export async function sendEmbedMessage(
  guild: Guild,
  embed: EmbedBuilder,
  channelId: string
) {
  const logChannel = await getTextBasedChannel(guild, channelId);
  await logChannel.send({ embeds: [embed] });
}

export async function sendEmbedsToChannels(
  embedList: ChannelEmbed[],
  guild: Guild
) {
  for (const { channelId, embed } of embedList) {
    const channel = await getTextBasedChannel(guild, channelId);
    await channel.send({ embeds: [embed] });
  }
}
