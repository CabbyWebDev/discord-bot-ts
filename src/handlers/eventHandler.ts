import { Client } from 'discord.js';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

type EventFileType = {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => void;
};

export default async function eventHandler(bot: Client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      const event = (await import(filePath)).default as EventFileType;

      if (!event || !event.name || !event.execute) {
        logger.warn(
          `Event file ${file} is missing a required 'name' or 'execute' property.`
        );
        continue;
      }

      if (event.once) {
        bot.once(event.name, (...args) => event.execute(...args, bot));
      } else {
        bot.on(event.name, (...args) => event.execute(...args, bot));
      }
    } catch (err) {
      logger.error(`Failed to load event file ${file}:`, err);
    }
  }
}
