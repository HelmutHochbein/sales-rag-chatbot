// src/core/tool-registry.js
// Sammlung aller Custom-Tools, die der Agent dem Modell anbieten soll.
// Jedes Tool-Modul exportiert { definition, handler }:
//   - definition: Anthropic-Tool-Definition (name, description, input_schema)
//   - handler:    async (input, ctx) → Array von tool_result-Content-Blocks
//
// Web-Search ist KEIN Custom-Tool – das wird server-seitig von Anthropic
// ausgeführt und kommt aus prompt_request.json über buildBaseRequest().
import * as searchNotion from './tools/search_notion.js';
import * as getNotionPage from './tools/get_notion_page.js';
import * as listDocuments from './tools/list_documents.js';
import * as readDocument from './tools/read_document.js';

const TOOLS = [searchNotion, getNotionPage, listDocuments, readDocument];

export const customDefinitions = TOOLS.map(t => t.definition);

export async function dispatch(name, input, ctx) {
  const tool = TOOLS.find(t => t.definition.name === name);
  if (!tool) {
    throw new Error(`unknown tool: ${name}`);
  }
  return tool.handler(input, ctx);
}

export function listTools() {
  return TOOLS.map(t => t.definition.name);
}
