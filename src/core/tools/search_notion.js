// src/core/tools/search_notion.js
// Custom-Tool: durchsucht die AcmeCo Notion-Wissensdatenbank.
import * as notion from '../notion.js';

export const definition = {
  name: 'search_notion',
  description:
    'Durchsucht die AcmeCo Notion-Wissensdatenbank nach Stichworten. ' +
    'Liefert eine Liste von Seiten mit id, title, url, last_edited_time und ' +
    'snippet. Nutze anschließend get_notion_page, um den vollen Inhalt ' +
    'einer Treffer-Seite zu lesen.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Suchbegriff' },
      page_size: {
        type: 'integer',
        description: 'Maximale Anzahl Treffer (1–20, Default 5)',
        default: 5,
        minimum: 1,
        maximum: 20,
      },
    },
    required: ['query'],
  },
};

export async function handler({ query, page_size = 5 }) {
  const results = await notion.search(query, page_size);
  return [{ type: 'text', text: JSON.stringify(results, null, 2) }];
}
