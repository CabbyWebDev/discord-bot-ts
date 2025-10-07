import type { Client } from 'discord.js';
import tryCatch from '@/utils/tryCatch';
import logger from '@/utils/logger';
import path from 'path';
import { promises as fs } from 'fs';

type EventFile = {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => void | Promise<void>;
};

export default async function eventHandler(bot: Client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = await fs.readdir(eventsPath);
  const filteredFiles = eventFiles.filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js')
  );

  let loadedEvents = 0;

  await Promise.all(
    filteredFiles.map(async (file) => {
      const filePath = path.join(eventsPath, file);
      const { data: eventFile, error: eventFileError } = await tryCatch(
        import(filePath)
      );

      if (eventFileError) {
        logger.error(`Failed to load event file ${file}:`, eventFileError);
        return;
      }

      const event = eventFile.default as EventFile;

      if (!event || !event.name || !event.execute) {
        logger.warn(
          `Event: ${file} is missing a required 'name' or 'execute' property.`
        );

        return;
      }

      if (event.once) {
        bot.once(event.name, (...args) => event.execute(...args, bot));
      } else {
        bot.on(event.name, (...args) => event.execute(...args, bot));
      }

      loadedEvents++;
    })
  );

  logger.info(`✅ Successfully loaded ${loadedEvents} events.`);
}
