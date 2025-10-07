import {
  EmbedBuilder,
  type ColorResolvable,
  type APIEmbedField,
} from 'discord.js';
import { getRandomColor } from './helpers';

type EmbedOptions = {
  color?: ColorResolvable;
  title?: string;
  url?: string;
  description?: string;
  fields?: APIEmbedField[];
  thumbnail?: string;
  image?: string;
  timestamp?: boolean | Date;
  author?: {
    name: string;
    iconUrl?: string;
    url?: string;
  };
  footer?: {
    text: string;
    iconUrl?: string;
  };
};

export default function createEmbed(options: EmbedOptions) {
  const embed = new EmbedBuilder();

  if (options.title) embed.setTitle(options.title);
  if (options.url) embed.setURL(options.url);
  if (options.color) embed.setColor(options.color ?? getRandomColor());
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);

  if (options.timestamp) {
    if (options.timestamp instanceof Date) {
      embed.setTimestamp(options.timestamp);
    } else {
      embed.setTimestamp();
    }
  }

  if (Array.isArray(options.fields) && options.fields.length > 0) {
    embed.addFields(options.fields.slice(0, 25)); // Discord limits fields length.
  }

  if (options.description) {
    embed.setDescription(options.description.slice(0, 4096)); // Discord limits description length.
  }

  if (options.author) {
    embed.setAuthor({
      name: options.author.name,
      iconURL: options.author.iconUrl,
      url: options.author.url,
    });
  }

  if (options.footer) {
    embed.setFooter({
      text: options.footer.text,
      iconURL: options.footer.iconUrl,
    });
  }

  return embed;
}
