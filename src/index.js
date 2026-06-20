// src/index.js
// Bootstrap: Express-App, mountet Adapter-Router.
// Aktuell: Teams (live) und Telegram (optional, sobald Token gesetzt).
// Ab Branch feat/whatsapp-bot kommt /api/whatsapp dazu.
import express from 'express';
import { config } from './config.js';
import { createTeamsRouter } from './adapters/teams.js';
import { createTelegramRouter } from './adapters/telegram.js';

const app = express();
app.use(express.json());

app.get('/ping', (_, res) => res.send('pong'));

if (config.bot.appId && config.bot.appPassword) {
  app.use('/api/messages', createTeamsRouter());
  console.log('Teams-Adapter aktiv unter /api/messages');
}

if (config.telegram.botToken) {
  app.use('/api/telegram', createTelegramRouter());
  console.log('Telegram-Adapter aktiv unter /api/telegram');
}

app.listen(config.port, () =>
  console.log(`Bot läuft auf http://localhost:${config.port}`)
);
