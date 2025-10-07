import {
  type Client,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import createEmbed from '@/utils/createEmbed';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows API & client pings'),
  async execute(interaction: ChatInputCommandInteraction, bot: Client) {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();
    const clientPing = reply.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(bot.ws.ping);
    const pingEmbed = createEmbed({
      title: '🚀 Ping',
      color: '#FF4D4D',
      fields: [
        {
          name: 'Client latency',
          value: `${clientPing}ms`,
        },
        {
          name: 'API latency',
          value: `${apiPing}ms`,
        },
      ],
      timestamp: true,
    });

    await interaction.editReply({ embeds: [pingEmbed] });
  },
};
