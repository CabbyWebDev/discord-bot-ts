import db from '@/database/init';
import { ytChannelsTable } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

export async function getAllChannels(guildId: string) {
  return await db
    .select()
    .from(ytChannelsTable)
    .where(eq(ytChannelsTable.guildId, guildId));
}

export async function addNewChannel(
  channelName: string,
  channelId: string,
  guildId: string,
  newVideoId: string
) {
  await db.insert(ytChannelsTable).values({
    channelName,
    channelId,
    guildId,
    videoId: newVideoId,
    createdAt: new Date().toISOString(),
  });
}

export async function isChannelStored(channelName: string, guildId: string) {
  const result = await db
    .select()
    .from(ytChannelsTable)
    .where(
      and(
        eq(ytChannelsTable.channelName, channelName),
        eq(ytChannelsTable.guildId, guildId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function isVideoPosted(
  channelId: string,
  guildId: string,
  newVideoId: string
) {
  const result = await db
    .select()
    .from(ytChannelsTable)
    .where(
      and(
        eq(ytChannelsTable.channelId, channelId),
        eq(ytChannelsTable.guildId, guildId),
        eq(ytChannelsTable.videoId, newVideoId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function updatePostedVideo(
  channelId: string,
  guildId: string,
  newVideoId: string
) {
  await db
    .update(ytChannelsTable)
    .set({ videoId: newVideoId })
    .where(
      and(
        eq(ytChannelsTable.channelId, channelId),
        eq(ytChannelsTable.guildId, guildId)
      )
    );
}

export async function deleteChannel(channelName: string, guildId: string) {
  await db
    .delete(ytChannelsTable)
    .where(
      and(
        eq(ytChannelsTable.channelName, channelName),
        eq(ytChannelsTable.guildId, guildId)
      )
    );
}
