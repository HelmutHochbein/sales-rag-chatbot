// src/core/agent.js
// Kanal-agnostischer Einstiegspunkt für einen Bot-Turn.
//
// Stand: Multi-Turn mit Conversation State + Tool-Use-Loop für Custom-Tools.
// Solange tool-registry leer ist, läuft jeder Turn in einer Iteration durch
// (Web-Search ist server-seitig, terminiert mit end_turn). Sobald Notion-/
// PDF-Tools registriert sind, dispatcht der Loop deren Aufrufe.
import { anthropic, buildBaseRequest } from './anthropic-client.js';
import * as state from './state.js';
import * as toolRegistry from './tool-registry.js';
import * as questionLog from './question-log.js';

const MAX_ITERATIONS = 8;

function extractText(content) {
  return (content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

/**
 * Führt einen Bot-Turn aus.
 *
 * @param {object} args
 * @param {string} args.channelKey  z.B. 'teams:<aadObjectId>', 'whatsapp:<E164>' oder 'telegram:<chatId>'
 * @param {string} args.userText    Nachrichtentext des Users
 * @param {string} [args.channel]   'teams' | 'whatsapp' | 'telegram' – beeinflusst später Style-Suffix
 * @returns {Promise<{answer:string, usage:object|undefined}>}
 */
export async function run({ channelKey, userText, channel } = {}) {
  // Fire-and-forget: anonymisierter Frage-Log in eigene Table.
  // Darf den User-Turn nie blockieren oder zum Scheitern bringen.
  questionLog
    .logQuestion({ channelKey, channel, question: userText })
    .catch(err =>
      console.warn('[agent] questionLog failed:', err?.message)
    );

  const history = await state.getHistory(channelKey);
  const messages = [...history, { role: 'user', content: userText }];

  // newTurns = alles, was nach dem User-Input neu dazukommt (User-Turn +
  // Assistant-Antworten + ggf. Tool-Result-Turns aus dem Loop).
  const newTurns = [{ role: 'user', content: userText }];

  let finalText = '';
  let lastUsage;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const resp = await anthropic.messages.create(
      buildBaseRequest({
        messages,
        extraTools: toolRegistry.customDefinitions,
      })
    );
    lastUsage = resp.usage;

    // Komplettes content-Array übernehmen (text + tool_use + web_search_tool_result …).
    messages.push({ role: 'assistant', content: resp.content });
    newTurns.push({ role: 'assistant', content: resp.content });

    if (
      resp.stop_reason === 'end_turn' ||
      resp.stop_reason === 'stop_sequence'
    ) {
      finalText = extractText(resp.content);
      break;
    }

    if (resp.stop_reason === 'tool_use') {
      const toolUses = resp.content.filter(b => b.type === 'tool_use');
      const toolResults = await Promise.all(
        toolUses.map(async tu => {
          try {
            const content = await toolRegistry.dispatch(tu.name, tu.input, {
              channelKey,
            });
            return { type: 'tool_result', tool_use_id: tu.id, content };
          } catch (e) {
            console.warn(`[agent] tool ${tu.name} failed:`, e?.message);
            return {
              type: 'tool_result',
              tool_use_id: tu.id,
              is_error: true,
              content: [
                { type: 'text', text: `Tool-Fehler: ${e?.message || e}` },
              ],
            };
          }
        })
      );
      const userToolMsg = { role: 'user', content: toolResults };
      messages.push(userToolMsg);
      newTurns.push(userToolMsg);
      continue;
    }

    if (resp.stop_reason === 'max_tokens') {
      finalText =
        (extractText(resp.content) || 'Antwort gekürzt.') + '\n\n[gekürzt]';
      break;
    }

    if (resp.stop_reason === 'pause_turn') {
      // server-side tool pausiert intern; nächste Iteration übernimmt
      continue;
    }

    // Unbekannter stop_reason: nehmen, was da ist, abbrechen.
    finalText = extractText(resp.content);
    break;
  }

  if (!finalText) {
    finalText = 'Ich konnte keine Antwort generieren. Bitte erneut versuchen.';
  }

  await state.appendTurns(channelKey, newTurns);

  return { answer: finalText, usage: lastUsage };
}
