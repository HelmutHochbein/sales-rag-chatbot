# Azure Naming Convention — AcmeCo Bot Family

Dieses Dokument legt fest, wie Azure-Ressourcen für die AcmeCo Bot Family benannt und getaggt werden. Ziel: jedes zukünftige Bot-Projekt (Service, HR, Operations, …) lässt sich ohne Nachdenken nach dem gleichen Muster anlegen.

## Schreibweise

Kanonisch: **`acmeco`** (lowercase, einfach-h).

> Die historische Schreibweise `AcmeCo`/`acmeco` (doppel-h) lebt noch in der Alt-Resource-Group `rg-acmeco-bot-prod`. Bei Neuanlagen wird **nicht** mehr so geschrieben.

## Pro Bot eine Resource Group

Jeder Bot bekommt seine eigene Resource Group. Begründung:

- klare RBAC-Grenze (Abteilungs-Owner kann auf seine eigene RG, nicht auf die anderen)
- klare Cost-Reports pro Bot/Abteilung
- unabhängige Lifecycle / Deployments
- einfaches Aufräumen wenn ein Bot zurückgezogen wird

## Naming-Muster

| Ressource | Muster | Beispiel (Sales) |
|---|---|---|
| Resource Group | `acmeco-chatbot-<dept>` | `acmeco-chatbot-sales` |
| App Service Plan | `hw<dept>bot` | `salesbot` |
| Web App | `hw<dept>bot` | `salesbot` |
| Bot Channels Registration | `hw<dept>bot` | `salesbot` |
| User-Assigned Managed Identity | `hw<dept>bot` | `salesbot` |
| Storage Account (State) | `hw<dept>botstate` | `salesbotstate` |

**Erklärungen:**

- `<dept>` ist das Department in Kleinbuchstaben, ohne Bindestrich/Unterstrich (`sales`, `service`, `hr`, `operations`, …).
- Storage-Account-Namen dürfen nur `a–z` + `0–9` enthalten und sind global eindeutig — daher zusammengeschrieben.
- Web-App-Namen werden zur DNS-Subdomain `<name>.azurewebsites.net` — daher kurz und ohne Sonderzeichen.
- Das Suffix `bot` macht den Workload sofort erkennbar, auch wenn die Ressourcen aus dem RG-Kontext gerissen werden.

## Region

Default: `germanywestcentral` (Frankfurt). Datenschutzlich und latenzmäßig die richtige Wahl, solange keine Workload-spezifischen Gründe dagegen sprechen.

## Pflicht-Tags

Auf **jede** Ressource innerhalb einer Bot-RG müssen folgende Tags:

| Tag | Werte | Beispiel |
|---|---|---|
| `Department` | Sales \| Service \| HR \| Operations \| … | `Sales` |
| `Workload` | `Chatbot` (fest) | `Chatbot` |
| `Environment` | `prod` \| `staging` \| `dev` | `prod` |
| `Owner` | Email einer Person oder Team-Alias | `tom.straube@example-company.de` |

**Bonus optional:** `CostCenter` (Buchhaltungs-Kostenstelle), `ProjectCode`, `Lifecycle` (`permanent`/`experimental`).

Tags werden über `az tag update --operation merge` gesetzt — das überschreibt keine vorhandenen Tags, sondern fügt nur an.

## Neuanlage eines neuen Bots — Checkliste

Für `<dept>` (z.B. `service`):

1. **Resource Group**: `az group create --name acmeco-chatbot-<dept> --location germanywestcentral`
2. **App Service Plan**: `az appservice plan create --name hw<dept>bot ...`
3. **Web App**: `az webapp create --name hw<dept>bot ...`
4. **User-Assigned Managed Identity**: `az identity create --name hw<dept>bot ...`
5. **Bot Channels Registration**: `az bot create --kind webapp --name hw<dept>bot ...`
6. **Storage Account**: `az storage account create --name hw<dept>botstate ...`
7. **Tags auf alle Ressourcen** (siehe oben)
8. **App Settings** (Anthropic-Key, ggf. Telegram-Token, Notion-Token, Azure-Storage-Connection, …) gemäß der pro Bot relevanten Konfiguration

## Was wir aus historischen Gründen **nicht** mehr ändern

Diese Namen sind in Azure unveränderlich (Storage-Accounts und App-Service-Subdomains sind global, Resource-Groups unterstützen kein Rename) und bleiben deshalb so wie sie sind:

| Ressource | aktueller Name | Anmerkung |
|---|---|---|
| RG `acmeco-chatbot-sales` | ✓ konform | bereits Schema-konform |
| `salesbot` (App, Plan, MI, Bot) | ✓ konform | bereits Schema-konform |
| `salesbotstate` | ✓ konform | bereits Schema-konform |
| Webhook-URL `https://salesbot.azurewebsites.net` | fix | wird so auch in `m365agents.yml` referenziert |

Heißt: **die aktuelle Sales-Struktur ist bereits das Schema** — keine Migration nötig. Bei der nächsten Bot-Abteilung einfach das Muster fortführen.

## Legacy: `rg-acmeco-bot-prod` — bleibt bestehen

Diese RG enthält den **Vorgänger-Bot** (alte AcmeCo-Schreibweise) und ist in Teams **aktiv ausgerollt**. Bot Channels Registration `azureBotService_AcmeCo` (`msaAppId 00000000-0000-0000-0000-000000000006`) zeigt auf den App Service `acmeco-bot-linux`.

**NICHT löschen** bevor:
1. die Teams-App des alten Bots offiziell zurückgezogen ist,
2. die Bot Channels Registration in Microsoft Azure entfernt wurde,
3. eine eventuell genutzte Conversation-History exportiert ist.

Schutz auf der RG (gesetzt am 2026-05-26):
- Tags: `Workload=Chatbot`, `Environment=prod`, `Lifecycle=legacy`, `DoNotDelete=true`, `Description="AcmeCo-Vorgaenger-Bot - laeuft noch in Teams - NICHT loeschen"`
- Resource Lock (`CanNotDelete`): **noch nicht gesetzt** — erfordert `Microsoft.Authorization/locks/write`. Sobald jemand mit `Owner`/`User Access Administrator` verfügbar ist:
  ```bash
  az lock create \
    --name "legacy-acmeco-bot-do-not-delete" \
    --resource-group rg-acmeco-bot-prod \
    --lock-type CanNotDelete \
    --notes "Legacy AcmeCo-Bot laeuft noch in Teams."
  ```

Erkennbare Bestandteile:
- `acmeco-bot-linux` — primärer App Service (Bot-Endpoint)
- `bot15b841` — vermutlich ein Test/Sandbox-Bot (zuletzt geändert 2026-04-27)
- `acmeco-bot-resource` + `workspace-undefined` — Azure AI / Cognitive Workspace
- `azureBotService_AcmeCo` — Bot Channels Registration
- `MSI_acmeco-bot-identity`, `ASP-acmeco-bot` — Identity + App Service Plan

