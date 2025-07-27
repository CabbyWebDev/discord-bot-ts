import { Database } from 'bun:sqlite';

export function createBansTable(db: Database) {
  db.exec(
    `
    CREATE TABLE IF NOT EXISTS bans (
      userId TEXT NOT NULL,
      guildId TEXT NOT NULL,
      bannedBy TEXT NOT NULL,
      bannedAt INTEGER NOT NULL,
      unbanAt INTEGER NOT NULL,
      reason TEXT,
      PRIMARY KEY (userId, guildId)
    )
  `
  );
}
