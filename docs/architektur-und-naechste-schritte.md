# AcmeCo Sales Bot -- Systemarchitektur & Roadmap

> Stand: 16. April 2026 | Vorbereitung Meeting Weiterentwicklung

---

## 1. Systemarchitektur (Ist-Zustand)

### Überblick

```
┌──────────────┐     HTTPS/JSON      ┌──────────────────────┐     Messages API     ┌──────────────┐
│  MS Teams    │ ──────────────────► │  Azure App Service   │ ──────────────────► │  Anthropic   │
│  (Client)    │ ◄────────────────── │  (Node.js / Express) │ ◄────────────────── │  Claude API  │
└──────────────┘                     └──────────────────────┘                     └──────────────┘
                                              │
                                              │ Web Search Tool
                                              ▼
                                     ┌──────────────────┐
                                     │  manufacturer-docs.example.com         │
                                     │  example-company.de    │
                                     └──────────────────┘
```

### Komponenten

| Komponente | Technologie | Beschreibung |
|---|---|---|
| **Bot-Runtime** | Node.js 20/22, Express 5, ES Modules | Empfaengt Nachrichten via `/api/messages`, verarbeitet sie und antwortet |
| **Bot Framework** | `botbuilder` v4.23 (Microsoft Bot Framework SDK) | Handhabt Teams-Protokoll, Auth, Activity-Routing |
| **LLM-Backend** | Anthropic Claude API (`@anthropic-ai/sdk` v0.35) | KI-Antwortgenerierung mit System-Prompt und Web-Search-Tool |
| **Hosting** | Azure App Service (Linux, Node 20) | Always-On, HTTPS-only, Zip-Deploy |
| **Bot-Registrierung** | Azure Bot Service (F0 / kostenlos) | Verbindet Azure App Service mit MS Teams Channel |
| **Identitaet** | User Assigned Managed Identity | Authentifizierung gegenueber Microsoft (kein Passwort noetig) |
| **Infrastruktur** | Azure Bicep (IaC) | Deklarative Bereitstellung aller Azure-Ressourcen |
| **Deployment** | M365 Agents Toolkit (ehem. Teams Toolkit) v1.9 | Provision, Deploy, Publish in einem Workflow |

### Tech-Stack im Detail

| Kategorie | Detail |
|---|---|
| **Sprache** | JavaScript (ES Modules, Node.js) |
| **Laufzeit** | Node.js 20 oder 22 |
| **Web-Framework** | Express 5.1 |
| **Bot-SDK** | Microsoft Bot Framework SDK for JavaScript v4 |
| **LLM** | Anthropic Claude Haiku 4.5 (Modell: `claude-haiku-4-5-20251001`) |
| **LLM-Features** | System-Prompt mit Cache-Control, Web Search Tool (manufacturer-docs.example.com, example-company.de) |
| **Infrastruktur** | Azure Bicep, M365 Agents Toolkit YAML |
| **Dev-Tools** | nodemon, env-cmd, dotenv |

### Aktuelles LLM-Verhalten

- **System-Prompt**: Definiert in `src/system-prompt.js` -- Der Bot agiert als KI-Assistent fuer den Vertriebsaussendienst
- **Harte Regeln**: Keine Preisauskuenfte, keine verbindlichen Machbarkeitszusagen, nur Vertriebsthemen
- **Web Search**: Beschraenkt auf `manufacturer-docs.example.com` und `example-company.de`, max. 5 Aufrufe pro Anfrage, Standort Deutschland
- **Kein Gespraechsverlauf**: Jede Nachricht wird aktuell als eigenstaendige Anfrage behandelt (kein Multi-Turn)

### Geplant aber pausiert

- **Notion-MCP-Integration**: Code-Platzhalter und Bicep-Parameter sind vorhanden, aber auskommentiert. Ziel: Read-only-Zugriff auf eine Notion-Wissensdatenbank als Kontext fuer den Bot. Wartet auf Rebuild des Notion-MCP-Servers.

---

## 2. Naechste Schritte -- Teams-App Implementierung

### 2.1 Kurzfristig (Quick Wins)

