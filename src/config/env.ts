import { getEnvVar } from './validate';

export function getConfig(nodeEnv: 'dev' | 'prod') {
  const common = {
    locale: 'fi-FI',
    botToken: getEnvVar('BOT_TOKEN'),
    dbFile: getEnvVar('DATABASE_FILE'),
    ytApiKey: getEnvVar('YOUTUBE_API_KEY'),
    twitchClientId: getEnvVar('TWITCH_CLIENT_ID'),
    twitchClientSecret: getEnvVar('TWITCH_CLIENT_SECRET'),
    twitchTokenAesKey: getEnvVar('TWITCH_TOKEN_ENCRYPTION_KEY'),
  };

  if (nodeEnv === 'dev') {
    return {
      ...common,
      clientId: '1391754840102797432',
      guildId: '936374826707349524',
      channelIds: {
        welcome: '1411435976022167623',
        messages: '1161101649167781999',
        commands: '1396127268585082890',
        nitroBoosts: '1411674566144692255',
        twitchStreams: '1414603734729621564',
        youtubeVideos: '1414603963940208670',
        updates: '1414976080149741619',
      },
      roleIds: {
        nitroBooster: '1411680196146499605',
      },
    };
  }

  return {
    ...common,
    clientId: '1403036835407597592',
    guildId: '738805849899663450',
    channelIds: {
      welcome: '738929597487382638',
      messages: '1415641751800254545',
      commands: '1415642250313990144',
      nitroBoosts: '1415643933777858611',
      twitchStreams: '1415644464247996479',
      youtubeVideos: '1415644464247996479',
      updates: '1161097784515112972',
    },
    roleIds: {
      nitroBooster: '852892734226169888',
    },
  };
}
