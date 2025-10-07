import * as z from 'zod';

export const cs2UpdateSchema = z.object({
  gid: z.string(),
  title: z.string(),
  url: z.url(),
  is_external_url: z.boolean(),
  author: z.string(),
  contents: z.string(),
  feedlabel: z.string(),
  date: z.number(),
  appid: z.number(),
});
