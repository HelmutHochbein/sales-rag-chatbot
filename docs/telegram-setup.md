# Telegram-Bot Setup

Der Telegram-Kanal nutzt denselben Core-Agent (`src/core/agent.js`) wie Teams.
Der Adapter (`src/adapters/telegram.js`) registriert einen Express-Webhook
unter `/api/telegram` und spricht die Telegram Bot API per plain `fetch` an –
keine zusätzliche SDK-Dependency.

## 1. Bot beim BotFather registrieren

1. In Telegram `@BotFather` öffnen.
2. `/newbot` senden.
3. Anzeigename + Username (muss auf `bot` enden) vergeben.
4. BotFather liefert ein Token im Format `123456789:AAH...` – sicher ablegen.

Optional, aber empfohlen:

- `/setdescription`, `/setabouttext`, `/setuserpic` – Profil pflegen
- `/setprivacy` → `Disable`, **nur** falls der Bot später in Gruppen alles
  lesen können soll. Für 1:1-DMs irrelevant.

## 2. Token in der lokalen Umgebung hinterlegen

In `env/.env.dev` setzen:

```
TELEGRAM_BOT_TOKEN=123456789:AAH...
TELEGRAM_WEBHOOK_SECRET=<frei gewählter geheimer String>
```

Der `WEBHOOK_SECRET` ist optional, schützt aber gegen gefälschte
Webhook-Calls. Wenn gesetzt, prüft der Adapter den Header
`x-telegram-bot-api-secret-token`.

## 3. Lokal entwickeln (ngrok)

Telegram-Webhooks benötigen eine öffentlich erreichbare HTTPS-URL:

```bash
npm run dev                  # startet Express auf Port 3978
ngrok http 3978              # tunnelt Port 3978 nach außen
```

ngrok zeigt eine URL der Form `https://<random>.ngrok-free.app` an.

## 4. Webhook bei Telegram registrieren

Einmalig pro öffentlicher URL ausführen:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://<ngrok-or-prod>/api/telegram",
    "secret_token": "<WEBHOOK_SECRET>"
  }'
```

Verifizieren:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

`last_error_message` muss leer sein. Bei Statuses wie `404`/`401` Token oder
URL prüfen.

## 5. Produktion (Azure App Service)

In Prod ist `BOT_ENDPOINT` (z. B. `https://salesbot.azurewebsites.net`)
bereits öffentlich. Webhook entsprechend setzen:

```
url=https://salesbot.azurewebsites.net/api/telegram
```

`TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` als App-Settings im Azure
App Service hinterlegen (nicht ins Repo committen).

## 6. Smoke-Test

1. Bot im Telegram-Client per `t.me/<botusername>` öffnen, `/start` oder
   `Hallo` senden.
2. Bot zeigt typing-Indikator und antwortet aus dem Sales-Agent.
3. Zweite Nachricht im selben Chat → Konversationsverlauf muss erhalten
   bleiben (Azure Table mit `PartitionKey = telegram:<chatId>`).

## Bekannte Grenzen (out of scope)

- Nur Text-DMs. Sticker, Fotos, Voice, Callback-Queries werden ignoriert
  (`200 OK` ohne Antwort).
- Antworten > 4096 Zeichen werden automatisch in Chunks à ≤ 4000 Zeichen
  gesplittet.
- `parse_mode` ist nicht gesetzt – der Bot sendet Plain Text. Markdown/HTML
  bewusst weggelassen, weil Escaping fehleranfällig ist.
