import { Events, AuditLogEvent, type GuildMember } from 'discord.js';
import { sendEmbedsToChannels, type ChannelEmbed } from '@/utils/embedUtils';
import { formatDate, formatTime } from '@/utils/helpers';
import tryCatch from '@/utils/tryCatch';
import createEmbed from '@/utils/createEmbed';
import config from '@/config';
import logger from '@/utils/logger';

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.user.bot || newMember.user.bot) return;

    const channelEmbedList: ChannelEmbed[] = [];

    if (oldMember.nickname !== newMember.nickname) {
      const nameChangedEmbed = createEmbed({
        color: '#2ECC71',
        title: 'Nickname changed',
        description: `${newMember.toString()} has changed their server nickname.`,
        author: {
          name: newMember.user.tag,
          iconUrl: newMember.user.displayAvatarURL(),
        },
        fields: [
          {
            name: 'Old Nickname',
            value: oldMember.nickname || 'Unknown',
          },
          {
            name: 'New Nickname',
            value: newMember.nickname || 'Unknown',
          },
        ],
        timestamp: true,
      });

      channelEmbedList.push({
        channelId: config.channelIds.messages,
        embed: nameChangedEmbed,
      });
    }

    if (newMember.premiumSince) {
      const newBoosterEmbed = createEmbed({
        color: '#9146FF',
        title: 'New server booster!',
        description: `${newMember.toString()} has started boosting the server! 🎉`,
        author: {
          name: newMember.user.tag,
          iconUrl: newMember.user.displayAvatarURL(),
        },
        timestamp: true,
      });

      const boosterSinceDate = newMember.premiumSince.toDateString();
      const currentDate = new Date().toDateString();

      if (boosterSinceDate !== currentDate) {
        newBoosterEmbed.addFields({
          name: 'Booster since',
          value: formatDate(newMember.premiumSince),
        });
      }

      if (!newMember.roles.cache.has(config.roleIds.nitroBooster)) {
        await newMember.roles.add(config.roleIds.nitroBooster);
      }

      channelEmbedList.push({
        channelId: config.channelIds.nitroBoosts,
        embed: newBoosterEmbed,
      });
    }

    if (
      oldMember.premiumSince &&
      !newMember.premiumSince &&
      newMember.roles.cache.has(config.roleIds.nitroBooster)
    ) {
      await newMember.roles.remove(config.roleIds.nitroBooster);
    }

    if (
      !oldMember.communicationDisabledUntil &&
      newMember.communicationDisabledUntil
    ) {
      const muteDate = formatDate(newMember.communicationDisabledUntil);
      const muteTime = formatTime(newMember.communicationDisabledUntil);
      const muteUntil = `${muteDate} ${muteTime}`;
      const newTimeoutEmbed = createEmbed({
        color: '#FFA500',
        title: 'Member timeouted',
        description: `${newMember.toString()} has been timeouted for ${getRemainingTimeout(
          newMember.communicationDisabledUntil
        )}.`,
        author: {
          name: newMember.user.tag,
          iconUrl: newMember.user.displayAvatarURL(),
        },
        fields: [{ name: 'Expires at', value: muteUntil }],
        timestamp: true,
      });

      channelEmbedList.push({
        channelId: config.channelIds.messages,
        embed: newTimeoutEmbed,
      });
    }

    if (
      oldMember.communicationDisabledUntil &&
      !newMember.communicationDisabledUntil
    ) {
      //await newMember.send(
      //'Your timeout is over. You can now chat and interact with the community again.'
      //);
    }

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (
      oldRoles.size !== newRoles.size ||
      !oldRoles.every((role) => newRoles.has(role.id))
    ) {
      const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
      const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

      if (!addedRoles.size && !removedRoles.size) return;

      const addedRole = addedRoles.map((role) => role.toString());
      const removedRole = removedRoles.map((role) => role.toString());

      const fetchedLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberRoleUpdate,
      });

      const roleLog = fetchedLogs.entries.first();
      let executor = roleLog ? roleLog.executor : null;

      if (executor?.partial) {
        executor = await executor.fetch();
      }

      if (!executor) return;

      if (addedRoles.size > 0) {
        const addedRoleEmbed = createEmbed({
          color: '#5acc89',
          title: 'New role assigned',
          description: `${executor.toString()} has given the ${addedRole} role to ${newMember.toString()}.`,
          author: {
            name: executor.tag,
            iconUrl: executor.displayAvatarURL(),
          },
          timestamp: true,
        });

        channelEmbedList.push({
          channelId: config.channelIds.messages,
          embed: addedRoleEmbed,
        });
      }

      if (removedRoles.size > 0) {
        const removedRoleEmbed = createEmbed({
          color: '#ed3939',
          title: 'Role Revoked',
          description: `${executor.toString()} has removed the ${removedRole} role from ${newMember.toString()}.`,
          author: {
            name: `${executor.tag}`,
            iconUrl: executor.displayAvatarURL(),
          },
          timestamp: true,
        });

        channelEmbedList.push({
          channelId: config.channelIds.messages,
          embed: removedRoleEmbed,
        });
      }
    }

    const { error: embedsError } = await tryCatch(
      sendEmbedsToChannels(channelEmbedList, newMember.guild)
    );

    if (embedsError) {
      logger.error('Failed to send embeds to the channels', embedsError);
    }
  },
};

function getRemainingTimeout(until: Date | string): string {
  const endTime = typeof until === 'string' ? new Date(until) : until;
  const now = new Date();

  const diffMs = endTime.getTime() - now.getTime();
  if (diffMs <= 0) return 'Mute expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  return parts.join(', ');
}
