require('dotenv').config();

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
  EmbedBuilder,
  ChannelSelectMenuBuilder,
  ChannelType
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

const CANAL_RECRUTAMENTO_ID = '1461214773667696875';
const CARGO_ID = '1459377526475460719';


client.once('ready', () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});


client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (
    !message.member ||
    !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
  ) return;
  if (message.content === '!painelset') {
    const embed = new EmbedBuilder()
      .setTitle('👑  RECRUTAMENTO FAMÍLIA 4M')
      .setDescription(
        '*Entre na FAMÍLIA 4M apenas clicando no botão abaixo!*\n\n' +
        '**Instruções:**\n' +
        '1. Clique em **Solicitar Set Família 4M**.\n' +
        '2. Preencha seus dados do jogo.\n' +
        '3. Aguarde a aprovação.\n\n' +
        '*Desenvolvido por **Gabriel Cordeiro***'
      )
      .setColor('#2765e2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('solicitar_set_familia4m')
        .setLabel('Solicitar Set Família 4M')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  if (message.content === '!painelmensagem') {
    const embed = new EmbedBuilder()
      .setTitle('📨 PAINEL DE MENSAGEM')
      .setDescription(
               '*📨 Envie mensagens personalidas seguindo as intruções abaixo!*\n\n' +
        '**Instruções:**\n' +
        '1. Clique em Enviar **Mensagem Personalizada**.\n' +
        '2. Escolha o canal de envio de sua mensagem.\n' +
        '3. Preencha com sua mensagem e imagem (OPCIONAL).\n\n' +
        '*Desenvolvido por **Gabriel Cordeiro***'
      )
      .setColor('#2765e2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_painel_mensagem')
        .setLabel('✉️ Enviar Mensagem Personalizada')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});


client.on('interactionCreate', async (interaction) => {
  try {

    if (interaction.isButton() && interaction.customId === 'solicitar_set_familia4m') {
      const modal = new ModalBuilder()
        .setCustomId('form_set_familia4m')
        .setTitle('Formulário de Set | Família 4M');

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
            .setCustomId('recrutador')
            .setLabel('Recrutador')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'form_set_familia4m') {
      const nome = interaction.fields.getTextInputValue('nome');
      const id = interaction.fields.getTextInputValue('id');
      const recrutador = interaction.fields.getTextInputValue('recrutador');

      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação | Família 4M')
        .addFields(
          { name: '👤 Nome', value: nome, inline: true },
          { name: '🆔 ID', value: id, inline: true },
          { name: '🎯 Recrutador', value: recrutador },
          { name: '👤 Usuário Discord', value: `<@${interaction.user.id}>` }
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

      return interaction.reply({ content: '✅ Solicitação enviada com sucesso!', flags: 64 });
    }

    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set_familia4m|')) {
      await interaction.deferReply();

      const userId = interaction.customId.split('|')[1];
      const member = await interaction.guild.members.fetch(userId);

      if (member.roles.cache.has(CARGO_ID)) {
        return interaction.editReply('❌ Este usuário já possui o cargo.');
      }

      await member.roles.add(CARGO_ID);

      await interaction.message.edit({
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

      return interaction.editReply(`✅ <@${userId}> foi aprovado e recebeu o cargo com sucesso!`);
    }

    if (interaction.isButton() && interaction.customId === 'abrir_painel_mensagem') {
      const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId('selecionar_canal_envio')
          .setPlaceholder('Selecione o canal')
          .addChannelTypes(ChannelType.GuildText)
      );

      return interaction.reply({
        content: '📌 Selecione o canal de envio:',
        components: [row],
        flags: 64
      });
    }

    if (interaction.isChannelSelectMenu() && interaction.customId === 'selecionar_canal_envio') {
      const canalId = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`modal_mensagem|${canalId}`)
        .setTitle('Mensagem Personalizada');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('texto')
            .setLabel('Texto da Mensagem')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('imagem')
            .setLabel('Link da Imagem (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_mensagem|')) {
      await interaction.deferReply({ flags: 64 });

      const canalId = interaction.customId.split('|')[1];
      const texto = interaction.fields.getTextInputValue('texto');
      const imagem = interaction.fields.getTextInputValue('imagem');

      const canal = interaction.guild.channels.cache.get(canalId);
      if (!canal) return interaction.editReply('❌ Canal não encontrado.');

      const embed = new EmbedBuilder()
        .setDescription(texto)
        .setColor('#5865F2');

      if (imagem && imagem.startsWith('http')) embed.setImage(imagem);

      await canal.send({ embeds: [embed] });
      return interaction.editReply('✅ Mensagem enviada com sucesso!');
    }

  } catch (err) {
    console.error('❌ Erro:', err);
  }
});

client.login(TOKEN);
