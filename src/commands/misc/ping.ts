import {
  Client,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import createEmbed from '../../utils/createEmbed';

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
      color: '#FF4D4D',
      fields: [
        {
          name: 'Client Ping',
          value: `${clientPing}ms`,
          inline: true,
        },
        {
          name: 'API Ping',
          value: `${apiPing}ms`,
          inline: true,
        },
      ],
    });

    await interaction.editReply({ embeds: [pingEmbed] });
  },
};
