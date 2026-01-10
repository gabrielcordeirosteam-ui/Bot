
// BOT DE TICKET MULTIFUNCIONAL - RAILWAY
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.TOKEN;
const CATEGORY_TICKETS = process.env.CATEGORY_TICKETS || 'Tickets';

client.once('ready', () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!painel' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets')
      .setDescription('Escolha uma opção abaixo')
      .setColor('DarkButNotBlack');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_msg').setLabel('Mensagem Personalizada').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_img').setLabel('Imagem Personalizada').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_msg_img').setLabel('Mensagem + Imagem').setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const guild = interaction.guild;

    const category = guild.channels.cache.find(
      c => c.name === CATEGORY_TICKETS && c.type === ChannelType.GuildCategory
    );

    const ticketChannel = await guild.channels.create({
      name: `${interaction.customId}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: category?.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    setTimeout(() => ticketChannel.delete().catch(() => {}), 5 * 60 * 1000);

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`select_${interaction.customId}`)
        .setPlaceholder('Selecione o canal de envio')
        .addOptions(
          guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText && c.id !== ticketChannel.id)
            .map(c => ({ label: c.name, value: c.id }))
            .slice(0, 25)
        )
    );

    ticketChannel.send({ content: '📢 Escolha o canal de envio:', components: [selectMenu] });
    interaction.reply({ content: '🎟️ Ticket criado!', ephemeral: true });
  }

  if (interaction.isStringSelectMenu()) {
    const canalDestino = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`modal_${canalDestino}`)
      .setTitle('Mensagem Personalizada');

    const mensagemInput = new TextInputBuilder()
      .setCustomId('mensagem')
      .setLabel('Digite sua mensagem')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(mensagemInput));
    interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    const canalDestino = interaction.customId.split('_')[1];
    const mensagem = interaction.fields.getTextInputValue('mensagem');

    const embed = new EmbedBuilder()
      .setDescription(mensagem)
      .setColor('DarkGold');

    interaction.guild.channels.cache.get(canalDestino).send({ embeds: [embed] });
    interaction.reply({ content: '✅ Mensagem enviada!', ephemeral: true });
  }
});

client.login(TOKEN);
