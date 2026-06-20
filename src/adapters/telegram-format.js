// src/adapters/telegram-format.js
// Markdown → Telegram-HTML Konvertierung.
//
// Telegram-Bot-API kennt parse_mode='HTML' mit einer eng begrenzten Tag-Liste:
//   <b>, <i>, <u>, <s>, <code>, <pre>, <a href="...">, <blockquote>, <tg-spoiler>.
// Keine Headings, keine <ul>/<ol>/<li>, keine Tabellen, keine Bilder.
//
// Wir nutzen marked, hängen aber einen Custom Renderer über `marked.use({
// renderer })` an, der genau Telegram-HTML-Tags emittiert. Block-Strukturen
// ohne HTML-Pendant (Headings, Listen, Tabellen) werden als Plain-Text mit
// Bold/Bullets emuliert.
import { Marked } from 'marked';

const ALLOWED_LINK_PROTOCOLS = /^(https?|tg|mailto):/i;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// `this` in den Renderer-Methoden hat `parser` (marked.Parser), den wir für
// nested rendering brauchen. marked bindet das Kontext automatisch, daher
// hier ein plain object mit Funktions-Properties.
const renderer = {
  // ---------- Block-level ----------

  space() {
    return '';
  },

  code({ text }) {
    return `<pre>${escapeHtml(text)}</pre>\n\n`;
  },

  blockquote({ tokens }) {
    const inner = this.parser.parse(tokens).trim();
    return `<blockquote>${inner}</blockquote>\n\n`;
  },

  html({ text }) {
    // Roh-HTML aus der Quelle: nicht durchlassen, sondern escapen.
    return escapeHtml(text);
  },

  heading({ tokens, depth }) {
    const inner = this.parser.parseInline(tokens);
    const prefix = depth <= 2 ? '\n' : '';
    return `${prefix}<b>${inner}</b>\n\n`;
  },

  hr() {
    return '———\n\n';
  },

  list(token) {
    const { items, ordered, start } = token;
    const lines = [];
    items.forEach((item, idx) => {
      const marker = ordered ? `${(start ?? 1) + idx}.` : '•';
      const body = this.listitem(item).trim();
      lines.push(`${marker} ${body}`);
    });
    return lines.join('\n') + '\n\n';
  },

  listitem({ tokens }) {
    // listitem's tokens enthalten den Item-Inhalt (Inline + ggf. nested
    // block). parser.parse handelt beide Fälle.
    return this.parser.parse(tokens).trim();
  },

  paragraph({ tokens }) {
    return `${this.parser.parseInline(tokens)}\n\n`;
  },

  table(token) {
    // Telegram-HTML hat keine Table-Tags. Lesbarer Plain-Text-Fallback:
    // Header fett, Zeilen pipe-getrennt.
    const headerCells = token.header.map(c =>
      this.parser.parseInline(c.tokens)
    );
    const rows = token.rows.map(row =>
      row.map(c => this.parser.parseInline(c.tokens))
    );
    const lines = [`<b>${headerCells.join(' | ')}</b>`];
    for (const r of rows) lines.push(r.join(' | '));
    return lines.join('\n') + '\n\n';
  },

  // ---------- Inline ----------

  strong({ tokens }) {
    return `<b>${this.parser.parseInline(tokens)}</b>`;
  },

  em({ tokens }) {
    return `<i>${this.parser.parseInline(tokens)}</i>`;
  },

  codespan({ text }) {
    return `<code>${escapeHtml(text)}</code>`;
  },

  br() {
    return '\n';
  },

  del({ tokens }) {
    return `<s>${this.parser.parseInline(tokens)}</s>`;
  },

  link({ href, tokens }) {
    const innerText = this.parser.parseInline(tokens);
    if (!href || !ALLOWED_LINK_PROTOCOLS.test(href)) {
      // Schema gesperrt (z.B. javascript:) – nur den sichtbaren Text behalten.
      return innerText;
    }
    return `<a href="${escapeAttr(href)}">${innerText}</a>`;
  },

  image({ text }) {
    // Telegram-HTML hat kein <img>. Bild-Alt als Text rausgeben.
    return escapeHtml(text || '[Bild]');
  },

  text(token) {
    if (token.tokens && token.tokens.length) {
      return this.parser.parseInline(token.tokens);
    }
    return escapeHtml(token.text ?? '');
  },
};

const md = new Marked();
md.use({ renderer, gfm: true });

/**
 * Konvertiert Markdown in Telegram-konformes HTML.
 *
 * @param {string} input
 * @returns {string}
 */
export function mdToTelegramHtml(input) {
  if (!input) return '';
  let html;
  try {
    html = md.parse(String(input));
  } catch (e) {
    console.warn('[telegram-format] marked parse failed:', e?.message);
    return escapeHtml(String(input));
  }
  return html
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

/**
 * Entfernt alle Telegram-HTML-Tags und konvertiert Entities zurück
 * in Klartext. Fallback bei Telegram-API-400.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripTelegramHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
