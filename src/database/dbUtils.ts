import db from './init';

export type BanDataType = {
  userId: string;
  guildId: string;
  bannedBy: string;
  bannedAt: number;
  unbanAt: number | null;
  reason?: string | null;
};

const deleteBan = db.prepare(
  `DELETE FROM bans WHERE userId = ? AND guildId = ?`
);

const expiredBans = db.prepare(
  'SELECT * FROM bans WHERE unbanAt IS NOT NULL AND unbanAt <= ?'
);

const insertBan = db.prepare(
  `INSERT INTO bans (userId, guildId, bannedBy, bannedAt, unbanAt, reason) VALUES (?, ?, ?, ?, ?, ?)`
);

const getBans = db.prepare('SELECT * FROM bans WHERE guildId = ?');

export function addBan(banData: BanDataType) {
  insertBan.run(
    banData.userId,
    banData.guildId,
    banData.bannedBy,
    banData.bannedAt,
    banData.unbanAt,
    banData.reason ?? null
  );
}

export function removeBan(userId: string, guildId: string) {
  deleteBan.run(userId, guildId);
}

export function getAllBans(guildId: string) {
  return getBans.all(guildId);
}

export function getExpiredBans() {
  return expiredBans.all(Date.now());
}
