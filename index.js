require('dotenv').config();

// =======================
// KEEP ALIVE - RENDER
// =======================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Bot Família 4M rodando 24h no Render!');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
});

// =======================
// DISCORD
// =======================
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

const fs = require('fs');
const path = require('path');

// =======================
// CONFIG
// =======================
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
const CANAL_LOGS_ID = '1461475178335830168';
const CANAL_BANCO_ID = '1461525417218408705';
const CARGO_ID = '1459377526475460719';

// =======================
// BANCO DE SETS
// =======================
const bancoPath = path.join(__dirname, 'banco_sets.json');
const resetPath = path.join(__dirname, 'ultimo_reset.txt');

function carregarBanco() {
  if (!fs.existsSync(bancoPath)) {
    fs.writeFileSync(bancoPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(bancoPath));
}

function salvarBanco(banco) {
  fs.writeFileSync(bancoPath, JSON.stringify(banco, null, 2));
}

// =======================
// RESET SEMANAL
// =======================
function verificarResetSemanal() {
  const agora = new Date();
  const domingo = agora.getDay() === 0;
  const meiaNoite = agora.getHours() === 0 && agora.getMinutes() === 0;

  if (!domingo || !meiaNoite) return;

  let ultimoReset = null;
  if (fs.existsSync(resetPath)) {
    ultimoReset = fs.readFileSync(resetPath, 'utf8');
  }

  const hoje = agora.toDateString();
  if (ultimoReset === hoje) return;

  const banco = carregarBanco();
  for (const userId in banco) {
    banco[userId].sets = 0;
  }
  salvarBanco(banco);

  fs.writeFileSync(resetPath, hoje);
  console.log('🔄 RESET SEMANAL DOS SETS EXECUTADO');
}

setInterval(verificarResetSemanal, 60000); // verifica a cada 1 minuto

// =======================
// READY
// =======================
client.once('ready', () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

// =======================
// COMANDOS
// =======================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // 🔒 ADMIN
  const isAdmin =
    message.member &&
    message.member.permissions.has(PermissionsBitField.Flags.Administrator);

  // PAINEL SET
  if (isAdmin && message.content === '!painelset') {
    const embed = new EmbedBuilder()
      .setTitle('👑 RECRUTAMENTO FAMÍLIA 4M')
      .setDescription(
        '*Clique no botão abaixo para solicitar o set*\n\n' +
        '1️⃣ Preencha seus dados\n' +
        '2️⃣ Aguarde aprovação'
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

  // PAINEL BANCO
  if (isAdmin && message.content === '!painelbanco') {
    if (message.channel.id !== CANAL_BANCO_ID) return;

    const embed = new EmbedBuilder()
      .setTitle('🏦 BANCO DE SETS')
      .setDescription(
        '➕ Registrar pessoa no banco\n' +
        '🔍 Consultar quantos sets aprovou'
      )
      .setColor('#2ecc71');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('registrar_banco')
        .setLabel('➕ Registrar Pessoa')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('consultar_banco')
        .setLabel('🔍 Consultar Sets')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  // 🏆 TOP 5 SETS
  if (isAdmin && message.content === '!paineltopsets') {
    const banco = carregarBanco();
    const ranking = Object.entries(banco)
      .sort((a, b) => b[1].sets - a[1].sets)
      .slice(0, 5);

    if (!ranking.length) {
      return message.reply('❌ Nenhum set registrado ainda.');
    }

    const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let descricao = '';

    ranking.forEach(([id, dados], i) => {
      descricao += `${medalhas[i]} <@${id}> — **${dados.sets}** sets\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 TOP 5 — Sets Aprovados')
      .setDescription(descricao)
      .setColor('#f1c40f');

    await message.channel.send({ embeds: [embed] });
  }

  // 👤 MEUS SETS
  if (message.content === '!painelmeussets') {
    const banco = carregarBanco();
    const dados = banco[message.author.id];

    const total = dados ? dados.sets : 0;

    const embed = new EmbedBuilder()
      .setTitle('📊 Meus Sets')
      .setDescription(
        `👤 <@${message.author.id}>\n\n` +
        `Você já aceitou **${total}** sets.`
      )
      .setColor('#5865F2');

    await message.reply({ embeds: [embed] });
  }
});

// =======================
// INTERAÇÕES
// =======================
client.on('interactionCreate', async (interaction) => {
  try {

    // FORM SET
    if (interaction.isButton() && interaction.customId === 'solicitar_set_familia4m') {
      const modal = new ModalBuilder()
        .setCustomId('form_set')
        .setTitle('Formulário | Família 4M');

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

    // ENVIAR FORM
    if (interaction.isModalSubmit() && interaction.customId === 'form_set') {
      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação')
        .setColor('#5865F2')
        .addFields(
          { name: '👤 Discord', value: `<@${interaction.user.id}>` }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aceitar_set|${interaction.user.id}`)
          .setLabel('✅ Aceitar')
          .setStyle(ButtonStyle.Success)
      );

      const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
      if (canal) await canal.send({ embeds: [embed], components: [row] });

      return interaction.reply({ content: '✅ Solicitação enviada!', flags: 64 });
    }

    // ACEITAR SET
    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set|')) {
      await interaction.deferReply({ flags: 64 });

      const userId = interaction.customId.split('|')[1];
      const member = await interaction.guild.members.fetch(userId);
      await member.roles.add(CARGO_ID);

      const banco = carregarBanco();
      if (!banco[interaction.user.id]) banco[interaction.user.id] = { sets: 0 };
      banco[interaction.user.id].sets += 1;
      salvarBanco(banco);

      return interaction.editReply('✅ Set aprovado e contabilizado!');
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
