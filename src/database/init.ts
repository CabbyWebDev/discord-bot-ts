import { Database } from 'bun:sqlite';
import { createBansTable } from './migrations';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, './db/bans.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

createBansTable(db);

export default db;
