# Sales RAG Chatbot

A Microsoft Teams AI bot for a field sales team, built with the Teams AI SDK and Claude (Anthropic). The bot answers product and process questions by searching a Notion knowledge base, reading PDF documents, and running live web searches — within defined guardrails (no prices, no binding commitments). Deployed to Azure App Service via Bicep IaC with managed identity.

## Problem → Solution → Result

Field sales reps spend significant time looking up product specs, installation requirements, and process details before and during customer visits. This bot gives them an always-available assistant that knows the company's Notion knowledge base and can pull current manufacturer documentation — while being explicitly constrained from giving prices or making promises the team can't guarantee.

## Architecture

```
Microsoft Teams
      │  Bot Framework (Teams AI SDK)
      ▼
┌─────────────────────────────────────────────────┐
│              Azure App Service                  │
│                                                 │
│  src/                                           │
│  ├── index.js            (Teams adapter entry)  │
│  ├── core/                                      │
│  │   ├── agent.js        (conversation loop)    │
│  │   ├── anthropic-client.js  (Claude API)      │
│  │   ├── tool-registry.js                       │
│  │   └── tools/                                 │
│  │       ├── search_notion.js                   │
│  │       ├── get_notion_page.js                 │
│  │       ├── list_documents.js                  │
│  │       └── read_document.js                   │
│  └── system-prompt.js    (Claude system prompt) │
│                                                 │
│  Integrations:                                  │
│  ├── Notion API      (knowledge base)           │
│  ├── Claude API      (Haiku 4.5)                │
│  ├── Claude web_search (allowed domains)        │
│  └── Azure Table Storage (conversation state)   │
└─────────────────────────────────────────────────┘
         │  Azure Bicep (infra/azure.bicep)
         ▼
    Azure Resource Group
    ├── Bot Channels Registration
    ├── App Service (B1)
    └── Azure Table Storage
```

**Tool-use flow per message:** retrieve history from Azure Table Storage → call Claude with system prompt + history → Claude calls Notion/document/web tools as needed → final response sent to Teams.

## Tech Stack

- **TypeScript / Node.js** · **Microsoft Teams AI SDK** (`@microsoft/teams-ai`)
- **Claude API** (Haiku 4.5, Anthropic) with tool use
- **Notion API** — knowledge base search and page retrieval
- **Azure Bicep** — Infrastructure as Code (App Service + Bot Registration + Table Storage)
- **Azure Table Storage** — serverless conversation state
- **n8n** — downstream deal distribution workflow
- **Microsoft 365 Agents Toolkit** for local development

## Local Setup

```bash
npm install
cp env/.env.playground env/.env.local
# Set: ANTHROPIC_API_KEY, NOTION_TOKEN, NOTION_ROOT_PAGE_ID,
#      MICROSOFT_APP_ID, MICROSOFT_APP_PASSWORD
npm start   # port 3978
```

Use the **Microsoft 365 Agents Playground** (`m365agents.playground.yml`) to test locally without a Teams tenant.

## Infrastructure (Bicep)

```bash
az deployment group create \
  --resource-group rg-salesbot \
  --template-file infra/azure.bicep \
  --parameters @infra/azure.parameters.json
```

Secrets (`ANTHROPIC_API_KEY`, `NOTION_TOKEN`) are passed as secure Bicep parameters and stored as App Service settings — never in code or env files in production.

## Key Design Decisions

- **Hard guardrails in system prompt** — price queries and commitment requests are blocked unconditionally at the prompt level, regardless of conversation context.
- **Azure Table Storage for state** — avoids running Redis or Postgres for what is essentially a key-value conversation store.
- **Managed identity in production** — `AZURE_USE_MANAGED_IDENTITY=1` + `AZURE_TABLE_ENDPOINT` replaces connection strings; the App Service identity has table-level RBAC.
- **Claude Haiku** — chosen for latency and cost; the tool-use loop can make 3–4 API calls per message, so a faster/cheaper model matters here.
