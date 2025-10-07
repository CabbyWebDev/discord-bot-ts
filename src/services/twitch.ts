import db from '@/database/init';
import { twitchChannelsTable, twitchTokenTable } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import type { TwitchToken } from '@/api/twitch/types';

export async function getAllChannels(guildId: string) {
  return await db
    .select()
    .from(twitchChannelsTable)
    .where(eq(twitchChannelsTable.guildId, guildId));
}

export async function addNewChannel(
  channelId: string,
  guildId: string,
  channelName: string,
  lastStreamId: string | null
) {
  await db.insert(twitchChannelsTable).values({
    channelId,
    guildId,
    channelName,
    lastStreamId,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteChannel(channelName: string, guildId: string) {
  await db
    .delete(twitchChannelsTable)
    .where(
      and(
        eq(twitchChannelsTable.channelName, channelName),
        eq(twitchChannelsTable.guildId, guildId)
      )
    );
}

export async function isChannelStored(channelName: string, guildId: string) {
  const result = await db
    .select()
    .from(twitchChannelsTable)
    .where(
      and(
        eq(twitchChannelsTable.channelName, channelName),
        eq(twitchChannelsTable.guildId, guildId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function addTwitchToken(token: TwitchToken) {
  await db.insert(twitchTokenTable).values(token);
}

export async function updateTwitchToken(token: TwitchToken) {
  await db.update(twitchTokenTable).set({
    encryptedToken: token.encryptedToken,
    authTag: token.authTag,
    iv: token.iv,
    expiresIn: token.expiresIn,
    updatedAt: new Date().toISOString(),
  });
}

export async function getTwitchToken() {
  const result = await db.select().from(twitchTokenTable).limit(1);
  return result[0];
}

export async function updateTwitchStreamId(
  newStreamId: string,
  channelId: string,
  guildId: string
) {
  await db
    .update(twitchChannelsTable)
    .set({ lastStreamId: newStreamId })
    .where(
      and(
        eq(twitchChannelsTable.channelId, channelId),
        eq(twitchChannelsTable.guildId, guildId)
      )
    );
}
