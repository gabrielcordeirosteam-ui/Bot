
require('dotenv').config();

// KEEP ALIVE - RENDER
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Bot ZeroFoco rodando 24h no Render!');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
});

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

const TOKEN = process.env.TOKEN;
const CANAL_RECRUTAMENTO_ID = 'COLOQUE_O_ID_DO_CANAL_AQUI';

client.once('ready', () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  if (message.content === '!painel') {
    const embed = new EmbedBuilder()
      .setTitle('🧑‍💼 RECRUTAMENTO ZEROFOCO')
      .setDescription(
        'Clique no botão abaixo para solicitar sua entrada na organização.\n\n' +
        '**Instruções:**\n' +
        '1. Clique em **Solicitar Set ZeroFoco**.\n' +
        '2. Preencha seus dados do jogo.\n' +
        '3. Aguarde a aprovação.\n\n' +
        '*Desenvolvido por SettLabs / By Since*'
      )
      .setColor('#2b2d31');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('solicitar_set_zerofoco')
        .setLabel('Solicitar Set ZeroFoco')
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'solicitar_set_zerofoco') {
    const modal = new ModalBuilder()
      .setCustomId('form_set_zerofoco')
      .setTitle('Formulário de Set | ZeroFoco');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome')
          .setLabel('Nome')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('id')
          .setLabel('ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('numero')
          .setLabel('Número')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('recrutador')
          .setLabel('Recrutador')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'form_set_zerofoco') {
    const embed = new EmbedBuilder()
      .setTitle('📥 Nova Solicitação de Set')
      .setColor('#5865F2')
      .setTimestamp();

    const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
    if (canal) await canal.send({ embeds: [embed] });

    interaction.reply({ content: '✅ Solicitação enviada!', ephemeral: true });
  }
});

client.login(TOKEN);
