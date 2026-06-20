#!/usr/bin/env node
// scripts/probe-telegram-format.js
// Lokales Probe-Tool: druckt für ein paar typische Bot-Outputs die
// Telegram-HTML-Konvertierung aus, damit man sie eyeballen kann.
//
// Aufruf:
//   node scripts/probe-telegram-format.js
import { mdToTelegramHtml, stripTelegramHtml } from '../src/adapters/telegram-format.js';

const samples = [
  {
    name: 'Bold, italic, code, link',
    md: 'Das ist **fett**, das ist *kursiv*, das ist `inline code`, und ein [Link](https://example-company.de).',
  },
  {
    name: 'Headings (alle Levels)',
    md: '# Top-Level\n\nText\n\n## Section\n\nMehr Text\n\n### Sub\n\nNoch mehr',
  },
  {
    name: 'Bullet- und nummerierte Liste',
    md: 'Die wichtigsten Punkte:\n\n- Punkt eins\n- Punkt zwei mit **fett**\n- Punkt drei\n\nUnd nummeriert:\n\n1. Erstens\n2. Zweitens\n3. Drittens',
  },
  {
    name: 'Code-Block',
    md: 'Beispiel:\n\n```js\nconst x = 42;\nconsole.log(x);\n```\n\nFertig.',
  },
  {
    name: 'Blockquote + Strike',
    md: '> Das ist ein Zitat\n> mit zwei Zeilen.\n\nDas hier ist ~~durchgestrichen~~.',
  },
  {
    name: 'Tabelle',
    md: '| Modell | Leistung | Effizienz |\n|---|---|---|\n| WP 100 | 8 kW | A++ |\n| WP 200 | 12 kW | A+++ |',
  },
  {
    name: 'Bösartig: javascript-Link + Raw HTML',
    md: 'Vorsicht: [klick mich](javascript:alert(1)) und <script>alert(2)</script>',
  },
  {
    name: 'Lange Antwort (gemischt)',
    md: '## Wärmepumpe — Beratung\n\nFür eine **fundierte Empfehlung** brauche ich folgende Informationen:\n\n- Hersteller / Modell\n- Wohnfläche und Baujahr\n- Bestand oder Neubau\n- Heizlast falls bekannt\n\n> Lieber einmal mehr nachfragen als später nachbessern.\n\nNächster Schritt: gemeinsam mit Innendienst klären.',
  },
];

for (const s of samples) {
  console.log('━'.repeat(70));
  console.log(`▶ ${s.name}`);
  console.log('─ Markdown ─');
  console.log(s.md);
  console.log('─ Telegram-HTML ─');
  const html = mdToTelegramHtml(s.md);
  console.log(html);
  console.log('─ Plain-Fallback (stripTelegramHtml) ─');
  console.log(stripTelegramHtml(html));
  console.log();
}
