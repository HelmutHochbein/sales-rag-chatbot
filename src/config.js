// src/config.js
// Zentrale Auflösung von Env-Variablen und JSON-Template-Pfaden.
// Alle anderen Module lesen Konfiguration ausschließlich von hier.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export const config = {
  port: process.env.PORT || 3978,
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
  },
  promptRequestJsonPath:
    process.env.PROMPT_REQUEST_JSON || './config/prompt_request.json',
  bot: {
    appId:
      process.env.MICROSOFT_APP_ID ||
      process.env.BOT_ID ||
      process.env.CLIENT_ID ||
      '',
    appPassword:
      process.env.MICROSOFT_APP_PASSWORD ||
      process.env.SECRET_BOT_PASSWORD ||
      '',
    appType:
      process.env.MICROSOFT_APP_TYPE || process.env.BOT_TYPE || 'MultiTenant',
    tenantId:
      process.env.MICROSOFT_APP_TENANT_ID || process.env.TENANT_ID || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
    // HTML-Parse-Mode default an. Auf '0' setzen, um schnell auf
    // Plain-Text-Versand zurückzufallen.
    parseModeHtml: process.env.TELEGRAM_PARSE_MODE_HTML !== '0',
  },
};

export function readPromptTemplate() {
  const p = path.resolve(repoRoot, config.promptRequestJsonPath);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

export const paths = { repoRoot };