| # | Aufgabe | Aufwand | Beschreibung |
|---|---|---|---|
| 1 | **Conversation History** | Mittel | Multi-Turn-Gespraeche ermoeglichen. Aktuell wird jede Nachricht isoliert verarbeitet. Loesung: In-Memory-Store oder Azure Cosmos DB / Table Storage fuer Gespraechsverlauf pro User/Conversation. |
| 2 | **Notion-Wissensdatenbank anbinden** | Mittel | MCP-Server-Rebuild abschliessen und als Tool in die Claude API integrieren. Ermoeglicht Zugriff auf interne Produktdoku, Anleitungen, FAQ. |
| 3 | **Adaptive Cards** | Gering | Antworten als strukturierte Karten mit Buttons, Links, Bildern statt reinem Text. Verbessert UX in Teams erheblich. |
| 4 | **Error Handling & Logging** | Gering | Strukturiertes Logging (z.B. Application Insights), Retry-Logik fuer Anthropic API, Health-Check-Endpoint erweitern. |

### 2.2 Mittelfristig

| # | Aufgabe | Aufwand | Beschreibung |
|---|---|---|---|
| 5 | **Streaming-Antworten** | Mittel | Claude API unterstuetzt Streaming. Kombiniert mit Teams' Typing-Indicator und schrittweisem Message-Update fuer bessere UX bei laengeren Antworten. |
| 6 | **Authentifizierung & Rollen** | Hoch | SSO mit Azure AD integrieren, damit der Bot weiss, wer fragt. Ermoeglicht rollenbasierte Antworten (z.B. Aussendienst vs. Innendienst). |
| 7 | **Feedback-Mechanismus** | Gering | Thumbs-Up/Down-Buttons unter jeder Antwort. Daten in Azure Table Storage oder Cosmos DB fuer spaetere Auswertung. |
| 8 | **Modell-Upgrade** | Gering | Evaluierung von Claude Sonnet 4.6 oder Opus 4.6 fuer komplexere Anfragen. Aktuell laeuft Haiku 4.5 (schnell, guenstig, aber weniger leistungsfaehig). |

### 2.3 Langfristig

| # | Aufgabe | Aufwand | Beschreibung |
|---|---|---|---|
| 9 | **Multi-Channel-Architektur** | Hoch | Bot-Logik von Kanal-spezifischem Code trennen (siehe Abschnitt 3). |
| 10 | **RAG-Pipeline** | Hoch | Vollwertige Retrieval-Augmented-Generation-Pipeline mit Vektor-Datenbank (z.B. Azure AI Search) fuer groessere Dokumentenmengen. |
| 11 | **Analytics-Dashboard** | Mittel | Auswertung von Nutzungsstatistiken, haeufigen Fragen, Antwortqualitaet. |

---

## 3. Alternative Kanaele neben MS Teams

### Architektur-Voraussetzung: Kanal-Abstraktion

Um mehrere Kanaele zu bedienen, sollte die Bot-Logik (LLM-Aufruf, System-Prompt, Wissensdatenbank) von der kanalspezifischen Nachrichtenverarbeitung getrennt werden:

```
                    ┌─────────────┐
                    │  MS Teams   │──► Teams Adapter (Bot Framework)
                    └─────────────┘         │
                    ┌─────────────┐         │
                    │  WhatsApp   │──► WhatsApp Adapter
                    └─────────────┘         │         ┌──────────────────┐     ┌───────────┐
                    ┌─────────────┐         ├────────►│  Bot-Core        │────►│ Claude API│
                    │  Telegram   │──► Telegram Adapter│  (Geschaefts-   │◄────│           │
                    └─────────────┘         │         │   logik, Prompt, │     └───────────┘
                    ┌─────────────┐         │         │   Wissensdaten)  │
                    │  Web-Chat   │──► Web Adapter     └──────────────────┘
                    └─────────────┘         │
                    ┌─────────────┐         │
                    │  Eigene App │──► REST API Adapter
                    └─────────────┘
```

### Kanal-Vergleich

