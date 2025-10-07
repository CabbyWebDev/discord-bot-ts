import dotenv from 'dotenv';
import { validateConfig } from './validate';
import { getConfig } from './env';

const nodeEnv = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
dotenv.config({ path: `.env.${nodeEnv}`, override: true, quiet: true });

const config = {
  ...getConfig(nodeEnv),
};

validateConfig(config);

export default config;
