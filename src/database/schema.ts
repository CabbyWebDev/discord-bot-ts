import { sqliteTable, primaryKey, text, int } from 'drizzle-orm/sqlite-core';

export const bansTable = sqliteTable(
  'bans',
  {
    userId: text().notNull(),
    guildId: text().notNull(),
    bannedBy: text().notNull(),
    bannedAt: int().notNull(),
    unbanAt: int().notNull(),
    reason: text(),
    createdAt: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.guildId] })]
);

export const ytChannelsTable = sqliteTable(
  'youtube_channels',
  {
    channelName: text().notNull(),
    channelId: text().notNull(),
    guildId: text().notNull(),
    videoId: text(),
    createdAt: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.channelId, table.guildId] })]
);

export const twitchChannelsTable = sqliteTable(
  'twitch_channels',
  {
    channelName: text().notNull(),
    channelId: text().notNull(),
    guildId: text().notNull(),
    lastStreamId: text(),
    createdAt: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.channelId, table.guildId] })]
);

export const twitchTokenTable = sqliteTable('twitch_token', {
  id: int().primaryKey(),
  encryptedToken: text().notNull(),
  authTag: text().notNull(),
  iv: text().notNull(),
  expiresIn: int().notNull(),
  tokenType: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});

export const cs2UpdatesTable = sqliteTable('cs2_updates', {
  guildId: text().notNull().primaryKey(),
  updateId: text().notNull(),
  createdAt: text().notNull(),
});
