import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import config from '../config/main';
import path from 'path';
import fs from 'fs';

type CommandFileType = {
  data: SlashCommandBuilder;
  execute: (...args: any[]) => void;
};

const commands: object[] = [];
const commandsPath = path.join(__dirname, '..', 'commands');

try {
  await getCommandFiles(commandsPath);
} catch (err) {
  console.error('Error loading command files:', err);
}

async function getCommandFiles(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    try {
      const filePath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await getCommandFiles(filePath);
        continue;
      }

      if (
        !entry.isFile() ||
        !(entry.name.endsWith('.ts') || entry.name.endsWith('.js'))
      )
        continue;

      const command = (await import(filePath)).default as CommandFileType;

      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(
          `[WARNING] Command ${entry.name} is missing a required 'data' or 'execute' property.`
        );
      }
    } catch (err) {
      console.error(`Failed to load command file ${entry}:`, err);
    }
  }
}

if (commands.length > 0) {
  const rest = new REST().setToken(process.env.BOT_TOKEN || '');

  try {
    console.log(
      `⏳ Registering ${commands.length} slash commands for guild ${config.guildId}...`
    );
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      {
        body: commands,
      }
    );
    console.log(
      `✅ Successfully deployed ${commands.length} slash commands for guild ${config.guildId}.`
    );
  } catch (err) {
    console.error('Error registering slash commands:', err);
  }
} else {
  console.log('No commands found to register.');
}
