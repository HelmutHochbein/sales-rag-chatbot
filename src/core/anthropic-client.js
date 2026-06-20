// src/core/anthropic-client.js
// Singleton-Anthropic-Client + Request-Builder.
// Kanal-agnostisch: wird sowohl vom Teams- als auch vom WhatsApp-Adapter
// (über agent.run()) verwendet.
import Anthropic from '@anthropic-ai/sdk';
import { config, readPromptTemplate } from '../config.js';
import { SYSTEM_PROMPT } from '../system-prompt.js';

export const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

function deepClone(o) {
  return o ? JSON.parse(JSON.stringify(o)) : o;
}

// Mappt das prompt_request.json-Format auf Anthropic-Tool-Definitionen.
// Aktuell nur web_search; Custom-Tools (Notion, PDFs) kommen separat
// über den Tool-Registry-Mechanismus hinzu.
function normalizeTemplateTools(tools) {
  if (!Array.isArray(tools)) return [];
  return tools
    .map(t => {
      if (!t?.type) return null;
      if (t.type === 'web_search') {
        const out = { type: 'web_search_20250305', name: 'web_search' };
        if (t.allowed_domains) out.allowed_domains = t.allowed_domains;
        if (t.max_uses) out.max_uses = t.max_uses;
        if (t.user_location) {
          const loc = t.user_location;
          out.user_location = {
            type: loc.type || 'approximate',
            ...(loc.country && { country: loc.country }),
            ...(loc.region && { region: loc.region }),
            ...(loc.city && { city: loc.city }),
            ...(loc.timezone && { timezone: loc.timezone }),
          };
        }
        return out;
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Baut einen vollständigen messages.create()-Request.
 * - System-Prompt mit cache_control: ephemeral.
 * - Tools = extraTools (z.B. Custom-Tools aus tool-registry) + Template-Tools (Web-Search).
 *
 * @param {object} args
 * @param {Array}  args.messages    Anthropic-messages[] (history + neuer user-Turn)
 * @param {Array} [args.extraTools] Zusätzliche Tool-Definitionen
 * @returns {object} request body für anthropic.messages.create()
 */
export function buildBaseRequest({ messages, extraTools = [] }) {
  const tpl = deepClone(readPromptTemplate()) || {};
  const templateTools = normalizeTemplateTools(tpl.tools);
  const tools = [...extraTools, ...templateTools];
  return {
    model:
      config.anthropic.model || tpl.model || 'claude-haiku-4-5-20251001',
    max_tokens: tpl.max_tokens || 1500,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
    ...(tools.length && { tools, tool_choice: { type: 'auto' } }),
  };
}
