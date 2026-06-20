// src/core/tools/list_documents.js
// Custom-Tool: listet die im Repo verfügbaren Hersteller-PDFs.
import * as documents from '../documents.js';

export const definition = {
  name: 'list_documents',
  description:
    'Listet alle verfügbaren Hersteller- und Anleitungsdokumente (PDFs) ' +
    'mit Name, Titel, Kurzbeschreibung und Größe. Nutze read_document, um ' +
    'ein konkretes PDF zu öffnen.',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function handler() {
  return [
    { type: 'text', text: JSON.stringify(documents.list(), null, 2) },
  ];
}
