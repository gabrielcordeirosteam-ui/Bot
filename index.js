require('dotenv').config();

/* =======================
   KEEP ALIVE - RENDER
======================= */
const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('🤖 Bot online 24h'));
app.listen(process.env.PORT || 3000);

/* =======================
   DISCORD
======================= */
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
  RoleSelectMenuBuilder,
  ChannelType
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.TOKEN);

/* =======================
   ARQUIVOS
======================= */
const basePath = __dirname;

const cfgPath = (g) => path.join(basePath, `config_${g}.json`);
const bancoPath = (g) => path.join(basePath, `banco_${g}.json`);
const painelBancoPath = (g) => path.join(basePath, `painel_banco_${g}.txt`);

const load = (p, d) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : d;
const save = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

/* =======================
   READY
======================= */
client.once('ready', () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

/* =======================
   COMANDO
======================= */
client.on('messageCreate', async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  if (
    msg.content === '!painelenviarset' &&
    msg.member.permissions.has(PermissionsBitField.Flags.Administrator)
  ) {
    const embed = new EmbedBuilder()
      .setTitle('👑 RECRUTAMENTO (FAC/ORG)')
      .setDescription(
        '*Entre apenas clicando no botão abaixo!*\n\n' +
        '**Instruções:**\n' +
        '1. Clique em **Solicitar Set**\n' +
        '2. Preencha seus dados\n' +
        '3. Aguarde aprovação'
      )
      .setColor('#5865F2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_set')
        .setLabel('Faça seu Painel de Sets')
        .setStyle(ButtonStyle.Primary)
    );

    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

/* =======================
   INTERAÇÕES
======================= */
client.on('interactionCreate', async (i) => {
  try {
    /* CONFIG MODAL */
    if (i.isButton() && i.customId === 'config_set') {
      const modal = new ModalBuilder()
        .setCustomId('modal_config')
        .setTitle('Configurar Painel');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('msg')
            .setLabel('Mensagem do painel de SET')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
      return i.showModal(modal);
    }

    /* SELEÇÕES */
    if (i.isModalSubmit() && i.customId === 'modal_config') {
      save(cfgPath(i.guild.id), { msg: i.fields.getTextInputValue('msg') });

      return i.reply({
        content: '📌 Selecione os canais e cargo:',
        components: [
          new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('canal_set')
              .setChannelTypes(ChannelType.GuildText)
          ),
          new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('canal_aceitar')
              .setChannelTypes(ChannelType.GuildText)
          ),
          new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('canal_banco')
              .setChannelTypes(ChannelType.GuildText)
          ),
          new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId('cargo_set')
          )
        ],
        ephemeral: true
      });
    }

    /* SALVAR CONFIG */
    if (i.isAnySelectMenu()) {
      const cfg = load(cfgPath(i.guild.id), {});
      cfg[i.customId] = i.values[0];
      save(cfgPath(i.guild.id), cfg);

      if (Object.keys(cfg).length >= 5) {
        const embed = new EmbedBuilder()
          .setDescription(cfg.msg)
          .setColor('#2f3136');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('pedir_set')
            .setLabel('Pedir Set')
            .setStyle(ButtonStyle.Success)
        );

        i.guild.channels.cache.get(cfg.canal_set)
          .send({ embeds: [embed], components: [row] });

        await atualizarBanco(i.guild, cfg.canal_banco);
      }

      i.reply({ content: '✅ Configurado', ephemeral: true });
    }

    /* PEDIR SET */
    if (i.isButton() && i.customId === 'pedir_set') {
      const modal = new ModalBuilder()
        .setCustomId('modal_set')
        .setTitle('Pedido de Set');

      modal.addComponents(
        ['Nome', 'ID', 'Recrutador'].map((l, x) =>
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`f${x}`)
              .setLabel(l)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        )
      );

      return i.showModal(modal);
    }

    /* ENVIAR SET */
    if (i.isModalSubmit() && i.customId === 'modal_set') {
      const cfg = load(cfgPath(i.guild.id), {});
      const embed = new EmbedBuilder()
        .setTitle('📥 NOVO SET')
        .addFields(
          { name: 'Nome', value: i.fields.getTextInputValue('f0') },
          { name: 'ID', value: i.fields.getTextInputValue('f1') },
          { name: 'Recrutador', value: i.fields.getTextInputValue('f2') }
        )
        .setColor('#f1c40f');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`aceitar_${i.user.id}`)
          .setLabel('✅ Aceitar Set')
          .setStyle(ButtonStyle.Primary)
      );

      i.guild.channels.cache.get(cfg.canal_aceitar)
        .send({ embeds: [embed], components: [row] });

      i.reply({ content: '⏳ Set enviado, aguarde.', ephemeral: true });
    }

    /* ACEITAR */
    if (i.isButton() && i.customId.startsWith('aceitar_')) {
      const userId = i.customId.split('_')[1];
      const cfg = load(cfgPath(i.guild.id), {});
      const banco = load(bancoPath(i.guild.id), {});

      await i.guild.members.fetch(userId)
        .then(m => m.roles.add(cfg.cargo_set));

      banco[i.user.id] = (banco[i.user.id] || 0) + 1;
      save(bancoPath(i.guild.id), banco);

      await atualizarBanco(i.guild, cfg.canal_banco);

      i.update({ content: '✅ Set aprovado', components: [] });
    }

  } catch (e) {
    console.error(e);
  }
});

/* =======================
   BANCO
======================= */
async function atualizarBanco(guild, canalId) {
  const banco = load(bancoPath(guild.id), {});
  const top = Object.entries(banco)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const embed = new EmbedBuilder()
    .setTitle('🏦 BANCO DE SETS — TOP 3')
    .setDescription(
      top.length
        ? top.map(([id, s], i) => `**${i + 1}º** <@${id}> — ${s}`).join('\n')
        : 'Nenhum set aprovado'
    )
    .setColor('#2f3136');

  const canal = guild.channels.cache.get(canalId);

  if (fs.existsSync(painelBancoPath(guild.id))) {
    const msg = await canal.messages.fetch(
      fs.readFileSync(painelBancoPath(guild.id), 'utf8')
    );
    return msg.edit({ embeds: [embed] });
  }

  const msg = await canal.send({ embeds: [embed] });
  fs.writeFileSync(painelBancoPath(guild.id), msg.id);
}
