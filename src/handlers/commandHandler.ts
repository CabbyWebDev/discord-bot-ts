import { Client, SlashCommandBuilder } from 'discord.js';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

type CommandFileType = {
  data: SlashCommandBuilder;
  execute: (...args: any[]) => void;
};

export default async function commandHandler(bot: Client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  await getCommandFiles(bot, commandsPath);
  console.log(`✅ Successfully loaded ${bot.commands.size} slash commands.`);
}

async function getCommandFiles(bot: Client, dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    try {
      const filePath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await getCommandFiles(bot, filePath);
        continue;
      }

      if (
        !entry.isFile() ||
        !(entry.name.endsWith('.ts') || entry.name.endsWith('.js'))
      )
        continue;

      const command = (await import(filePath)).default as CommandFileType;

      if ('data' in command && 'execute' in command) {
        bot.commands.set(command.data.name, command);
      } else {
        logger.warn(
          `Command ${entry.name} is missing a required 'data' or 'execute' property.`
        );
      }
    } catch (err) {
      logger.error(`Failed to load command file ${entry}:`, err);
    }
  }
}
