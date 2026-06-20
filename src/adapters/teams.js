// src/adapters/teams.js
// Teams-spezifischer Adapter: Bot-Framework-Authentifizierung,
// Activity-Handler, Express-Router für /api/messages.
//
// Fachliche Logik lebt in src/core/agent.js – der Adapter mapped nur
// Teams-Activity ↔ Channel-Key/Text und sendet die Antwort zurück.
import express from 'express';
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  TurnContext,
  TeamsActivityHandler,
} from 'botbuilder';
import { config } from '../config.js';
import * as agent from '../core/agent.js';

class TeamsChatBot extends TeamsActivityHandler {
  constructor() {
    super();
    this.onMessage(async (ctx, next) => {
      const txt =
        TurnContext.removeRecipientMention(ctx.activity)?.trim() ||
        ctx.activity.text?.trim() ||
        '';

      if (!txt) {
        await ctx.sendActivity('Keine Nachricht erkannt.');
        return next();
      }

      await ctx.sendActivity({ type: 'typing' });

      try {
        const channelKey = `teams:${
          ctx.activity.from?.aadObjectId || ctx.activity.from?.id || 'unknown'
        }`;
        const { answer } = await agent.run({
          channelKey,
          userText: txt,
          channel: 'teams',
        });
        await ctx.sendActivity(answer);
      } catch (e) {
        console.error('Agent-Fehler:', e?.status, e?.message);
        await ctx.sendActivity(
          'Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder wende dich an den Support.'
        );
      }

      return next();
    });
  }
}

export function createTeamsRouter() {
  const cred = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: config.bot.appId,
    MicrosoftAppPassword: config.bot.appPassword,
    MicrosoftAppType: config.bot.appType,
    ...(config.bot.tenantId
      ? { MicrosoftAppTenantId: config.bot.tenantId }
      : {}),
  });
  const adapter = new CloudAdapter(
    createBotFrameworkAuthenticationFromConfiguration(null, cred)
  );
  adapter.onTurnError = async (ctx, err) => {
    console.error('Bot-Fehler:', err);
    await ctx.sendActivity(
      'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'
    );
  };

  const bot = new TeamsChatBot();
  const router = express.Router();
  router.post('/', (req, res) =>
    adapter.process(req, res, ctx => bot.run(ctx))
  );
  return router;
}
