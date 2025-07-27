import {
  MessageFlags,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import createEmbed from '../../utils/createEmbed';
import { addBan } from '../../database/dbUtils';
import logger from '../../utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
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

    const user = interaction.options.getUser('user');

    if (!user) {
      await interaction.reply({
        content: 'User not found.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = interaction.guild.members.cache.get(user.id);
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

    if (!member?.bannable) {
      await interaction.reply({
        content: 'You cannot ban this user.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const unbanAt = getUnbanDate(duration);

    if (!member.user.bot) {
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
            value: unbanDate,
          },
        ],
        footer: {
          text: interaction.user.tag,
          iconUrl: interaction.user.displayAvatarURL(),
        },
      });

      await member.send({ embeds: [embed] });
    }

    try {
      await member.ban({
        reason: `Reason: ${reason}`,
      });
    } catch (err) {
      logger.error('Failed to ban user:', err);
      return;
    }

    const embed = createEmbed({
      color: '#FF0000',
      title: 'User Banned',
      description: `${user.tag} has been banned for ${duration}`,
      fields: [
        { name: 'Banned By', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason || 'No reason provided', inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({
      content: `User ${user.tag} has been banned for ${duration}. Reason: ${reason}`,
    });

    const banData = {
      userId: user.id,
      guildId: interaction.guild.id,
      bannedBy: interaction.user.id,
      bannedAt: Date.now(),
      unbanAt,
      reason: reason === 'No reason provided.' ? null : reason,
    };

    addBan(banData);
  },
};

function getUnbanDate(duration: string | null) {
  if (!duration) return null;

  const durationMap: Record<string, number> = {
    '30 min': 30,
    '1 hour': 60,
    '1 day': 1440,
    '1 week': 10080,
    '1 month': 43200,
    '1 year': 525600,
  };

  const minutes = durationMap[duration] ?? null;
  const isPermanent = minutes === null;
  const unbanAt = isPermanent ? null : Date.now() + minutes * 60 * 1000;

  return unbanAt;
}
