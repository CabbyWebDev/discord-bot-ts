import { defineConfig } from 'drizzle-kit';
import config from './src/config';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';
const dbDir = path.resolve(process.cwd(), 'data');

fs.mkdirSync(dbDir, { recursive: true });

export default defineConfig({
  dialect: 'sqlite',
  schema: isProd ? './build/database/schema.js' : './src/database/schema.ts',
  out: isProd ? './drizzle/prod' : './drizzle/dev',
  dbCredentials: {
    url: `./data/${config.dbFile}`,
  },
});
