import type {
  Client,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import tryCatch from '@/utils/tryCatch';
import logger from '@/utils/logger';
import path from 'path';
import { promises as fs } from 'fs';

type CommandFile = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
};

export default async function commandHandler(bot: Client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const { error: commandsError } = await tryCatch(
    getCommandFiles(bot, commandsPath)
  );

  if (commandsError) {
    logger.error('Failed to fetch all command files:', commandsError);
    return;
  }

  logger.info(`✅ Successfully loaded ${bot.commands.size} (/) commands.`);
}

async function getCommandFiles(bot: Client, dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const commandDirs = entries.filter((entry) => entry.isDirectory());
  const commandFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))
    )
    .map((entry) => path.join(dirPath, entry.name));

  await Promise.all([
    ...commandDirs.map((dir) =>
      getCommandFiles(bot, path.join(dirPath, dir.name))
    ),

    ...commandFiles.map(async (filePath) => {
      const commandFile = await import(filePath);
      const command = commandFile.default as CommandFile;

      if ('data' in command && 'execute' in command) {
        bot.commands.set(command.data.name, command);
      } else {
        logger.warn(
          `Command ${path.basename(
            filePath
          )} is missing a required 'data' or 'execute' property.`
        );
      }
    }),
  ]);
}
