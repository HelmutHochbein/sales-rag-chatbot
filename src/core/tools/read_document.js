// src/core/tools/read_document.js
// Custom-Tool: liefert ein PDF als Anthropic document content block.
import * as documents from '../documents.js';

export const definition = {
  name: 'read_document',
  description:
    'Öffnet ein konkretes Hersteller-PDF aus dem hauseigenen Dokumenten-Pool. ' +
    'Liefert das PDF als Document-Block – du kannst direkt aus dem Inhalt ' +
    'zitieren und Seiten- bzw. Abschnittsverweise nennen.',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Eintrag-Name aus list_documents (kein Dateipfad)',
      },
    },
    required: ['name'],
  },
};

export async function handler({ name }) {
  const doc = await documents.read(name);
  return [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: doc.media_type,
        data: doc.base64,
      },
      title: doc.title,
      citations: { enabled: true },
    },
  ];
}
