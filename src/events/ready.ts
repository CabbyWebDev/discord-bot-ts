import { Client, Events } from 'discord.js';
import { startLoops } from '../utils/loops';
import { getAllBans } from '../database/dbUtils';
import logger from '../utils/logger';

export default {
  name: Events.ClientReady,
  once: true,
  execute(bot: Client) {
    logger.info(`${bot.user?.tag} is up and running!`);
    startLoops(bot);
    const bans = getAllBans('936374826707349524');
    console.log(bans);
  },
};
