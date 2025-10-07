import db from '@/database/init';
import { bansTable } from '@/database/schema';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';

type MemberBan = {
  userId: string;
  guildId: string;
  bannedBy: string;
  bannedAt: number;
  unbanAt: number;
  reason?: string | null;
};

export async function getAllGuildBans(guildId: string) {
  return await db
    .select()
    .from(bansTable)
    .where(eq(bansTable.guildId, guildId));
}

export async function getExpiredGuildBans(guildId: string) {
  return await db
    .select()
    .from(bansTable)
    .where(
      and(
        eq(bansTable.guildId, guildId),
        isNotNull(bansTable.unbanAt),
        gte(bansTable.unbanAt, 0),
        lte(bansTable.unbanAt, Date.now())
      )
    );
}

export async function createBan(userBan: MemberBan) {
  await db.insert(bansTable).values({
    userId: userBan.userId,
    guildId: userBan.guildId,
    bannedBy: userBan.bannedBy,
    bannedAt: userBan.bannedAt,
    unbanAt: userBan.unbanAt,
    reason: userBan.reason ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteBan(userId: string, guildId: string) {
  await db
    .delete(bansTable)
    .where(and(eq(bansTable.userId, userId), eq(bansTable.guildId, guildId)));
}