| Kanal | Aufwand | Kosten | Zielgruppe | Vorteile | Nachteile |
|---|---|---|---|---|---|
| **MS Teams** (aktuell) | Vorhanden | Azure Bot Service F0 (kostenlos) | Interne Mitarbeiter (Aussendienst) | Bereits integriert, SSO moeglich, Adaptive Cards | Nur fuer Mitarbeiter mit Teams-Lizenz |
| **WhatsApp Business API** | Hoch | Meta-Gebuehren pro Gespraech (~0,04-0,07 EUR), Hosting | Endkunden, Handwerker, Partner | Riesige Verbreitung, Mobile-first, vertraut | Meta Business Verification noetig, strenge Template-Regeln, Kosten pro Nachricht, 24h-Session-Fenster |
| **Telegram Bot** | Gering | Kostenlos (Telegram API) | Tech-affine Nutzer, interne Tests | Sehr einfache API, kostenlos, schnell aufgesetzt, Rich Media | Geringe Verbreitung in DE Business-Kontext |
| **Web-Chat (Embedding)** | Mittel | Nur Hosting-Kosten | Website-Besucher, Interessenten | Kein App-Download noetig, auf example-company.de einbettbar, volle Gestaltungsfreiheit | Eigenes Frontend noetig, kein Push |
| **Eigene Mobile App** | Sehr hoch | Entwicklung + App Store + Hosting | Aussendienst im Feld | Volle Kontrolle, Offline-Faehigkeit, Push-Notifications, GPS/Kamera-Integration | Hoher Entwicklungs- und Wartungsaufwand, App-Store-Prozess |
| **Slack** | Gering | Kostenlos (Slack API) | Interne Teams (falls Slack genutzt) | Aehnlich wie Teams, einfache Bot-API | Nur relevant, wenn Slack im Einsatz |
| **E-Mail** | Mittel | Gering | Alle mit E-Mail | Universell verfuegbar, asynchron | Langsam, kein Echtzeit-Dialog, Formatierung eingeschraenkt |

### Empfehlung: Priorisierung der Kanaele

1. **MS Teams** -- Weiter ausbauen (Conversation History, Adaptive Cards, Notion-Anbindung)
2. **Web-Chat auf example-company.de** -- Zweithoechste Prioritaet. Erreicht Kunden/Interessenten ohne App-Installation. Kann mit dem Azure Bot Framework Direct Line Channel oder einem eigenen Lightweight-Frontend realisiert werden.
3. **WhatsApp** -- Sinnvoll fuer Endkunden-Kommunikation, aber regulatorischer und finanzieller Overhead. Erst nach stabilem Core sinnvoll.
4. **Telegram** -- Gut als Prototyping-/Testkanal wegen minimalem Aufwand.
5. **Eigene App** -- Nur bei klarem Mehrwert (z.B. Offline, Kamera-Integration fuer Vor-Ort-Dokumentation).

### Technische Details pro Kanal

#### WhatsApp Business API
- **Anbieter**: Meta direkt oder ueber BSP (Business Solution Provider) wie Twilio, MessageBird/Bird, 360dialog
- **Integration**: Webhook-basiert, aehnlich wie Bot Framework. Nachrichten kommen als HTTP POST, Antworten gehen via REST API zurueck.
- **Voraussetzungen**: Meta Business Manager, verifiziertes Unternehmen, Telefonnummer, genehmigte Message Templates fuer proaktive Nachrichten
- **Aufwand**: ~2-4 Wochen fuer Adapter + Meta-Verifizierung

#### Telegram Bot
- **Integration**: Telegram Bot API (HTTP-basiert), Webhook oder Long-Polling
- **Voraussetzungen**: Bot-Token via @BotFather, kein Verifizierungsprozess
- **Aufwand**: ~2-3 Tage fuer einen funktionierenden Adapter

#### Web-Chat
- **Option A**: Azure Bot Framework Direct Line -- Nutzung des bestehenden Bot-Backends, Microsoft stellt ein einbettbares Web-Chat-Widget bereit
- **Option B**: Eigenes Frontend (React/HTML) mit eigenem REST-Endpoint am Express-Server
- **Aufwand**: Option A: ~1 Woche; Option B: ~2-3 Wochen (inkl. UI-Design)

#### Eigene Mobile App
- **Technologie**: React Native oder Flutter fuer Cross-Platform (iOS + Android)
- **Backend**: Bestehender Express-Server um REST-API erweitern
- **Aufwand**: ~2-4 Monate fuer MVP

---

## 4. Offene Punkte / Diskussionsbedarf

- [ ] Notion-MCP-Server: Zeitplan fuer Rebuild? Gibt es Alternativen (z.B. direkte Notion-API)?
- [ ] Soll der Bot auch Endkunden erreichen (dann Web-Chat / WhatsApp priorisieren) oder bleibt er intern?
- [ ] Gespraechsverlauf: In-Memory (einfach, aber fluechtig) vs. persistenter Store (Cosmos DB)?
- [ ] Budget fuer Claude-Modell-Upgrade (Haiku vs. Sonnet vs. Opus)?
- [ ] Datenschutz: Welche Daten duerfen an Anthropic gesendet werden? EU-Data-Residency?
- [ ] Soll eine Testumgebung fuer weitere Kanaele aufgesetzt werden?
