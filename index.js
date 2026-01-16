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
const CANAL_BANCO_ID = '1461525417218408705';
const CARGO_ID = '1459377526475460719';

// =======================
// BANCO DE SETS
// =======================
const bancoPath = path.join(__dirname, 'banco_sets.json');
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
// PAINEL FIXO DO BANCO (TOP 10)
// =======================
function gerarEmbedTop10() {
  const banco = carregarBanco();

  const ranking = Object.entries(banco)
    .sort((a, b) => b[1].sets - a[1].sets)
    .slice(0, 10);

  let descricao = ranking.length
    ? ranking.map(([id, d], i) => `**${i + 1}º** <@${id}> — **${d.sets}** sets`).join('\n')
    : 'Nenhum set aprovado ainda.';

  return new EmbedBuilder()
    .setTitle('🏦 BANCO DE SETS — TOP 10')
    .setDescription(descricao)
    .setColor('#2765e2')
    .setFooter({ text: 'Atualiza automaticamente a cada set aprovado' })
    .setTimestamp();
}

async function criarOuAtualizarPainelBanco(guild) {
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
});

// =======================
// COMANDOS
// =======================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const isAdmin = message.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );

  // 👑 PAINEL SET
  if (isAdmin && message.content === '!painelset') {
    const embed = new EmbedBuilder()
      .setTitle('👑 RECRUTAMENTO FAMÍLIA 4M')
      .setDescription(
        '**Entre na FAMÍLIA 4M apenas clicando no botão abaixo!**\n\n' +
        '**Instruções:**\n' +
        '**1.** Clique em **Solicitar Set Família 4M**.\n' +
        '**2.** Preencha seus dados do jogo.\n' +
        '**3.** Aguarde a aprovação.\n\n' +
        '*Desenvolvido por **Gabriel Cordeiro***'
      )
      .setColor('#2765e2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('solicitar_set')
        .setLabel('Solicitar Set Família 4M')
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }


  // 🏦 PAINEL BANCO
  if (isAdmin && message.content === '!painelbanco') {
    await criarOuAtualizarPainelBanco(message.guild);
    message.reply('✅ Painel do banco criado/atualizado!');
  }

  // 🔄 RESET MANUAL DO BANCO
  if (isAdmin && message.content === '!painelresetbanco') {
    const banco = carregarBanco();
    for (const id in banco) banco[id].sets = 0;
    salvarBanco(banco);

    await criarOuAtualizarPainelBanco(message.guild);

    message.reply('🔄 Banco de sets resetado com sucesso!');
  }

  // 🏆 TOP 3
  if (isAdmin && message.content === '!paineltopsets') {
    const banco = carregarBanco();
    const ranking = Object.entries(banco)
      .sort((a, b) => b[1].sets - a[1].sets)
      .slice(0, 3);

    if (!ranking.length) return message.reply('❌ Nenhum set registrado.');

    let desc = ranking
      .map(([id, d], i) => `**${i + 1}º** <@${id}> — **${d.sets}** sets`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🏆 TOP 3 SETS')
      .setDescription(desc)
      .setColor('#f1c40f');

    message.channel.send({ embeds: [embed] });
  }

  // 👤 MEUS SETS
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


client.on('interactionCreate', async (interaction) => {
  try {
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
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('id')
            .setLabel('Id')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'form_set') {
      const embed = new EmbedBuilder()
        .setTitle('📥 Nova Solicitação')
        .setDescription(`<@${interaction.user.id}> Solicitou set!`)
        .setColor('#5865F2');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aceitar_set|${interaction.user.id}`)
          .setLabel('✅ Aceitar Set')
          .setStyle(ButtonStyle.Success)
      );

      const canal = interaction.guild.channels.cache.get(CANAL_RECRUTAMENTO_ID);
      if (canal) canal.send({ embeds: [embed], components: [row] });

      interaction.reply({ content: '✅ Solicitação enviada!', flags: 64 });
    }

    if (interaction.isButton() && interaction.customId.startsWith('aceitar_set|')) {
      await interaction.deferReply({ flags: 64 });

      const userId = interaction.customId.split('|')[1];
      const membro = await interaction.guild.members.fetch(userId);
      await membro.roles.add(CARGO_ID);

      const banco = carregarBanco();
      if (!banco[interaction.user.id]) banco[interaction.user.id] = { sets: 0 };
      banco[interaction.user.id].sets += 1;
      salvarBanco(banco);

      await criarOuAtualizarPainelBanco(interaction.guild);

      interaction.editReply('✅ Set aprovado e contabilizado!');
    }
  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
