import db from '@/database/init';
import { cs2UpdatesTable } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function getPreviousUpdateId(guildId: string) {
  const [row] = await db
    .select()
    .from(cs2UpdatesTable)
    .where(eq(cs2UpdatesTable.guildId, guildId))
    .limit(1);

  return row?.updateId;
}

export async function upsertLatestUpdateId(updateId: string, guildId: string) {
  await db
    .insert(cs2UpdatesTable)
    .values({
      updateId,
      guildId,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: cs2UpdatesTable.guildId,
      set: { updateId },
    });
}
