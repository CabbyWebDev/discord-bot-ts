import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import config from '@/config';
import path from 'path';

const dbDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dbDir, config.dbFile);
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export default db;
