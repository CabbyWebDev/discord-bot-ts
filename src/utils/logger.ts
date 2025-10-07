import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';
const logsPath = path.resolve(process.cwd(), isProd ? 'logs/prod' : 'logs/dev');
fs.mkdirSync(logsPath, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'DD.MM.YYYY HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(logsPath, 'errors.log'),
      level: 'error',
    }),
    new transports.File({ filename: path.join(logsPath, 'combined.log') }),
  ],
});

export default logger;
