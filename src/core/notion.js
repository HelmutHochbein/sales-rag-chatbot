// src/core/notion.js
// Direkter Zugriff auf die Notion-API. Wird als Anthropic-Custom-Tools
// gewrappt (search_notion, get_notion_page).
//
// Voraussetzung: NOTION_TOKEN ist gesetzt UND die Integration ist auf den
// jeweiligen Notion-Pages/Datenbanken explizit freigegeben.
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

let _client = null;
let _n2m = null;

function getClient() {
  if (_client) return _client;
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error('NOTION_TOKEN ist nicht gesetzt.');
  }
  _client = new Client({ auth: token });
  return _client;
}

function getN2M() {
  if (_n2m) return _n2m;
  _n2m = new NotionToMarkdown({ notionClient: getClient() });
  return _n2m;
}

function extractTitle(page) {
  const props = page?.properties || {};
  for (const k of Object.keys(props)) {
    const p = props[k];
    if (p?.type === 'title' && Array.isArray(p.title)) {
      const t = p.title.map(x => x.plain_text).join('').trim();
      if (t) return t;
    }
  }
  return '(ohne Titel)';
}

function extractSnippet(page) {
  const props = page?.properties || {};
  for (const k of Object.keys(props)) {
    const p = props[k];
    if (p?.type === 'rich_text' && Array.isArray(p.rich_text)) {
      const t = p.rich_text
        .map(x => x.plain_text)
        .join(' ')
        .trim();
      if (t) return t.slice(0, 200);
    }
  }
  return '';
}

/**
 * Volltextsuche über die für die Integration freigegebenen Notion-Inhalte.
 * @param {string} query
 * @param {number} pageSize  1-20, Default 5
 * @returns {Promise<Array<{id, title, url, last_edited_time, snippet}>>}
 */
export async function search(query, pageSize = 5) {
  const client = getClient();
  const r = await client.search({
    query,
    page_size: Math.min(Math.max(pageSize, 1), 20),
    filter: { property: 'object', value: 'page' },
  });
  return r.results.map(p => ({
    id: p.id,
    title: extractTitle(p),
    url: p.url,
    last_edited_time: p.last_edited_time,
    snippet: extractSnippet(p),
  }));
}

/**
 * Liefert den Inhalt einer Notion-Seite als Markdown (Header + Body).
 */
export async function getPageMarkdown(pageId) {
  const client = getClient();
  const n2m = getN2M();
  const page = await client.pages.retrieve({ page_id: pageId });
  const blocks = await n2m.pageToMarkdown(pageId);
  const body = n2m.toMarkdownString(blocks).parent || '';
  return [
    `# ${extractTitle(page)}`,
    `Notion-URL: ${page.url}`,
    `Zuletzt bearbeitet: ${page.last_edited_time}`,
    '',
    body,
  ].join('\n');
}
