import { REST, Routes, type RESTGetAPIGuildResult } from 'discord.js';
import tryCatch from '@/utils/tryCatch';
import config from '@/config';
import path from 'path';
import fs from 'fs';

const commands: object[] = [];
const commandsPath = path.join(__dirname, '..', 'commands');

const { error: filesError } = await tryCatch(getCommandFiles(commandsPath));

if (filesError) {
  throw new Error(
    `Failed to load command files while deploying commands: ${filesError}`
  );
}

const { error: deployError } = await tryCatch(deployCommands());

if (deployError) {
  throw new Error(`Failed to deploy commands: ${deployError}`);
}

async function getCommandFiles(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const { error: filesError } = await tryCatch(getCommandFiles(filePath));

      if (filesError) {
        console.error(`Failed to load all command files:`, filesError);
      }

      continue;
    }

    if (
      !entry.isFile() ||
      !(entry.name.endsWith('.ts') || entry.name.endsWith('.js'))
    )
      continue;

    const { data: commandFile, error: commandError } = await tryCatch(
      import(filePath)
    );

    if (commandError) {
      console.error(`Failed to load command file ${entry}:`, commandError);
      continue;
    }

    const command = commandFile.default;

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(
        `Command ${entry.name} is missing a required 'data' or 'execute' property.`
      );
    }
  }
}

async function deployCommands() {
  if (!commands.length) {
    console.log('No commands found to register');
    return;
  }

  if (!config.botToken) {
    console.log('Bot token not found');
    return;
  }

  const rest = new REST().setToken(config.botToken);
  const { data: guild, error: guildError } = (await tryCatch(
    rest.get(Routes.guild(config.guildId)) as Promise<RESTGetAPIGuildResult>
  )) as { data?: RESTGetAPIGuildResult; error?: unknown };

  if (!guild || guildError) {
    console.log(`Failed to fetch guild by ${config.guildId}`, guildError);
    return;
  }

  console.log(
    `⏳ Registering ${commands.length} slash commands for guild ${guild.name}...`
  );

  const { error: commandsError } = await tryCatch(
    rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: commands,
    })
  );

  if (commandsError) {
    console.log(
      `Failed to deploy guild commands for guild ${guild.name}`,
      commandsError
    );

    return;
  }

  console.log(
    `✅ Successfully deployed ${commands.length} slash commands for guild ${guild.name}.`
  );
}
