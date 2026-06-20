// src/adapters/telegram.js
// Telegram-spezifischer Adapter: Webhook-Endpoint, plain fetch gegen
// https://api.telegram.org/bot<token>/... – keine SDK-Dependency.
//
// Fachliche Logik lebt in src/core/agent.js – der Adapter mapped nur
// Telegram-Update ↔ Channel-Key/Text und sendet die Antwort zurück.
import express from 'express';
import { config } from '../config.js';
import * as agent from '../core/agent.js';
import {
  mdToTelegramHtml,
  stripTelegramHtml,
} from './telegram-format.js';

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_MESSAGE_CHARS = 4000; // Telegram-Hardlimit ist 4096; Puffer für Sicherheit.

function apiUrl(method) {
  return `${TELEGRAM_API}/bot${config.telegram.botToken}/${method}`;
}

// Versucht den Telegram-Call. Bei Fehler enthält der geworfene Error
// `status` (HTTP-Code) und `body` (Telegram-Description), sodass der
// Aufrufer auf 400er reagieren kann.
async function callTelegram(method, payload) {
  const res = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Telegram ${method} ${res.status}: ${body}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

function sendChatAction(chatId, action) {
  return callTelegram('sendChatAction', { chat_id: chatId, action });
}

// Sendet eine Nachricht im konfigurierten parse_mode (Default: HTML).
// Bei HTML-Fehlern (400) automatischer Retry als Plain-Text. Der Caller
// liefert bereits HTML-fertigen String, wenn parseModeHtml an ist.
async function sendMessage(chatId, body) {
  if (!config.telegram.parseModeHtml) {
    return callTelegram('sendMessage', { chat_id: chatId, text: body });
  }

  try {
    return await callTelegram('sendMessage', {
      chat_id: chatId,
      text: body,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  } catch (e) {
    if (e?.status === 400) {
      console.warn(
        '[telegram] HTML rejected, retrying as plain text:',
        (e.body || '').slice(0, 200)
      );
      const plain = stripTelegramHtml(body);
      return callTelegram('sendMessage', {
        chat_id: chatId,
        text: plain,
        disable_web_page_preview: true,
      });
    }
    throw e;
  }
}

// Splittet lange Antworten an Absatz-, dann Satz-, dann harten Zeichengrenzen.
function splitMessage(text, max = MAX_MESSAGE_CHARS) {
  if (text.length <= max) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n\n', max);
    if (cut < max / 2) cut = rest.lastIndexOf('\n', max);
    if (cut < max / 2) cut = rest.lastIndexOf('. ', max);
    if (cut < max / 2) cut = max;
    chunks.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function sendAnswer(chatId, answer) {
  // Bei HTML-Mode: vorher Markdown→Telegram-HTML konvertieren.
  // Das Splitten passiert in beiden Modi an Block-Grenzen (\n\n), die
  // unser Renderer zwischen Blöcken sicher setzt – Inline-Tags bleiben
  // dadurch intakt.
  const body = config.telegram.parseModeHtml
    ? mdToTelegramHtml(answer)
    : answer;
  for (const chunk of splitMessage(body)) {
    await sendMessage(chatId, chunk);
  }
}

// Verarbeitet ein einzelnes Telegram-Update asynchron, NACHDEM wir bereits
// 200 OK an Telegram zurückgegeben haben. Fehler dürfen den Webhook nicht
// disablen, deshalb komplett gekapselt.
async function handleUpdate(update) {
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text?.trim();

  // Nur Text-DMs in dieser Iteration. Edited/Sticker/Foto/Callback ignorieren.
  if (!chatId || !text) return;

  // Best-effort typing-Indikator – Fehler ignorieren.
  sendChatAction(chatId, 'typing').catch(() => {});

  try {
    const channelKey = `telegram:${chatId}`;
    const { answer } = await agent.run({
      channelKey,
      userText: text,
      channel: 'telegram',
    });
    await sendAnswer(chatId, answer);
  } catch (e) {
    console.error('Agent-Fehler (telegram):', e?.status, e?.message);
    try {
      await sendMessage(
        chatId,
        'Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder wende dich an den Support.'
      );
    } catch (sendErr) {
      console.error('Telegram-sendMessage-Fehler:', sendErr?.message);
    }
  }
}

export function createTelegramRouter() {
  const router = express.Router();
  const secret = config.telegram.webhookSecret;

  router.post('/', (req, res) => {
    // Webhook-Verifizierung (nur wenn Secret konfiguriert).
    if (secret) {
      const provided = req.get('x-telegram-bot-api-secret-token');
      if (provided !== secret) {
        return res.status(401).end();
      }
    }

    // Sofort 200 OK – Telegram disabled Webhooks nach wiederholten Fehlern.
    // Verarbeitung läuft asynchron weiter.
    res.status(200).end();
    handleUpdate(req.body).catch(err =>
      console.error('Telegram-Update-Fehler:', err?.message)
    );
  });

  return router;
}
