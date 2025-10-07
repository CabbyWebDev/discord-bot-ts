import {
  MessageFlags,
  SlashCommandBuilder,
  PermissionFlagsBits,
  type User,
  type GuildMember,
  type ChatInputCommandInteraction,
} from 'discord.js';
import * as banService from '@/services/ban';
import { sendEmbedMessage } from '@/utils/embedUtils';
import createEmbed from '@/utils/createEmbed';
import { getChannelName } from '@/utils/helpers';
import tryCatch from '@/utils/tryCatch';
import logger from '@/utils/logger';
import config from '@/config';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('The member to ban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('The duration of the ban')
        .setRequired(true)
        .addChoices(
          { name: '30 min', value: '30 min' },
          { name: '1 hour', value: '1 hour' },
          { name: '1 day', value: '1 day' },
          { name: '1 week', value: '1 week' },
          { name: '1 month', value: '1 month' },
          { name: '1 year', value: '1 year' },
          { name: 'Permanent', value: 'Permanent' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const memberToBan = interaction.options.getUser('member');

    if (!memberToBan) {
      await interaction.reply({
        content: 'Member not found.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const member = interaction.guild.members.cache.get(memberToBan.id);
    const duration = interaction.options.getString('duration') as string;
    const reason =
      interaction.options.getString('reason') ?? 'No reason provided.';

    if (!member) {
      await interaction.reply({
        content: 'Member not found.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (!member.bannable) {
      await interaction.reply({
        content: "You can't ban this member.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { unbanTimestamp, unbanAt } = getUnbanInfo(duration);

    if (!member.user.bot) {
      const { error: banMessageError } = await tryCatch(
        sendBanMessage(interaction, member, duration, reason, unbanAt)
      );

      if (banMessageError) {
        logger.error(
          `Failed to send ban message to member ${member.user.tag}:`,
          banMessageError
        );
      }
    }

    const { error: memberBanError } = await tryCatch(
      member.ban({
        reason: `Reason: ${reason}`,
      })
    );

    if (memberBanError) {
      logger.error(`Failed to ban a member ${member.user.tag}`, memberBanError);
      return;
    }

    await interaction.reply({
      content: `Member ${memberToBan.tag} has been banned for ${duration}. Reason: ${reason}`,
    });

    const banInfo = {
      userId: memberToBan.id,
      guildId: interaction.guild.id,
      bannedBy: interaction.user.id,
      bannedAt: Date.now(),
      unbanAt: unbanTimestamp,
      reason: reason === 'No reason provided.' ? null : reason,
    };

    const { error: createBanError } = await tryCatch(
      banService.createBan(banInfo)
    );

    if (createBanError) {
      logger.error(`Failed to create a new ban for member ${memberToBan.tag}.`);

      await interaction.reply({
        content: `Failed to ban member ${memberToBan.tag}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const { error: bannedEmbedError } = await tryCatch(
      sendBannedEmbed(interaction, memberToBan, duration, reason)
    );

    if (bannedEmbedError) {
      logger.error(
        `Failed to send ban message for member ${memberToBan.tag}:`,
        bannedEmbedError
      );
    }
  },
};

function getUnbanInfo(duration: string) {
  const durationMap: Record<string, number> = {
    '30 min': 30,
    '1 hour': 60,
    '1 day': 1440,
    '1 week': 10080,
    '1 month': 43200,
    '1 year': 525600,
  };

  const minutes = durationMap[duration];

  if (!minutes || duration.toLowerCase() === 'permanent') {
    return {
      unbanTimestamp: -1,
      unbanAt: 'You have a permanent ban',
    };
  }

  const unbanTimestamp = Date.now() + minutes * 60 * 1000;
  const unbanAt = new Date(unbanTimestamp).toLocaleString(
    config.locale || 'en-US'
  );

  return { unbanTimestamp, unbanAt };
}

async function sendBannedEmbed(
  interaction: ChatInputCommandInteraction,
  memberToBan: User,
  banDuration: string,
  reason: string
) {
  if (!interaction.guild) return;

  const memberBannedEmbed = createEmbed({
    color: '#FF0000',
    title: 'Member banned',
    description: `${memberToBan.toString()} has been banned for **${banDuration}**.`,
    author: {
      name: memberToBan.tag,
      iconUrl: memberToBan.displayAvatarURL(),
    },
    fields: [
      { name: 'Banned by', value: interaction.user.tag, inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: true },
    ],
    timestamp: true,
    footer: {
      text: getChannelName(interaction.channel),
    },
  });

  const { error: bannedEmbedError } = await tryCatch(
    sendEmbedMessage(
      interaction.guild,
      memberBannedEmbed,
      config.channelIds.commands
    )
  );

  if (bannedEmbedError) {
    logger.error('Failed to send member banned embed', bannedEmbedError);
    return;
  }
}

async function sendBanMessage(
  interaction: ChatInputCommandInteraction,
  member: GuildMember,
  duration: string,
  reason: string,
  unbanAt: string
) {
  if (!interaction.guild) return;

  const embed = createEmbed({
    title: 'You have been banned!',
    description: `You have been banned from **${interaction.guild.name}** for **${duration}**.`,
    color: '#ff4c4c',
    timestamp: true,
    fields: [
      { name: 'Reason', value: reason },
      { name: 'Banned By', value: interaction.user.tag },
      {
        name: 'Unban At',
        value: unbanAt,
      },
    ],
    footer: {
      text: interaction.user.tag,
      iconUrl: interaction.user.displayAvatarURL(),
    },
  });

  await member.send({ embeds: [embed] });
}
