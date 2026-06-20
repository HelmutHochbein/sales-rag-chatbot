// src/core/state.js
// Conversation State pro Channel-User in Azure Table Storage.
//
// PartitionKey  = channelKey, z.B. 'teams:<aadObjectId>' oder 'whatsapp:<E164>'
// RowKey        = invertedTimestamp(13)_uuid – ASC-Sort gibt neueste zuerst.
// role          = 'user' | 'assistant'
// contentJson   = JSON-stringified Anthropic-`content` (string oder Array)
// createdAt     = Unix ms
//
// Auth-Strategie:
//   1. AZURE_USE_MANAGED_IDENTITY=1 + AZURE_TABLE_ENDPOINT  → DefaultAzureCredential
//   2. AZURE_TABLE_CONNECTION_STRING                        → fromConnectionString
//   3. nichts                                              → stateless, Warnung im Log
//
// Stateless-Fallback ist Absicht: der Bot muss auch laufen, solange Storage
// noch nicht provisioniert ist – in dem Fall sind Antworten halt single-turn.
import { TableClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';

const TABLE_NAME = process.env.AZURE_TABLE_NAME || 'BotConversations';
const ENDPOINT = process.env.AZURE_TABLE_ENDPOINT;
const CONN_STRING = process.env.AZURE_TABLE_CONNECTION_STRING;
const USE_MI = process.env.AZURE_USE_MANAGED_IDENTITY === '1';

const ROW_TS_BASE = 9999999999999; // 13-stellig, deckt > Jahr 2286 ab

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
        '[state] Kein Azure-Table-Storage konfiguriert (AZURE_TABLE_ENDPOINT/AZURE_TABLE_CONNECTION_STRING fehlen). Bot läuft stateless.'
      );
      _client = null;
    }
  } catch (e) {
    console.error('[state] init failed:', e?.message);
    _client = null;
  }
  return _client;
}

async function ensureTable(client) {
  if (_tableEnsured) return;
  try {
    await client.createTable();
  } catch (e) {
    // 409 = bereits da, ignorieren. Sonst loggen, aber nicht werfen.
    if (e?.statusCode !== 409) {
      console.warn('[state] createTable warning:', e?.message);
    }
  }
  _tableEnsured = true;
}

function makeRowKey(createdAt) {
  const inv = String(ROW_TS_BASE - createdAt).padStart(13, '0');
  return `${inv}_${crypto.randomUUID()}`;
}

function escapeOdata(s) {
  return s.replace(/'/g, "''");
}

/**
 * Liefert die letzten Messages eines channelKeys in chronologischer Reihenfolge
 * (älteste zuerst), bereit zur Übergabe an Anthropic als `messages[]`-Vorspiel.
 *
 * @param {string} channelKey
 * @param {object} [opts]
 * @param {number} [opts.maxTurns=10]  Anzahl Turns (User+Assistant-Paare). Wir
 *   holen intern bis zu maxTurns*6 Rows, um auch Tool-Loops abzudecken.
 */
export async function getHistory(channelKey, { maxTurns = 10 } = {}) {
  const client = getClient();
  if (!client || !channelKey) return [];

  await ensureTable(client);

  const rows = [];
  const HARD_CAP = maxTurns * 6;
  try {
    const iter = client.listEntities({
      queryOptions: {
        filter: `PartitionKey eq '${escapeOdata(channelKey)}'`,
      },
    });
    for await (const e of iter) {
      rows.push(e);
      if (rows.length >= HARD_CAP) break;
    }
  } catch (e) {
    console.warn('[state] getHistory failed:', e?.message);
    return [];
  }

  rows.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

  const messages = [];
  for (const r of rows) {
    let content;
    try {
      content = JSON.parse(r.contentJson);
    } catch {
      continue;
    }
    if (r.role !== 'user' && r.role !== 'assistant') continue;
    messages.push({ role: r.role, content });
  }
  return messages;
}

/**
 * Hängt eine Folge von Messages an die History eines channelKeys an.
 * Nutzt batch transaction (atomisch pro PartitionKey).
 *
 * @param {string} channelKey
 * @param {Array<{role:'user'|'assistant', content:any}>} turns
 */
export async function appendTurns(channelKey, turns) {
  const client = getClient();
  if (!client || !channelKey || !turns?.length) return;

  await ensureTable(client);

  const baseTs = Date.now();
  const ops = turns.map((t, i) => [
    'create',
    {
      partitionKey: channelKey,
      rowKey: makeRowKey(baseTs + i),
      role: t.role,
      contentJson: JSON.stringify(t.content),
      createdAt: baseTs + i,
    },
  ]);

  try {
    // submitTransaction ist auf 100 Operationen begrenzt – für unsere Turns
    // (max ~10 Messages pro Aufruf) absolut ausreichend.
    await client.submitTransaction(ops);
  } catch (e) {
    console.warn('[state] appendTurns failed:', e?.message);
  }
}
