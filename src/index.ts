import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import eventHandler from './handlers/eventHandler';
import commandHandler from './handlers/commandHandler';
import config from './config';

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

bot.commands = new Collection();

await Promise.all([eventHandler(bot), commandHandler(bot)]);

bot.login(config.botToken);
