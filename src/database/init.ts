import { Database } from 'bun:sqlite';
import { createBansTable } from './migrations';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, './db/bans.sqlite');
fs.mkdirSync(path.dirname(dbDir), { recursive: true });

const db = new Database(dbDir);

createBansTable(db);

export default db;
