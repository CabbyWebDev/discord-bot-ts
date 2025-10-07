import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import * as banService from '@/services/ban';
import tryCatch from '@/utils/tryCatch';
import logger from '@/utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName('user')
        .setDescription('Provide the user ID to unban them')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the unban')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const memberId = interaction.options.getString('user') as string;
    const reason =
      interaction.options.getString('reason') || 'No reason provided';

    let guildBan = interaction.guild.bans.cache.get(memberId);

    if (!guildBan) {
      const { data: guildBanFetch, error: guildBanFetchError } = await tryCatch(
        interaction.guild.bans.fetch(memberId)
      );

      if (!guildBanFetch || guildBanFetchError) {
        await interaction.reply({
          content: 'This member is not banned from the server.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      guildBan = guildBanFetch;
    }

    const { error: unbanError } = await tryCatch(
      interaction.guild.members.unban(guildBan.user.id, reason)
    );

    if (unbanError) {
      await interaction.reply({
        content: `Failed to unban the ${guildBan.user.toString()}.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const { error: unbanErrorDb } = await tryCatch(
      banService.deleteBan(guildBan.user.id, interaction.guild.id)
    );

    if (unbanErrorDb) {
      logger.error(
        `Failed to delete ban from database for user ${guildBan.user.tag} in guild ${interaction.guild.id}`,
        unbanErrorDb.message
      );

      return;
    }

    await interaction.reply({
      content: `Member ${guildBan.user.toString()} has been unbanned from the server.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
