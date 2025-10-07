import * as z from 'zod';

export const youtubeSearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

export const youtubeRssFeedSchema = z.object({
  items: z.array(z.object({ id: z.string(), link: z.string() })),
});

export const youtubeVideoSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        channelTitle: z.string(),
        publishedAt: z.string(),
        channelId: z.string(),
        description: z.string(),
        thumbnails: z.object({
          default: z.object({ url: z.string() }),
          medium: z.object({ url: z.string() }),
          high: z.object({ url: z.string() }),
          standard: z.object({ url: z.string() }).optional(),
          maxres: z.object({ url: z.string() }).optional(),
        }),
      }),
      contentDetails: z.object({
        duration: z.string(),
      }),
      statistics: z.object({
        viewCount: z.string(),
        likeCount: z.string().optional(),
        commentCount: z.string().optional(),
      }),
    })
  ),
});

export const youtubeChannelSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        publishedAt: z.string(),
        description: z.string(),
        customUrl: z.string(),
        thumbnails: z.object({
          default: z.object({ url: z.string() }),
          medium: z.object({ url: z.string() }),
          high: z.object({ url: z.string() }),
        }),
      }),
      statistics: z.object({
        viewCount: z.string(),
        subscriberCount: z.string().optional(),
        hiddenSubscriberCount: z.boolean(),
        videoCount: z.string(),
      }),
    })
  ),
});

export type YoutubeChannel = z.infer<
  typeof youtubeChannelSchema
>['items'][number];
