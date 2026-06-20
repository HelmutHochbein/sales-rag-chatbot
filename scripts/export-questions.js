#!/usr/bin/env node
// scripts/export-questions.js
// Liest die BotQuestions-Tabelle aus Azure und gibt sie als CSV oder
// pretty-printed aus. Zwei Modi:
//
//   npm run questions:tail
//   → letzte N Einträge pretty (default 50)
//
//   npm run questions:export
//   → letzte N Tage als CSV (default 7) auf stdout (oder --out <pfad>)
//
// Auth: identisch zur App (Connection-String oder Managed Identity), wird
// per env geladen. Lokal über env-cmd -f env/.env.dev (siehe package.json).

import { TableClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import fs from 'fs';

const TABLE_NAME = process.env.AZURE_TABLE_QUESTIONS_NAME || 'BotQuestions';
const ENDPOINT = process.env.AZURE_TABLE_ENDPOINT;
const CONN_STRING = process.env.AZURE_TABLE_CONNECTION_STRING;
const USE_MI = process.env.AZURE_USE_MANAGED_IDENTITY === '1';

function parseArgs(argv) {
  const args = {
    format: 'pretty',
    limit: 50,
    days: 7,
    channel: null,
    out: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--format') args.format = next();
    else if (a === '--limit') args.limit = Number(next());
    else if (a === '--days') args.days = Number(next());
    else if (a === '--channel') args.channel = next();
    else if (a === '--out') args.out = next();
    else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function helpAndExit() {
  console.log(`\nUsage:\n  node scripts/export-questions.js [options]\n\nOptions:\n  --format <csv|pretty>     output format (default: pretty)\n  --limit <N>               only for pretty: latest N rows (default 50)\n  --days <N>                only for csv: rows from last N days (default 7)\n  --channel <name>          filter by channel (telegram | teams | whatsapp)\n  --out <path>              write output to file instead of stdout\n  -h, --help                this help\n`);
  process.exit(0);
}

function getClient() {
  if (USE_MI && ENDPOINT) {
    return new TableClient(ENDPOINT, TABLE_NAME, new DefaultAzureCredential());
  }
  if (CONN_STRING) {
    return TableClient.fromConnectionString(CONN_STRING, TABLE_NAME);
  }
  console.error(
    'Fehler: weder AZURE_TABLE_CONNECTION_STRING noch AZURE_USE_MANAGED_IDENTITY=1 + AZURE_TABLE_ENDPOINT gesetzt.'
  );
  process.exit(1);
}

function monthPartitionsForRange(days) {
  // Holt alle Monatspartitionen, die einen Zeitraum von `days` zurück abdecken.
  const partitions = new Set();
  const now = new Date();
  const end = now.getTime();
  const start = end - days * 24 * 60 * 60 * 1000;
  const cursor = new Date(start);
  while (cursor.getTime() <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    partitions.add(`${y}-${m}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return [...partitions];
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchRows({ partitions, channel, sinceMs }) {
  const client = getClient();
  const rows = [];
  for (const p of partitions) {
    const filterParts = [`PartitionKey eq '${p}'`];
    if (sinceMs !== undefined) filterParts.push(`createdAt ge ${sinceMs}L`);
    if (channel) filterParts.push(`channel eq '${channel}'`);
    const iter = client.listEntities({
      queryOptions: { filter: filterParts.join(' and ') },
    });
    for await (const e of iter) rows.push(e);
  }
  // ASC by createdAt
  rows.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
  return rows;
}

function renderPretty(rows) {
  if (!rows.length) return '(keine Einträge)';
  const lines = rows.map(r => {
    const ts = r.ts || new Date(Number(r.createdAt)).toISOString();
    const ch = (r.channel || '?').padEnd(8);
    const uh = (r.userHash || '?').padEnd(16);
    const q = String(r.question || '').replace(/\s+/g, ' ').slice(0, 180);
    return `${ts}  ${ch}  ${uh}  ${q}`;
  });
  return lines.join('\n');
}

function renderCsv(rows) {
  const header = ['ts', 'channel', 'userHash', 'question'].join(',');
  const body = rows.map(r =>
    [r.ts, r.channel, r.userHash, r.question].map(csvEscape).join(',')
  );
  return [header, ...body].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) helpAndExit();

  let rows;
  if (args.format === 'pretty') {
    // Letzte ~limit Einträge: hole aktuellen + Vormonat, sortiere, schneide.
    const partitions = monthPartitionsForRange(60); // bis zu 2 Monate zurück
    rows = await fetchRows({ partitions, channel: args.channel });
    rows = rows.slice(-args.limit);
  } else if (args.format === 'csv') {
    const partitions = monthPartitionsForRange(args.days);
    const sinceMs = Date.now() - args.days * 24 * 60 * 60 * 1000;
    rows = await fetchRows({ partitions, channel: args.channel, sinceMs });
  } else {
    console.error(`Unbekanntes Format: ${args.format}`);
    process.exit(2);
  }

  const output =
    args.format === 'csv' ? renderCsv(rows) : renderPretty(rows);

  if (args.out) {
    fs.writeFileSync(args.out, output + '\n', 'utf8');
    console.error(`${rows.length} rows → ${args.out}`);
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch(err => {
  console.error('Fehler:', err?.message || err);
  process.exit(1);
});
