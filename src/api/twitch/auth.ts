import axios from 'axios';
import crypto from 'crypto';
import config from '@/config';
import { twitchTokenSchema, type TwitchToken } from './types';
import * as twitchService from '@/services/twitch';

export async function getNewTwitchToken() {
  const { data: tokenData } = await axios.post(
    'https://id.twitch.tv/oauth2/token',
    new URLSearchParams({
      client_id: config.twitchClientId,
      client_secret: config.twitchClientSecret,
      grant_type: 'client_credentials',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!tokenData) {
    throw new Error('Failed to fetch new twitch token');
  }

  const parsedTokenData = twitchTokenSchema.safeParse(tokenData);

  if (!parsedTokenData.success) {
    throw new Error(
      `Invalid token response from Twitch, ${parsedTokenData.error.message}`
    );
  }

  const parsedToken = parsedTokenData.data;
  const { encryptedToken, iv, authTag } = encryptAccessToken(
    parsedToken.access_token
  );

  const newToken = {
    id: 1,
    encryptedToken,
    iv,
    authTag,
    expiresIn: parsedToken.expires_in,
    tokenType: parsedToken.token_type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newToken;
}

export async function getValidTwitchToken() {
  let twitchToken = await twitchService.getTwitchToken();
  const needsNewToken = !twitchToken || isTokenExpired(twitchToken.expiresIn);

  if (needsNewToken) {
    const newToken = await getNewTwitchToken();

    if (!twitchToken) {
      await twitchService.addTwitchToken(newToken);
    } else {
      await twitchService.updateTwitchToken(newToken);
    }

    twitchToken = newToken;
  }

  return twitchToken;
}

export function isTokenExpired(expiresAt: number) {
  return Date.now() >= expiresAt * 1000;
}

export function encryptAccessToken(accessToken: string) {
  const encryptionKey = Buffer.from(config.twitchTokenAesKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(accessToken, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedToken: encryptedBuffer.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptAccessToken(token: TwitchToken) {
  const encryptionKey = Buffer.from(config.twitchTokenAesKey, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(token.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(token.authTag, 'hex'));

  const decryptedBuffer = Buffer.concat([
    decipher.update(Buffer.from(token.encryptedToken, 'hex')),
    decipher.final(),
  ]);

  return decryptedBuffer.toString('utf8');
}
