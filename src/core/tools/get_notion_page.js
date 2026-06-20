// src/core/tools/get_notion_page.js
// Custom-Tool: liest eine konkrete Notion-Seite als Markdown.
import * as notion from '../notion.js';

export const definition = {
  name: 'get_notion_page',
  description:
    'Liest eine Notion-Seite vollständig aus und liefert sie als Markdown ' +
    '(Titel + Body-Blöcke). Verwende dieses Tool nach search_notion, wenn ' +
    'du den Inhalt einer Treffer-Seite brauchst, oder wenn du eine konkrete ' +
    'Page-ID kennst.',
  input_schema: {
    type: 'object',
    properties: {
      page_id: {
        type: 'string',
        description: 'Notion-Page-ID (UUID, mit oder ohne Bindestriche)',
      },
    },
    required: ['page_id'],
  },
};

export async function handler({ page_id }) {
  const md = await notion.getPageMarkdown(page_id);
  return [{ type: 'text', text: md }];
}
