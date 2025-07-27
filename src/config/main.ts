const botToken = process.env.BOT_TOKEN;
const clientId = '1391754840102797432';
const guildId = '936374826707349524';
const enableMessageLogs = true;
const enableCommandLogs = true;
const enableMsgDeleteLogs = true;

const logChannels = {
  messagesChannelId: '1161101649167781999',
  commandsChannelId: '1396127268585082890',
};

const config = {
  botToken,
  clientId,
  guildId,
  logChannels,
  enableMessageLogs,
  enableCommandLogs,
  enableMsgDeleteLogs,
};

export {
  botToken,
  clientId,
  guildId,
  logChannels,
  enableMessageLogs,
  enableCommandLogs,
  enableMsgDeleteLogs,
};

export default config;
