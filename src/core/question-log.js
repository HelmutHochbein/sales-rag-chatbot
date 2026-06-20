// src/core/question-log.js
// Anonymisiertes Logging der eingehenden User-Fragen, unabhängig von der
// Conversation-History. Eine eigene Tabelle, damit Frage-Übersicht und
// Multi-Turn-Kontext nicht vermischt sind.
//
// Schema:
//   PartitionKey  = YYYY-MM             (Monatspartition für leichtes Listing)
//   RowKey        = invertedTs(13)_uuid (neueste zuerst beim ASC-Listing)
//   ts            = ISO 8601
//   createdAt     = unix ms
//   channel       = 'teams' | 'telegram' | 'whatsapp'
//   userHash      = sha256(channelKey)[:16]  – anonym, deterministisch
//   question      = erste 2000 Zeichen des Roh-Inputs
//
// Auth-Strategie identisch zu state.js (MI bevorzugt, sonst Connection-String).
// Stateless-Fallback: wenn kein Storage konfiguriert ist, wird nichts geloggt
// und das Modul wirft niemals – der Bot soll auch ohne Logging laufen.
import { TableClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';

const TABLE_NAME = process.env.AZURE_TABLE_QUESTIONS_NAME || 'BotQuestions';
const ENDPOINT = process.env.AZURE_TABLE_ENDPOINT;
const CONN_STRING = process.env.AZURE_TABLE_CONNECTION_STRING;
const USE_MI = process.env.AZURE_USE_MANAGED_IDENTITY === '1';

const ROW_TS_BASE = 9999999999999; // 13-stellig, > Jahr 2286

let _client = null;
let _initialized = false;
let _tableEnsured = false;

function getClient() {
  if (_initialized) return _client;
  _initialized = true;

  try {
    if (USE_MI && ENDPOINT) {
      _client = new TableClient(
        ENDPOINT,
        TABLE_NAME,
        new DefaultAzureCredential()
      );
    } else if (CONN_STRING) {
      _client = TableClient.fromConnectionString(CONN_STRING, TABLE_NAME);
    } else {
      console.warn(
        '[question-log] Kein Azure-Table-Storage konfiguriert. Frage-Logging deaktiviert.'
      );
      _client = null;
    }
  } catch (e) {
    console.error('[question-log] init failed:', e?.message);
    _client = null;
  }
  return _client;
}

async function ensureTable(client) {
  if (_tableEnsured) return;
  try {
    await client.createTable();
  } catch (e) {
    if (e?.statusCode !== 409) {
      console.warn('[question-log] createTable warning:', e?.message);
    }
  }
  _tableEnsured = true;
}

function userHash(channelKey) {
  return crypto
    .createHash('sha256')
    .update(channelKey)
    .digest('hex')
    .slice(0, 16);
}

function makeRowKey(createdAt) {
  const inv = String(ROW_TS_BASE - createdAt).padStart(13, '0');
  return `${inv}_${crypto.randomUUID()}`;
}

function monthPartition(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Loggt eine eingehende User-Frage. Fire-and-forget – Caller darf den Promise
 * ignorieren oder awaiten. Wirft niemals.
 *
 * @param {object} args
 * @param {string} args.channelKey  z.B. 'telegram:123456'
 * @param {string} args.channel     'teams' | 'telegram' | 'whatsapp'
 * @param {string} args.question    Roh-Input des Users
 */
export async function logQuestion({ channelKey, channel, question } = {}) {
  if (!channelKey || !question) return;
  const client = getClient();
  if (!client) return;

  try {
    await ensureTable(client);
    const now = new Date();
    const createdAt = now.getTime();
    await client.createEntity({
      partitionKey: monthPartition(now),
      rowKey: makeRowKey(createdAt),
      ts: now.toISOString(),
      createdAt,
      channel: channel || 'unknown',
      userHash: userHash(channelKey),
      question: String(question).slice(0, 2000),
    });
  } catch (e) {
    console.warn('[question-log] write failed:', e?.message);
  }
}
