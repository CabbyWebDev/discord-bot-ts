import * as z from 'zod';

export const twitchUserSchema = z.object({
  id: z.string(),
  login: z.string(),
  display_name: z.string(),
  type: z.string(),
  broadcaster_type: z.string(),
  description: z.string(),
  profile_image_url: z.string(),
  offline_image_url: z.string(),
  view_count: z.number(),
  created_at: z.iso.datetime(),
});

export const twitchStreamSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  game_id: z.string(),
  game_name: z.string(),
  type: z.string(),
  title: z.string(),
  viewer_count: z.number(),
  started_at: z.iso.datetime(),
  language: z.string(),
  thumbnail_url: z.string(),
  tags: z.array(z.string()),
  is_mature: z.boolean(),
});

export const twitchFollowsSchema = z.number();

export const twitchTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.literal('bearer'),
});

export const encryptedTokenSchema = z.object({
  id: z.number(),
  encryptedToken: z.string(),
  authTag: z.string(),
  iv: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const twitchUserWithFollowsSchema = twitchUserSchema.extend({
  followers: twitchFollowsSchema,
});

export type TwitchUser = z.infer<typeof twitchUserWithFollowsSchema>;
export type TwitchStream = z.infer<typeof twitchStreamSchema>;
export type TwitchToken = z.infer<typeof encryptedTokenSchema>;
