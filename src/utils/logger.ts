import { createLogger, format, transports } from 'winston';
import fs from 'fs';

const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'DD.MM.YYYY HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, stack, ...metadata }) => {
      const metaString = Object.keys(metadata).length
        ? `\nMetadata: ${JSON.stringify(metadata)}`
        : '';
      return `${timestamp} [${level.toUpperCase()}] ${
        stack || message
      } ${metaString}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
