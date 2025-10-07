import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  MessageFlags,
  type EmbedBuilder,
  type ChatInputCommandInteraction,
  type ButtonStyle,
} from 'discord.js';
import tryCatch from './tryCatch';

type ButtonOption = {
  id: string;
  label: string;
  style: ButtonStyle;
};

export default async function buttonInteraction(
  interaction: ChatInputCommandInteraction,
  buttonOptions: ButtonOption[],
  messageContent: string,
  embed?: EmbedBuilder,
  timeout: number = 60000
) {
  if (!interaction.channel) {
    throw new Error('Interaction channel not found');
  }

  const buttons = buttonOptions.map((btn) =>
    new ButtonBuilder()
      .setCustomId(btn.id)
      .setLabel(btn.label)
      .setStyle(btn.style)
  );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...buttons
  );

  await interaction.reply({
    content: messageContent,
    embeds: embed ? [embed] : undefined,
    components: [buttonRow],
    flags: MessageFlags.Ephemeral,
  });

  const sentMessage = await interaction.fetchReply();

  const { data: buttonInteraction, error: buttonInteractionError } =
    await tryCatch(
      sentMessage.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: timeout,
        filter: (i) => i.user.id === interaction.user.id,
      })
    );

  if (buttonInteractionError) {
    await interaction.editReply({
      content: '⌛ Time expired, action canceled.',
      components: [],
      embeds: [],
    });

    return;
  }

  if (buttonInteraction.user.id !== interaction.user.id) {
    await buttonInteraction.update({
      content: 'You are not allowed to use this button.',
      components: [],
      embeds: [],
    });

    return;
  }

  return buttonInteraction;
}
