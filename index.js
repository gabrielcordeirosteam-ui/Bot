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

// 🔹 IDs FIXOS
const CANAL_RECRUTAMENTO_ID = '1461214773667696875';
const CARGO_ID = '1459377526475460719';

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
        .setCustomId('solicitar_set_zerofocoamesoFoco')
        .setLabel('Solicitar Set ZeroFoco')
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    // 📋 ABRIR FORMULÁRIO
    if (interaction.isButton() && interaction.customId === 'solicitar_set_zerofoco') {
      const modal = new ModalBuilder()
        .setCustomId('form_set_zerofoco')
        .setTitle('Formulário de Set | ZeroFoco');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome')
            .setPlaceholder('Nome in Game')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('id')
            .setLabel('ID')
            .setPlaceholder('ID in Game')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('numero')
            .setLabel('Número')
            .setPlaceholder('Número in Game')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('recrutador')
            .setLabel('Recrutador')
            .setPlaceholder('Quem te trouxe para a ZeroFoco?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // 📩 ENVIO DO FORMULÁRIO
    if (interaction.isModalSubmit() && interaction.customId === 'form_set_zerofoco') {
      const nome = interaction.fields.getTextInputValue('nome');
      const id = interaction.fields.getTextInputValue('id');
      const numero = interaction.fields.getTextInputValue('numero');
      const recrutador = interaction.fields.getTextInputValue('recrutador');

      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação de Set')
        .addFields(
          { name: '👤 Nome', value: nome, inline: true },
          { name: '🆔 ID', value: id, inline: true },
          { name: '📞 Número', value: numero, inline: true },
          { name: '🎯 Recrutador', value: recrutador, inline: false },
          { name: '👤 Usuário Discord', value: `<@${interaction.user.id}>`, inline: false }
        )
        .setColor('#5865F2')
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aceitar_set|${interaction.user.id}`)
          .setLabel('✅ Aceitar')
          .setStyle(ButtonStyle.Success)
      );

      const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
      if (canal) await canal.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: '✅ Solicitação enviada!',
        ephemeral: true
      });
    }

    // ✅ ACEITAR SET
    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set|')) {
      const userId = interaction.customId.split('|')[1];
      const member = await interaction.guild.members.fetch(userId);

      if (member.roles.cache.has(CARGO_ID)) {
        return interaction.reply({
          content: '❌ Este usuário já possui o cargo.',
          ephemeral: true
        });
      }

      await member.roles.add(CARGO_ID);

      await interaction.update({
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('✔️ Aprovado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
              .setCustomId('aprovado')
          )
        ]
      });

      return interaction.followUp({
        content: `✅ <@${userId}> recebeu o cargo com sucesso!`,
        ephemeral: false
      });
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
