require('dotenv').config();

// KEEP ALIVE - RENDER
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Bot Família 4M rodando 24h no Render!');
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

// 📌 PAINEL FIXO
client.on('messageCreate', async (message) => {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  if (message.content === '!painel') {
    const embed = new EmbedBuilder()
      .setTitle('👑 RECRUTAMENTO FAMÍLIA 4M')
      .setDescription(
        'Clique no botão abaixo para solicitar sua entrada na organização.\n\n' +
        '**Instruções:**\n' +
        '1. Clique em **Solicitar Set Família 4M**.\n' +
        '2. Preencha seus dados do jogo.\n' +
        '3. Aguarde a aprovação.\n\n' +
        '*Desenvolvido por SettLabs / By Since*'
      )
      .setColor('#2b2d31');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('solicitar_set_familia4m')
        .setLabel('Solicitar Set Família 4M')
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    // 📋 ABRIR FORMULÁRIO
    if (interaction.isButton() && interaction.customId === 'solicitar_set_familia4m') {
      const modal = new ModalBuilder()
        .setCustomId('form_set_familia4m')
        .setTitle('Formulário de Set | Família 4M');

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
            .setPlaceholder('Quem te trouxe para a Família 4M?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // 📩 ENVIO DO FORMULÁRIO
    if (interaction.isModalSubmit() && interaction.customId === 'form_set_familia4m') {
      const nome = interaction.fields.getTextInputValue('nome');
      const id = interaction.fields.getTextInputValue('id');
      const numero = interaction.fields.getTextInputValue('numero');
      const recrutador = interaction.fields.getTextInputValue('recrutador');

      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação | Família 4M')
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
          .setCustomId(`aceitar_set_familia4m|${interaction.user.id}`)
          .setLabel('✅ Aceitar')
          .setStyle(ButtonStyle.Success)
      );

      const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
      if (canal) await canal.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: '✅ Solicitação enviada com sucesso!',
        ephemeral: true
      });
    }

    // ✅ ACEITAR SET
    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set_familia4m|')) {
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
              .setCustomId('aprovado_familia4m')
              .setLabel('✔️ Aprovado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          )
        ]
      });

      await interaction.followUp({
        content: `✅ <@${userId}> foi aprovado e recebeu o cargo com sucesso!`,
        ephemeral: false
      });
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
