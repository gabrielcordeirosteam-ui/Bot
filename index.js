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
  EmbedBuilder
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
const painelBancoPath = path.join(__dirname, 'painel_banco_msg.txt');

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
// RESET SEMANAL (DOMINGO 00:00)
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
  for (const id in banco) {
    banco[id].sets = 0;
  }

  salvarBanco(banco);
  fs.writeFileSync(resetPath, hoje);

  console.log('🔄 RESET SEMANAL DOS SETS EXECUTADO');
}

setInterval(verificarResetSemanal, 60000);

// =======================
// PAINEL FIXO DO BANCO (TOP 10)
// =======================
function gerarEmbedTop10() {
  const banco = carregarBanco();

  const ranking = Object.entries(banco)
    .sort((a, b) => b[1].sets - a[1].sets)
    .slice(0, 10);

  let descricao = '';

  if (!ranking.length) {
    descricao = 'Nenhum set aprovado ainda.';
  } else {
    ranking.forEach(([id, dados], i) => {
      descricao += `**${i + 1}º** <@${id}> — **${dados.sets}** sets\n`;
    });
  }

  return new EmbedBuilder()
    .setTitle('🏦 BANCO DE SETS — TOP 10')
    .setDescription(descricao)
    .setColor('#2ecc71')
    .setFooter({ text: 'Atualiza automaticamente a cada set aprovado' })
    .setTimestamp();
}

async function atualizarPainelBanco(guild) {
  const canal = guild.channels.cache.get(CANAL_BANCO_ID);
  if (!canal) return;

  const embed = gerarEmbedTop10();

  if (fs.existsSync(painelBancoPath)) {
    const msgId = fs.readFileSync(painelBancoPath, 'utf8');
    try {
      const msg = await canal.messages.fetch(msgId);
      return msg.edit({ embeds: [embed] });
    } catch {
      fs.unlinkSync(painelBancoPath);
    }
  }

  const msg = await canal.send({ embeds: [embed] });
  fs.writeFileSync(painelBancoPath, msg.id);
}

// =======================
// READY
// =======================
client.once('ready', () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (guild) atualizarPainelBanco(guild);
});

// =======================
// COMANDOS
// =======================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const isAdmin = message.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );

  // PAINEL SET
  if (isAdmin && message.content === '!painelset') {
    const embed = new EmbedBuilder()
      .setTitle('👑 RECRUTAMENTO FAMÍLIA 4M')
      .setDescription('Clique no botão para solicitar o set')
      .setColor('#2765e2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('solicitar_set')
        .setLabel('Solicitar Set')
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // TOP 5 MANUAL
  if (isAdmin && message.content === '!paineltopsets') {
    const banco = carregarBanco();
    const ranking = Object.entries(banco)
      .sort((a, b) => b[1].sets - a[1].sets)
      .slice(0, 5);

    if (!ranking.length) return message.reply('❌ Nenhum set registrado.');

    let desc = '';
    ranking.forEach(([id, d], i) => {
      desc += `**${i + 1}º** <@${id}> — **${d.sets}** sets\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 TOP 5 SETS')
      .setDescription(desc)
      .setColor('#f1c40f');

    message.channel.send({ embeds: [embed] });
  }

  // MEUS SETS
  if (message.content === '!painelmeussets') {
    const banco = carregarBanco();
    const total = banco[message.author.id]?.sets || 0;

    const embed = new EmbedBuilder()
      .setTitle('📊 Meus Sets')
      .setDescription(`Você aprovou **${total}** sets.`)
      .setColor('#5865F2');

    message.reply({ embeds: [embed] });
  }
});

// =======================
// INTERAÇÕES
// =======================
client.on('interactionCreate', async (interaction) => {
  try {
    // FORM
    if (interaction.isButton() && interaction.customId === 'solicitar_set') {
      const modal = new ModalBuilder()
        .setCustomId('form_set')
        .setTitle('Solicitação de Set');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome')
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
        .setDescription(`<@${interaction.user.id}> solicitou set`)
        .setColor('#5865F2');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aceitar_set|${interaction.user.id}`)
          .setLabel('✅ Aceitar')
          .setStyle(ButtonStyle.Success)
      );

      const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
      if (canal) canal.send({ embeds: [embed], components: [row] });

      interaction.reply({ content: '✅ Solicitação enviada!', flags: 64 });
    }

    // ACEITAR SET
    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set|')) {
      await interaction.deferReply({ flags: 64 });

      const userId = interaction.customId.split('|')[1];
      const membro = await interaction.guild.members.fetch(userId);
      await membro.roles.add(CARGO_ID);

      const banco = carregarBanco();
      if (!banco[interaction.user.id]) banco[interaction.user.id] = { sets: 0 };
      banco[interaction.user.id].sets += 1;
      salvarBanco(banco);

      await atualizarPainelBanco(interaction.guild);

      interaction.editReply('✅ Set aprovado e contabilizado!');
    }
  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
