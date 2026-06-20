import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Dealverteilung
// Nodes   : 47  |  Connections: 54
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// HvAusHubspotAbrufen                httpRequest                [creds]
// UpdateADeal                        hubspot                    [creds]
// Vertriebsgebiet                    if                         
// CreateOrUpdateAContact             hubspot                    [creds]
// GetAContact                        hubspot                    [creds]
// PlzgebietExtrahieren3Stellen       code                       
// PlzregionExtrahieren2Stellen       code                       
// HvAusHubspotAbrufenFallback        httpRequest                [creds]
// RoundRobinOnlineTeam               code                       
// Webhook                            webhook                    
// CodeInJavascript                   code                       
// RespondToWebhook                   respondToWebhook           
// RespondToWebhook1                  respondToWebhook           
// Crypto                             crypto                     
// Filter1                            filter                     
// HsReadADeal                        httpRequest                [creds]
// HsCreateAnEngagement               httpRequest                [creds]
// Wait                               wait                       
// KontaktZugeordnet                  if                         
// WebhookSuccess                     if                         
// ZustandigerMaBekannt               switch                     
// DealOwnerBereitsAusgewahlt         if                         
// JsonItemOwnerIdDefinieren1         set                        
// JsonItemOwnerIdDefinieren          set                        
// HvNachPlzGebietMatchen1            code                       
// RoundRobinHandelsvertreterWahlen1  code                       
// HvIdentifiziert1                   if                         
// HvCounter1Weekly                   httpRequest                [onError→out(1)] [creds]
// If_                                if                         
// HvAusHubspotAbrufenOwnerCheck      httpRequest                [onError→out(1)] [creds]
// ValidateContactOwnerViaHvAktiv     code                       
// ContactOwnerAlsHvAktiv             if                         
// ExecutionData                      executionData              
// JsonItemOwnerIdDefinierenTeamlead  set                        
// JsonItemOwnerIdDefinierenAli       set                        
// ChosenownerAlsHvObjektAbrufen      httpRequest                [creds]
// DealUndHvObjektVerknupfen          httpRequest                [onError→regular] [creds]
// MergeChosenHubspotId               set                        
// DealDorleZuweisen                  hubspot                    [creds]
// KontaktDorleZuweisen               hubspot                    [creds]
// IstHvObjektBereitsVerknupft        httpRequest                [creds]
// HvIdAbrufen                        httpRequest                [creds]
// UpdateTelliStatus                  hubspot                    [creds]
// Kauflead                           if                         
// NoOperationDoNothing               noOp                       
// TelliRouting                       switch                     
// TelliOwner                         if                         
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// HvAusHubspotAbrufenFallback
//    → RoundRobinOnlineTeam
// Webhook
//    → CodeInJavascript
//      → Crypto
//        → WebhookSuccess
//          → RespondToWebhook
//            → HsReadADeal
//              → Filter1
//                → KontaktZugeordnet
//                  → ExecutionData
//                  → IstHvObjektBereitsVerknupft
//                    → DealOwnerBereitsAusgewahlt
//                      → HvIdAbrufen
//                        → JsonItemOwnerIdDefinieren
//                          → MergeChosenHubspotId
//                            → ChosenownerAlsHvObjektAbrufen
//                              → DealUndHvObjektVerknupfen
//                                → TelliOwner
//                                  → Kauflead
//                                    → TelliRouting
//                                      → UpdateTelliStatus
//                                     .out(1) → NoOperationDoNothing
//                                     .out(2) → UpdateADeal
//                                        → CreateOrUpdateAContact
//                                          → HsCreateAnEngagement
//                                   .out(1) → UpdateADeal (↩ loop)
//                                 .out(1) → UpdateADeal (↩ loop)
//                     .out(1) → GetAContact
//                        → ZustandigerMaBekannt
//                          → HvAusHubspotAbrufenOwnerCheck
//                            → ValidateContactOwnerViaHvAktiv
//                              → ContactOwnerAlsHvAktiv
//                                → JsonItemOwnerIdDefinieren1
//                                  → MergeChosenHubspotId (↩ loop)
//                               .out(1) → PlzgebietExtrahieren3Stellen
//                                  → PlzregionExtrahieren2Stellen
//                                    → Vertriebsgebiet
//                                      → HvAusHubspotAbrufen
//                                        → HvNachPlzGebietMatchen1
//                                          → HvIdentifiziert1
//                                            → RoundRobinHandelsvertreterWahlen1
//                                              → HvCounter1Weekly
//                                              → MergeChosenHubspotId (↩ loop)
//                                           .out(1) → If_
//                                              → JsonItemOwnerIdDefinierenTeamlead
//                                                → MergeChosenHubspotId (↩ loop)
//                                             .out(1) → JsonItemOwnerIdDefinierenAli
//                                                → MergeChosenHubspotId (↩ loop)
//                                     .out(1) → DealDorleZuweisen
//                                        → KontaktDorleZuweisen
//                           .out(1) → PlzgebietExtrahieren3Stellen (↩ loop)
//                         .out(1) → PlzgebietExtrahieren3Stellen (↩ loop)
//                 .out(1) → Wait
//                    → HsReadADeal (↩ loop)
//         .out(1) → RespondToWebhook1
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "HiCq0VGtvigh8dcX",
    name: "Dealverteilung",
    active: true,
    isArchived: false,
    projectId: "Lx32jD9ZWWyYQZqY",
    settings: { executionOrder: "v1", callerPolicy: "workflowsFromSameOwner", executionTimeout: 900, errorWorkflow: "D7y04Ryg6AVVbGwg", binaryMode: "separate" }
})
export class DealverteilungWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        id: "fec6fa66-c82c-4ebb-b143-4ee3d76c4eb8",
        name: "HV aus Hubspot abrufen",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [2000, -960],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    HvAusHubspotAbrufen = {
        url: "https://api.hubapi.com/crm/v3/objects/2-191607507?limit=100&properties=hubspot_id,plz_gebiete,online_team,acmeco_standort,zuweisungsstatus,aktiv,ausgeschlossene_leadquellen,max_leads_pro_woche_auto,auto_leads_laufende_woche,handelsvertreter_owner",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        options: {}
    };

    @node({
        id: "f9320b17-f332-4a8a-83ff-ab7fb2bfd610",
        name: "Update a deal",
        type: "n8n-nodes-base.hubspot",
        version: 2.1,
        position: [4464, -1056],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    UpdateADeal = {
        authentication: "appToken",
        resource: "deal",
        operation: "update",
        dealId: {
            __rl: true,
            value: "={{ $('HS-Read-a-Deal').item.json.id }}",
            mode: "id"
        },
        updateFields: {
            customPropertiesUi: {
                customPropertiesValues: [
                    {
                        property: "acmeco_standort",
                        value: "={{ $json.acmeco_standort }}"
                    }
                ]
            },
            dealOwner: {
                __rl: true,
                value: "={{ $('Merge chosen_hubspot_id').item.json.chosen_hubspot_id }}",
                mode: "id"
            }
        }
    };

    @node({
        id: "e8bab636-f690-49b0-bf12-75bafe6f9bad",
        name: "Vertriebsgebiet?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [1776, -864]
    })
    Vertriebsgebiet = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 2
            },
            conditions: [
                {
                    id: "8dbca4af-e356-4248-b1f0-78052124d50b",
                    leftValue: `={{
(
  [
    "01","02","03","04","06","07","08","09",
    "15","16","17",
    "66","67","68","69",
    "70","71","72","73","74","75","76","77","78","79",
    "80","81","82","83","84","85","86","87","88","89",
    "90","91","92","93","94","95","96","97","98","99"
  ].includes($json.plzRegion)
  ||
  ["185"].includes($json.plzGebiet)
  ||
  ["18347","18375","18374"].includes($json.properties?.zip?.value ?? $json.zip)
)
? "Sperrgebiet"
: "Vertriebsgebiet"
}}
`,
                    rightValue: "Vertriebsgebiet",
                    operator: {
                        type: "string",
                        operation: "contains"
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "0a01bd4d-8632-43ae-ad9e-483af450821d",
        name: "Create or update a contact",
        type: "n8n-nodes-base.hubspot",
        version: 2.2,
        position: [4688, -1056],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    CreateOrUpdateAContact = {
        authentication: "appToken",
        email: `={{ $("Get a contact").isExecuted
  ? ($("Get a contact").item.json.properties.email.value || $("Get a contact").item.json.properties.email)
  : ($json.properties.email || $json.email)
}}`,
        additionalFields: {
            contactOwner: "={{ $('Merge chosen_hubspot_id').item.json.chosen_hubspot_id }}"
        },
        options: {
            resolveData: false
        }
    };

    @node({
        id: "f5de5c85-ce8a-4467-840c-4307cad60425",
        name: "Get a contact",
        type: "n8n-nodes-base.hubspot",
        version: 2.1,
        position: [672, -912],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    GetAContact = {
        authentication: "appToken",
        operation: "get",
        contactId: {
            __rl: true,
            value: "={{ $('HS-Read-a-Deal').item.json.associations.contacts.results[0].id }}",
            mode: "id"
        },
        additionalFields: {
            propertiesCollection: {
                propertiesValues: {
                    properties: [
                        "zip",
                        "e_mail",
                        "firstname",
                        "lastname",
                        "hubspot_owner_id"
                    ],
                    propertyMode: "valueOnly"
                }
            }
        }
    };

    @node({
        id: "5711c31d-8d08-4f84-8ae5-75c9dac9bdc6",
        name: "plzGebiet extrahieren (3 Stellen)",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1328, -864]
    })
    PlzgebietExtrahieren3Stellen = {
        mode: "runOnceForEachItem",
        jsCode: `const raw = String($json.properties?.zip?.value || $json.zip || "");
const prefix = raw.substring(0, 3);

return {
  json: {
    ...$json,
    plzgebiet: prefix,
  },
};
`
    };

    @node({
        id: "5d4c4ca2-1f8e-47c0-ac7c-3f0a7b0a7ee2",
        name: "plzRegion extrahieren (2 Stellen)",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1552, -864]
    })
    PlzregionExtrahieren2Stellen = {
        mode: "runOnceForEachItem",
        jsCode: `const raw = String($json.properties?.zip?.value || "");
const prefix = raw.substring(0, 2); // "21" aus "21376"

return {
  json: {
    ...$json,
    plzRegion: prefix,
  },
};
`
    };

    @node({
        id: "6b0eca73-6b4b-459f-bd0c-b907985c96d4",
        name: "HV aus Hubspot abrufen (Fallback)",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [-1360, -640],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    HvAusHubspotAbrufenFallback = {
        url: "https://api.hubapi.com/crm/v3/objects/2-191607507?limit=100&properties=hubspot_id,plz_gebiete,online_team",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        options: {}
    };

    @node({
        id: "b54d6a2e-7e6e-41ba-855d-68f4c76c094a",
        name: "Round Robin Online-Team",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [-1136, -640]
    })
    RoundRobinOnlineTeam = {
        mode: "runOnceForEachItem",
        jsCode: `/**
 * Round Robin über Online-Team (Fallback)
 * Erwartet:
 *  - HV-Liste aus Node "HV aus Hubspot abrufen (Fallback)"
 *  - Im aktuellen Item idealerweise ein Seed (dealId/contactId), damit deterministisch
 * Output:
 *  - { chosen_hubspot_id, pool_size, seed_used }
 */

const repsNodeName = 'HV aus Hubspot abrufen (Fallback)'; // <- ggf. anpassen

// ---- Helpers ----
const toStr = (v) => (v == null ? '' : String(v));
const truthy = (v) => {
  const s = toStr(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'ja' || s === 'wahr' || v === true;
};
const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

// ---- 1) HV-Liste einsammeln ----
const pages = $items(repsNodeName, 0) || [];
let reps = [];

const first = pages[0]?.json ?? {};
if (Array.isArray(first.results)) {
  reps = first.results;                 // HubSpot CRM Node ODER HTTP ohne body
} else if (Array.isArray(first.body?.results)) {
  reps = first.body.results;            // HTTP Node mit body.results
} else {
  // Fallback: flatten + dedupe
  const flat = pages.flatMap(i => {
    const j = i?.json ?? {};
    if (Array.isArray(j.results)) return j.results;
    if (Array.isArray(j.body?.results)) return j.body.results;
    return [];
  });
  const seen = new Set();
  reps = flat.filter(r => {
    const id = r?.properties?.hubspot_id ?? r?.hubspot_id ?? '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// ---- 2) Online-Team filtern ----
// Erwartet: properties.online_team ist "true"/"false" (String) oder Boolean
const online = reps.filter(r => truthy(r?.properties?.online_team));

// ---- 3) IDs sammeln ----
const pool = Array.from(
  new Set(
    online
      .map(r => r?.properties?.hubspot_id ?? r?.hubspot_id)
      .map(toStr)
      .filter(Boolean)
  )
);

if (pool.length === 0) {
  return {
    json: {
      error: 'no_online_team_found',
      chosen_hubspot_id: null,
      pool_size: 0
    }
  };
}

// ---- 4) Seed für deterministische Auswahl ----
// Nimm hier dein eindeutiges Feld. Beispiel: dealId aus "Split Out"
const seed =
  $('HS-Read-a-Deal').item.json.id ||  // <- anpassen, wenn dein Node anders heißt
  $json.dealId ||
  $json.contactId ||
  Date.now().toString();              // Fallback: nicht deterministisch

const idx = hashCode(String(seed)) % pool.length;

// ---- 5) Ergebnis zurückgeben (ein einzelnes Item) ----
return {
  json: {
    chosen_hubspot_id: pool[idx],
    pool_size: pool.length,
    seed_used: String(seed),
    pool_all: pool // optional zum Debuggen
  }
};
`
    };

    @node({
        id: "9c0f1cfa-2cfd-4510-882d-13007e37b123",
        webhookId: "1cf75d00-24f8-482a-ba79-4cfe2ffa58f3",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        version: 2.1,
        position: [-1360, -960]
    })
    Webhook = {
        httpMethod: "POST",
        path: "dealowner-assignment/",
        responseMode: "responseNode",
        options: {
            binaryPropertyName: "rawBodyBin",
            rawBody: true
        }
    };

    @node({
        id: "ddfbc001-b483-42f0-91c1-a7e33b232cd4",
        name: "Code in JavaScript",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [-1136, -960]
    })
    CodeInJavascript = {
        jsCode: `// === Code node (JavaScript) — Build rawString for HubSpot v3 signature ===
// Assumptions:
// - Webhook node: Raw Body = ON, Binary Data = ON, Binary Property = rawBodyBin
// - Headers liegen in json.headers, komplette URL in json.webhookUrl (wie bei dir)

const MAX_AGE = 5 * 60 * 1000;

// HubSpot verlangt das Decodieren ausgewählter %XX-Sequenzen (nicht alles!)
function decodeRequired(uri) {
  const m = { '%3A':':','%2F':'/','%3F':'?','%40':'@','%21':'!','%24':'$',
              '%27':"'",'%28':'(','%29':')','%2A':'*','%2C':',','%3B':';' };
  return uri.replace(/%[0-9A-Fa-f]{2}/g, x => m[x] ?? x);
}

// Minimaler URL-Parser ohne globales URL-Objekt
function splitUrl(full) {
  if (typeof full !== 'string') return null;
  // z.B. https://n8n.example-company.de/webhook-test/dealowner-assignment/?a=1
  const m = full.match(/^([a-zA-Z][a-zA-Z0-9+\\-.]*):\\/\\/([^\\/?#]+)([^\\s]*)$/);
  if (!m) return null;
  const proto = m[1].toLowerCase();        // https
  const host  = m[2];                       // n8n.example-company.de
  const pathq = m[3] || '/';                // /webhook-test/....?...
  return { proto, host, pathq };
}

// Body -> String (Binary bevorzugt, sonst rawBody, sonst JSON.stringify)
function bodyToString(item) {
  const j = item.json || {};
  // Binary aus Webhook
  const bin = item.binary?.rawBodyBin;
  if (bin?.data) return Buffer.from(bin.data, 'base64').toString('utf8');
  // Raw Body als String (manche n8n-Versionen)
  if (typeof j.rawBody === 'string') return j.rawBody;
  // Geparst
  if (j.body !== undefined) return JSON.stringify(j.body);
  return '';
}

function build(item) {
  const j = item.json || {};
  const h = j.headers || {};
  const sig = h['x-hubspot-signature-v3'] ?? h['X-HubSpot-Signature-V3'] ?? '';
  const tsH = h['x-hubspot-request-timestamp'] ?? h['X-HubSpot-Request-Timestamp'] ?? '';

  // Timestamp prüfen (ohne harten Abbruch)
  let problems = [];
  if (!sig) problems.push('missing_signature');
  if (!tsH) problems.push('missing_timestamp');

  const tsNum = Number(tsH);
  if (tsH && (!Number.isFinite(tsNum))) problems.push('invalid_timestamp');
  if (Number.isFinite(tsNum) && (Date.now() - tsNum > MAX_AGE)) problems.push('stale_timestamp');

  // URL aus webhookUrl (dein Feld)
  const parts = splitUrl(j.webhookUrl);
  if (!parts) problems.push('invalid_webhookUrl');

  // URI zusammenbauen + selektiv decodieren
  const uri = parts ? \`\${parts.proto}://\${parts.host}\${decodeRequired(parts.pathq)}\` : '';

  // Body-String ermitteln
  const bodyStr = bodyToString(item);

  // Methode (HubSpot Webhooks sind POST, aber wir normalisieren trotzdem)
  const method = (j.method || 'POST').toUpperCase();

  // rawString immer als String liefern (Crypto crasht sonst)
  const rawString = (sig && tsH && uri !== '')
    ? \`\${method}\${uri}\${bodyStr}\${tsH}\`
    : '';

  return {
    ok: problems.length === 0,
    reason: problems.length ? problems.join('|') : undefined,
    method,
    uri,
    signature: sig,
    timestamp: Number.isFinite(tsNum) ? tsNum : null,
    // WICHTIG: immer String zurückgeben!
    rawString,
    // Debug-Helfer:
    debug: {
      proto: parts?.proto, host: parts?.host, pathq: parts?.pathq,
      hasBinary: !!(item.binary?.rawBodyBin?.data),
      bodyPreview: bodyStr.slice(0,160),
    }
  };
}

const input = await $input.all();
return input.map(build);
`
    };

    @node({
        id: "9fd11740-087e-49a8-9ed3-e686cc28a177",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        version: 1.4,
        position: [-464, -1056]
    })
    RespondToWebhook = {
        respondWith: "text",
        responseBody: "{  status: 'ok' }",
        options: {}
    };

    @node({
        id: "2cee66f7-f004-4145-8239-4d5277aebe9f",
        name: "Respond to Webhook1",
        type: "n8n-nodes-base.respondToWebhook",
        version: 1.4,
        position: [-464, -864]
    })
    RespondToWebhook1 = {
        respondWith: "text",
        responseBody: "={{ $json }}",
        options: {}
    };

    @node({
        id: "8d7f6a42-695c-4b7e-bb5d-4a2430a7d166",
        name: "Crypto",
        type: "n8n-nodes-base.crypto",
        version: 1,
        position: [-912, -960]
    })
    Crypto = {
        action: "hmac",
        type: "SHA256",
        value: "={{ $json.rawString || '' }}",
        dataPropertyName: "expected",
        secret: "c37e9f92-43b5-4376-8184-b165b4004997",
        encoding: "base64"
    };

    @node({
        id: "9fef797a-b7e1-4399-8a06-cb2abdb5bca2",
        name: "Filter1",
        type: "n8n-nodes-base.filter",
        version: 2.2,
        position: [-16, -1152]
    })
    Filter1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 2
            },
            conditions: [
                {
                    id: "9387c2f7-e0f4-4f53-9217-630d12c7a2cf",
                    leftValue: "={{ $json.properties.hubspot_owner_id }}",
                    rightValue: "",
                    operator: {
                        type: "string",
                        operation: "empty",
                        singleValue: true
                    }
                },
                {
                    id: "b7e396a9-9b55-41f7-a8e9-5dbfe314b9a8",
                    leftValue: "={{ $json.properties.telli_status }}",
                    rightValue: "forwarded_to_telli",
                    operator: {
                        type: "string",
                        operation: "notEquals"
                    }
                },
                {
                    id: "e63440df-ecab-4c1d-8b3d-b16d4adbc499",
                    leftValue: "={{ $json.properties.telli_status }}",
                    rightValue: "transferred_to_telli",
                    operator: {
                        type: "string",
                        operation: "notEquals"
                    }
                },
                {
                    id: "a4e61b20-0857-4436-a5e1-e5788cb49431",
                    leftValue: "={{ ['157247217', '157247218', '4745630951'].includes($json.properties.dealstage) }}",
                    rightValue: "157247217",
                    operator: {
                        type: "boolean",
                        operation: "true",
                        singleValue: true
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "8c55515f-abb6-4a05-9df7-45480dcea276",
        name: "HS-Read-a-Deal",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [-240, -1056],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    HsReadADeal = {
        url: "=https://api.hubapi.com/crm/v3/objects/deals/{{ $('Webhook').item.json.body[0].objectId }}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: "associations",
                    value: "contact"
                },
                {
                    name: "properties",
                    value: "hubspot_owner_id, telli_status, dealstage, associations, dealname, deal_quelle, objekt_postleitzahl, website_objektart, objekt_adresszeile, objekt_stadt, objekt_address_country, object_address_state, geschaftsbereich, website_produkt, object_address_county, pipeline, geschaftsbeziehung, num_associated_contacts, chosen_owner_id"
                }
            ]
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: "Accept",
                    value: "application/json"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "5ef36822-7ea6-4a6f-9971-ff61e4d80f75",
        name: "HS-Create-an-engagement",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [4912, -1056],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    HsCreateAnEngagement = {
        method: "POST",
        url: "https://api.hubapi.com/crm/v3/objects/tasks",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: "Content-Type",
                    value: "application/json"
                }
            ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "properties": {
    "hs_timestamp": "{{ DateTime.now()
  .setZone('Europe/Berlin')
  .set({ hour: 17, minute: 0, second: 0, millisecond: 0 })
  .toISO() }}",
    "hs_task_body": "* Ersten Kundenanruf tätigen\\n* Ersttermin vereinbaren und in HubSpot einpflegen\\n* Kundenkontakt mit Erledigung dieser Aufgabe bestätigen",
    "hs_task_subject": "Neuer Lead - Erste Kontaktaufnahme mit Interessenten & Ersttermin vereinbaren: {{ ($('Update a deal').item.json.properties.dealname.value || '').replace(/\\r?\\n/g, ' ') }}",
    "hs_task_status": "NOT_STARTED",
    "hubspot_owner_id": "{{ $('Merge chosen_hubspot_id').item.json.chosen_hubspot_id }}"
  },
  "associations": [
    {
      "to": {
        "id": "{{ $('Get a contact').item.json.vid }}"
      },
      "types": [
        {
          "associationCategory": "HUBSPOT_DEFINED",
          "associationTypeId": 204
        }
      ]
    },
    {
      "to": {
        "id": "{{ $('Update a deal').item.json.dealId }}"
      },
      "types": [
        {
          "associationCategory": "HUBSPOT_DEFINED",
          "associationTypeId": 216
        }
      ]
    }
  ]
}`,
        options: {}
    };

    @node({
        id: "1f0f3a38-8839-4b8e-af28-1307f5de4f18",
        webhookId: "8c95a7ea-c524-460e-86c4-509c7756dd17",
        name: "Wait",
        type: "n8n-nodes-base.wait",
        version: 1.1,
        position: [432, -960]
    })
    Wait = {
        amount: 30
    };

    @node({
        id: "b41e1796-1631-4d6b-8af7-0cfc9f702381",
        name: "Kontakt zugeordnet",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [208, -1152]
    })
    KontaktZugeordnet = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 2
            },
            conditions: [
                {
                    id: "67c752d8-27ed-47ad-90fe-fbe32579dbfa",
                    leftValue: "={{ $('HS-Read-a-Deal').item.json.properties.num_associated_contacts }}",
                    rightValue: 0,
                    operator: {
                        type: "number",
                        operation: "gt"
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "432058cb-544f-4c30-9fa9-846b159be38b",
        name: "Webhook Success?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [-688, -960]
    })
    WebhookSuccess = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
                version: 2
            },
            conditions: [
                {
                    id: "1f23455a-59a2-4cd7-b176-5c124d7c7546",
                    leftValue: "={{ $json.expected }}",
                    rightValue: "={{ $json.signature }}",
                    operator: {
                        type: "string",
                        operation: "equals"
                    }
                }
            ],
            combinator: "and"
        },
        options: {}
    };

    @node({
        id: "87962814-2ecc-4dfa-acde-9ac9365d7dc7",
        name: "Zuständiger MA bekannt",
        type: "n8n-nodes-base.switch",
        version: 3.3,
        position: [896, -912]
    })
    ZustandigerMaBekannt = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "loose",
                            version: 2
                        },
                        conditions: [
                            {
                                id: "1a0c0403-019b-46da-84ce-4778132e3a8a",
                                leftValue: "={{ $json.properties.hubspot_owner_id.value }}",
                                rightValue: "",
                                operator: {
                                    type: "string",
                                    operation: "notEmpty",
                                    singleValue: true
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Contact-Owner bekannt"
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "loose",
                            version: 2
                        },
                        conditions: [
                            {
                                leftValue: "={{ $json.properties.hubspot_owner_id.value }}",
                                rightValue: "",
                                operator: {
                                    type: "string",
                                    operation: "empty",
                                    singleValue: true
                                },
                                id: "9abe46ac-7d33-4888-8338-d20488f1a373"
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Kein Contact-Owner"
                }
            ]
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "ebc259e5-8393-447b-8808-6ee5856e00f5",
        name: "Deal-Owner bereits ausgewählt?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [656, -1184]
    })
    DealOwnerBereitsAusgewahlt = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 2
            },
            conditions: [
                {
                    id: "7c9b8f1e-d5b4-4743-ad5d-b24cfe30e4f8",
                    leftValue: "={{ $json.results }}",
                    rightValue: "",
                    operator: {
                        type: "array",
                        operation: "notEmpty",
                        singleValue: true
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "b71c4920-39cf-4314-91cf-39076cd3ae45",
        name: "JSON-Item \"Owner-ID“ definieren1",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [2896, -1344]
    })
    JsonItemOwnerIdDefinieren1 = {
        assignments: {
            assignments: [
                {
                    id: "79118d52-1620-4872-ba4c-38884291663d",
                    name: "chosen_hubspot_id",
                    value: "={{ $('Get a contact').item.json.properties.hubspot_owner_id.value }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "8779deeb-cece-49bf-b2ba-806c57ae307c",
        name: "JSON-Item \"Owner-ID“ definieren",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [2896, -1536]
    })
    JsonItemOwnerIdDefinieren = {
        assignments: {
            assignments: [
                {
                    id: "79118d52-1620-4872-ba4c-38884291663d",
                    name: "chosen_hubspot_id",
                    value: "={{ $json.properties.hubspot_id }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "1602e7d5-76c9-4e51-bb7d-a4cc546f8051",
        name: "HV nach PLZ-Gebiet matchen1",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [2224, -960]
    })
    HvNachPlzGebietMatchen1 = {
        mode: "runOnceForEachItem",
        jsCode: `/**
 * HV nach PLZ-Gebiet matchen (Run Once for Each Item)
 * Erwartet im aktuellen Item: json.plzgebiet (3-stellig)
 * Verwendet HV-Liste aus Node "HV aus Hubspot abrufen"
 *
 * Phase 1 + Weekly Caps:
 * - Filtert nur Reps mit aktiv === true
 *   (Backwards-compat: wenn aktiv leer/nicht vorhanden -> als true behandeln)
 * - Optional: ausgeschlossene_leadquellen (multi-select). Wenn deal_quelle dort enthalten ist -> Rep wird ausgeschlossen.
 * - Weekly Cap:
 *   - max_leads_pro_woche_auto (Number)
 *   - auto_leads_laufende_woche (Number)
 *   -> Wenn counter >= max (und max > 0) => Rep ist NICHT eligible
 *
 * Zusätzlich (Overflow-Logik):
 * - coverage_found: Anzahl HVs, die PLZ-Coverage haben (nur PLZ-Match, ohne Eligibility-Filter)
 * - teamlead_owner_id: Owner-ID aus HV-Property "handelsvertreter_owner" (HubSpot User/Owner Feld)
 *
 * Output: {
 *   matches_ids: string[],
 *   match_details: object[],
 *   found: number,
 *   coverage_found: number,
 *   teamlead_owner_id: string,
 *   prefix3: string,
 *   deal_quelle: string
 * }
 */

const repsNodeName = 'HV aus Hubspot abrufen';

// Helpers
const toStr = (v) => (v == null ? '' : String(v));
const splitTokens = (v) =>
  toStr(v)
    .split(/[\\s;,|]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
const norm3 = (s) => toStr(s).slice(0, 3).padStart(3, '0');
const normKey = (s) => toStr(s).trim().toLowerCase();

const toNum = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v;
  const s = normKey(v);
  if (['true', '1', 'yes', 'ja', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'nein', 'n'].includes(s)) return false;
  return null;
};

// ---- Deal Lead Source (deal_quelle) ----
const deal = $('HS-Read-a-Deal').item.json || {};
const dealQuelleRaw =
  deal.properties?.deal_quelle?.value ??
  deal.properties?.deal_quelle ??
  deal.deal_quelle ??
  '';
const dealQuelle = normKey(dealQuelleRaw);

// ---- 1) Präfix strikt aus dem aktuellen Item holen ----
const prefixRaw = $('plzGebiet extrahieren (3 Stellen)').item.json?.plzgebiet;
const prefix3 = norm3(prefixRaw);

if (!/^\\d{3}$/.test(prefix3)) {
  return {
    json: {
      matches_ids: [],
      match_details: [],
      found: 0,
      coverage_found: 0,
      teamlead_owner_id: '',
      prefix3: toStr(prefixRaw || ''),
      deal_quelle: dealQuelleRaw,
      reason: 'missing_current_item_plzgebiet',
    },
  };
}

// ---- 2) HV-Liste aus genau EINER Quelle lesen (erste Seite bevorzugt) ----
const hvItems = $items(repsNodeName, 0) || [];
const first = hvItems[0]?.json ?? {};
let reps = [];

if (Array.isArray(first.results)) {
  reps = first.results;
} else if (Array.isArray(first.body?.results)) {
  reps = first.body.results;
} else {
  const flat = hvItems.flatMap((i) => {
    const j = i?.json ?? {};
    if (Array.isArray(j.results)) return j.results;
    if (Array.isArray(j.body?.results)) return j.body.results;
    return [];
  });

  const seen = new Set();
  reps = flat.filter((r) => {
    const id = r?.properties?.hubspot_id ?? r?.hubspot_id ?? '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// ---- 3) Eligibility Filter (zuweisungsstatus + ausgeschlossene_leadquellen + weekly cap) ----
function isActiveRep(repProps) {
  // Primary: zuweisungsstatus (Single Select) -> nur "Aktiv" ist eligible
  const statusRaw = toStr(repProps?.zuweisungsstatus ?? '').trim().toLowerCase();
  if (statusRaw) return statusRaw === 'aktiv';

  // Fallback: altes Boolean-Feld "aktiv"
  const raw = repProps?.aktiv;
  const b = toBool(raw);
  if (b == null) return true;   // bisheriges Verhalten
  return b === true;
}

function isExcludedByLeadSource(repProps) {
  if (!dealQuelle) return false;
  const raw = repProps?.ausgeschlossene_leadquellen;
  const tokens = splitTokens(raw).map(normKey);
  return tokens.includes(dealQuelle);
}

function isOverWeeklyCap(repProps) {
  const max = toNum(repProps?.max_leads_pro_woche_auto);
  const cnt = toNum(repProps?.auto_leads_laufende_woche) ?? 0;

  if (max == null || max <= 0) return false; // kein Cap
  return cnt >= max;
}

// ---- 4a) Coverage-Matches: nur PLZ-Coverage (ohne Eligibility-Filter) ----
const coverageMatches = reps.filter((r) => {
  const props = r?.properties || {};
  const gebiete3 = splitTokens(props.plz_gebiete).map(norm3);
  return gebiete3.includes(prefix3);
});

const coverage_found = coverageMatches.length;

// Teamlead Owner-ID direkt aus Owner-Feld (API: handelsvertreter_owner)
const teamlead_owner_id = toStr(
  coverageMatches[0]?.properties?.handelsvertreter_owner ?? ''
);

// ---- 4b) Eligible-Matches: PLZ-Coverage + Eligibility ----
const matches = reps.filter((r) => {
  const props = r?.properties || {};
  const gebiete3 = splitTokens(props.plz_gebiete).map(norm3);
  if (!gebiete3.includes(prefix3)) return false;

  if (!isActiveRep(props)) return false;
  if (isExcludedByLeadSource(props)) return false;
  if (isOverWeeklyCap(props)) return false;

  return true;
});

// ---- 5) IDs sammeln + deduplizieren ----
const uniqueIds = Array.from(
  new Set(
    matches
      .map((r) => r?.properties?.hubspot_id ?? r?.hubspot_id)
      .map(toStr)
      .filter(Boolean)
  )
);

// ---- 6) Detail-Infos zu den Matches sammeln ----
const matchDetails = matches.map((r) => {
  const props = r?.properties || {};
  return {
    hubspot_id: toStr(props.hubspot_id),
    hv_object_id: toStr(r?.id ?? props.id ?? ''), // HV-Record ID
    acmeco_standort: toStr(props.acmeco_standort),

    // Teamlead Owner-ID (für Debug/Tracing)
    teamlead_owner_id: toStr(props.handelsvertreter_owner ?? ''),

    aktiv: toStr(props.aktiv ?? ''),
    ausgeschlossene_leadquellen: toStr(props.ausgeschlossene_leadquellen ?? ''),
    max_leads_pro_woche_auto: toStr(props.max_leads_pro_woche_auto ?? ''),
    auto_leads_laufende_woche: toStr(props.auto_leads_laufende_woche ?? '0'),
  };
});

// ---- 7) Ergebnis ----
return {
  json: {
    matches_ids: uniqueIds,
    match_details: matchDetails,
    found: uniqueIds.length,
    coverage_found,
    teamlead_owner_id,
    prefix3,
    deal_quelle: dealQuelleRaw,
  },
};`
    };

    @node({
        id: "cbfd5ba1-541c-4f1f-915c-6bdea93a1755",
        name: "Round Robin Handelsvertreter wählen1",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [2896, -1152]
    })
    RoundRobinHandelsvertreterWahlen1 = {
        mode: "runOnceForEachItem",
        jsCode: `const toStr = (v) => (v == null ? '' : String(v));
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const ids = Array.isArray($json.matches_ids)
  ? $json.matches_ids.map(toStr).filter(Boolean)
  : [];

// Erwartet: match_details[] enthält pro Rep: hubspot_id, hv_object_id, acmeco_standort,
// max_leads_pro_woche_auto, auto_leads_laufende_woche
const detailsArr = Array.isArray($json.match_details) ? $json.match_details : [];
const detailsById = new Map(detailsArr.map(d => [toStr(d.hubspot_id), d]));

if (ids.length === 0) {
  return { json: { error: 'no_matches_ids_provided', chosen_hubspot_id: null, hv_object_id: null, acmeco_standort: null, pool_size: 0 } };
}

const pool = ids.map((id) => {
  const d = detailsById.get(id) || {};
  const max = toNum(d.max_leads_pro_woche_auto, 0);
  const cnt = toNum(d.auto_leads_laufende_woche, 0);

  // weight = remaining capacity if max>0 else 1
  const remaining = max > 0 ? Math.max(0, max - cnt) : 1;
  const weight = Math.max(1, remaining);

  return {
    hubspot_id: id,
    hv_object_id: d.hv_object_id ?? null,
    acmeco_standort: d.acmeco_standort ?? null,
    counter_current: cnt,
    counter_next: cnt + 1,
    max: max > 0 ? max : null,
    weight,
  };
});

const total = pool.reduce((s, p) => s + p.weight, 0);
let r = Math.random() * total;
let chosen = pool[pool.length - 1];
for (const p of pool) {
  r -= p.weight;
  if (r <= 0) { chosen = p; break; }
}

const seed_used = $('HS-Read-a-Deal')?.item?.json?.id ?? null;

return {
  json: {
    chosen_hubspot_id: chosen.hubspot_id,
    hv_object_id: chosen.hv_object_id,
    acmeco_standort: chosen.acmeco_standort,
    auto_leads_laufende_woche_current: chosen.counter_current,
    auto_leads_laufende_woche_next: chosen.counter_next,
    max_leads_pro_woche_auto: chosen.max,
    weight_used: chosen.weight,
    pool_size: pool.length,
    seed_used,
  }
};`
    };

    @node({
        id: "3911fac9-7890-4020-b52f-d1f60475d75c",
        name: "HV identifiziert?1",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [2448, -960]
    })
    HvIdentifiziert1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
                version: 2
            },
            conditions: [
                {
                    id: "f86ba70c-5732-46b5-ba50-3aa19b1495e1",
                    leftValue: "={{ $json.found }}",
                    rightValue: 0,
                    operator: {
                        type: "number",
                        operation: "gt"
                    }
                }
            ],
            combinator: "and"
        },
        options: {}
    };

    @node({
        id: "4beb4fbc-7b2a-4e0a-860c-07a53fc9c809",
        name: "HV Counter +1 (Weekly)",
        type: "n8n-nodes-base.httpRequest",
        version: 4.3,
        position: [3120, -816],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}},
        onError: "continueErrorOutput"
    })
    HvCounter1Weekly = {
        method: "PATCH",
        url: "=https://api.hubapi.com/crm/v3/objects/2-191607507/{{$json.hv_object_id}}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendHeaders: true,
        specifyHeaders: "json",
        jsonHeaders: `={
  "Content-Type": "application/json"
}`,
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "properties": {
    "auto_leads_laufende_woche": "{{$json.auto_leads_laufende_woche_next}}"
  }
}`,
        options: {}
    };

    @node({
        id: "b52f20a2-ea6d-4553-9b7b-528e5f6c01af",
        name: "If",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [2672, -864]
    })
    If_ = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
                version: 2
            },
            conditions: [
                {
                    id: "05806047-3662-459f-9664-fc12ae4db5d1",
                    leftValue: "={{ $json.coverage_found }}",
                    rightValue: 0,
                    operator: {
                        type: "number",
                        operation: "gt"
                    }
                }
            ],
            combinator: "and"
        },
        options: {}
    };

    @node({
        id: "5705d3a5-e0fa-45e1-b7f6-5808d51913b2",
        name: "HV aus Hubspot abrufen (Owner Check)",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [896, -1088],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}},
        onError: "continueErrorOutput"
    })
    HvAusHubspotAbrufenOwnerCheck = {
        method: "POST",
        url: "https://api.hubapi.com/crm/v3/objects/2-191607507/search",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "hubspot_id",
          "operator": "EQ",
          "value": "{{ String($('Get a contact').item.json?.properties?.hubspot_owner_id?.value ?? '').trim() }}"
        }
      ]
    }
  ],
  "properties": [
    "hubspot_id",
    "plz_gebiete",
    "online_team",
    "acmeco_standort",
    "aktiv",
    "zuweisungsstatus",
    "handelsvertreter_owner"
  ],
  "limit": 1
}`,
        options: {}
    };

    @node({
        id: "050ada86-6ea1-425f-b195-6f025a992f80",
        name: "Validate Contact Owner via HV aktiv",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1088, -1088]
    })
    ValidateContactOwnerViaHvAktiv = {
        mode: "runOnceForEachItem",
        jsCode: `/**
 * Validate existing Contact Owner against Handelsvertreter-Objekt.
 * Minimal-fix:
 * - prüft owner_valid
 * - verliert Kontext nicht
 * - trägt PLZ / plzgebiet für den Fallback weiter
 * - nutzt primär zuweisungsstatus (Aktiv/Pausiert/Inaktiv), fallback auf altes Boolean aktiv
 */

const ownerId = String($('Get a contact').item.json?.properties?.hubspot_owner_id?.value ?? '').trim();

const rawZip = String(
  $json?.properties?.zip?.value ??
  $json?.zip ??
  $('Get a contact').item.json?.properties?.zip?.value ??
  $('Get a contact').item.json?.zip ??
  ''
).trim();

const prefix3 = rawZip.substring(0, 3);

const toBool = (v) => {
  if (v === true || v === false) return v;
  const s = String(v ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'ja'].includes(s)) return true;
  if (['false', '0', 'no', 'nein'].includes(s)) return false;
  return null;
};

if (!ownerId) {
  return {
    json: {
      ...$json,
      zip: rawZip || ($json?.zip ?? null),
      plzgebiet: prefix3 || ($json?.plzgebiet ?? null),
      owner_id: null,
      owner_valid: false,
      fallback_reason: 'missing_contact_owner_id',
      matched_hv_object_id: null,
      matched_hv_hubspot_id: null,
      matched_hv_aktiv: null,
    },
  };
}

// Ergebnis aus HV Owner Check Node lesen (egal ob GET-Liste oder POST-search: wir nehmen results[])
const searchResult = $('HV aus Hubspot abrufen (Owner Check)').item.json ?? {};
const reps = Array.isArray(searchResult.results) ? searchResult.results : [];
const matched = reps[0] ?? null;

if (!matched) {
  return {
    json: {
      ...$json,
      zip: rawZip || ($json?.zip ?? null),
      plzgebiet: prefix3 || ($json?.plzgebiet ?? null),
      owner_id: ownerId,
      owner_valid: false,
      fallback_reason: 'no_matching_hv_for_contact_owner',
      matched_hv_object_id: null,
      matched_hv_hubspot_id: null,
      matched_hv_aktiv: null,
    },
  };
}

const props = matched.properties ?? {};
const status = String(props.zuweisungsstatus ?? '').trim().toLowerCase();

let aktiv = null;     // immer definiert
let isActive = false;

if (status) {
  isActive = (status === 'aktiv');
  aktiv = isActive;   // für Logging
} else {
  aktiv = toBool(props.aktiv);
  isActive = (aktiv === null ? true : aktiv === true);
}

return {
  json: {
    ...$json,
    zip: rawZip || ($json?.zip ?? null),
    plzgebiet: prefix3 || ($json?.plzgebiet ?? null),
    owner_id: ownerId,
    owner_valid: isActive,
    fallback_reason: isActive ? null : 'matched_hv_inactive',
    matched_hv_object_id: matched.id ?? null,
    matched_hv_hubspot_id: props.hubspot_id ?? null,
    matched_hv_aktiv: aktiv,
  },
};`
    };

    @node({
        id: "53d59831-dd0e-4ff4-aed1-e5a1ac897a33",
        name: "Contact Owner als HV aktiv?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [1312, -1088]
    })
    ContactOwnerAlsHvAktiv = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
                version: 2
            },
            conditions: [
                {
                    id: "c4e4c834-a3f3-4772-bf18-2c52a85a03d0",
                    leftValue: "={{ $json.owner_valid }}",
                    rightValue: true,
                    operator: {
                        type: "boolean",
                        operation: "equals"
                    }
                }
            ],
            combinator: "and"
        },
        options: {}
    };

    @node({
        id: "0d622ab8-23f1-451d-b5b4-4a5d92650558",
        name: "Execution Data",
        type: "n8n-nodes-base.executionData",
        version: 1.1,
        position: [432, -1376]
    })
    ExecutionData = {
        dataToSave: {
            values: [
                {
                    key: "dealID",
                    value: "={{ $('HS-Read-a-Deal').item.json.id }}"
                }
            ]
        }
    };

    @node({
        id: "4ce14902-04c3-4d29-9207-fea05a41d628",
        name: "JSON-Item \"Owner-ID“ definieren (Teamlead)",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [2896, -960]
    })
    JsonItemOwnerIdDefinierenTeamlead = {
        assignments: {
            assignments: [
                {
                    id: "79118d52-1620-4872-ba4c-38884291663d",
                    name: "chosen_hubspot_id",
                    value: "={{ $json.teamlead_owner_id }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "030fc864-2d8d-4e27-a8bb-71737db9d88b",
        name: "JSON-Item \"Owner-ID“ definieren (Ali)",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [2896, -768]
    })
    JsonItemOwnerIdDefinierenAli = {
        assignments: {
            assignments: [
                {
                    id: "79118d52-1620-4872-ba4c-38884291663d",
                    name: "chosen_hubspot_id",
                    value: "=31102099",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "04855048-2374-4501-a15d-530c4acd0553",
        name: "chosenOwner als HV-Objekt abrufen",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [3344, -1152],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    ChosenownerAlsHvObjektAbrufen = {
        method: "POST",
        url: "=https://api.hubapi.com/crm/v3/objects/2-191607507/search",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "filterGroups":[{"filters":[{"propertyName":"hubspot_id","operator":"EQ","value":"{{ $json.chosen_hubspot_id }}"}]}],
  "properties":["handelsvertreter_owner","online_team","aktiv","ms_booking_id","mail","name","employment_type","hubspot_id","acmeco_standort","telli_hv"],
  "limit": 1
}`,
        options: {}
    };

    @node({
        id: "4cd2a530-8329-42e0-8ebe-4f6d079af071",
        name: "Deal und HV-Objekt verknüpfen",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [3568, -1152],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}},
        onError: "continueRegularOutput"
    })
    DealUndHvObjektVerknupfen = {
        method: "PUT",
        url: "=https://api.hubapi.com/crm/v4/objects/deals/{{ $('HS-Read-a-Deal').item.json.id }}/associations/default/2-191607507/{{ $json.results[0].id }}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        options: {}
    };

    @node({
        id: "e39c2923-dee5-4823-a4a7-fdd22fd21eae",
        name: "Merge chosen_hubspot_id",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [3120, -1152]
    })
    MergeChosenHubspotId = {
        assignments: {
            assignments: [
                {
                    id: "79118d52-1620-4872-ba4c-38884291663d",
                    name: "chosen_hubspot_id",
                    value: "={{ $json.chosen_hubspot_id }}",
                    type: "string"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "ee2bbe9b-24b0-4527-a710-cc53e4ad41ed",
        name: "Deal Dorle zuweisen",
        type: "n8n-nodes-base.hubspot",
        version: 2.1,
        position: [2000, -768],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    DealDorleZuweisen = {
        authentication: "appToken",
        resource: "deal",
        operation: "update",
        dealId: {
            __rl: true,
            value: "={{ $('HS-Read-a-Deal').item.json.id }}",
            mode: "id"
        },
        updateFields: {
            dealOwner: {
                __rl: true,
                value: "=1299774695",
                mode: "id"
            }
        }
    };

    @node({
        id: "2c127516-7dac-47c2-992e-237550ce1560",
        name: "Kontakt Dorle zuweisen",
        type: "n8n-nodes-base.hubspot",
        version: 2.2,
        position: [2224, -768],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    KontaktDorleZuweisen = {
        authentication: "appToken",
        email: `={{ $("Get a contact").isExecuted
  ? ($("Get a contact").item.json.properties.email.value || $("Get a contact").item.json.properties.email)
  : ($json.properties.email || $json.email)
}}`,
        additionalFields: {
            contactOwner: "=1299774695"
        },
        options: {
            resolveData: false
        }
    };

    @node({
        id: "2f2f1885-b070-4a9e-9c05-8146f613fa30",
        name: "Ist HV-Objekt bereits verknüpft?",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [432, -1184],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}},
        alwaysOutputData: false,
        executeOnce: false
    })
    IstHvObjektBereitsVerknupft = {
        url: "=https://api.hubapi.com/crm/v4/objects/deals/{{ $('Webhook').item.json.body[0].objectId }}/associations/2-191607507/",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        options: {}
    };

    @node({
        id: "47010862-8def-4e77-b1bb-4eafa4853744",
        name: "HV-ID abrufen",
        type: "n8n-nodes-base.httpRequest",
        version: 4.4,
        position: [2672, -1536],
        credentials: {hubspotDeveloperApi:{id:"ZXvGBss5YvF0N46o",name:"Hubspot Trigger - Lifecycle Stage"},hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    HvIdAbrufen = {
        url: "=https://api.hubapi.com/crm/v3/objects/2-191607507/{{ $('Ist HV-Objekt bereits verknüpft?').item.json.results[0].toObjectId }}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "hubspotAppToken",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: "properties",
                    value: "hubspot_id"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "4c76f1e4-d7a3-4533-8afd-0810aacefa82",
        name: "Update telli Status",
        type: "n8n-nodes-base.hubspot",
        version: 2.1,
        position: [4464, -1504],
        credentials: {hubspotAppToken:{id:"n1IIkIycmbVoNG3T",name:"HubSpot App Token account"}}
    })
    UpdateTelliStatus = {
        authentication: "appToken",
        resource: "deal",
        operation: "update",
        dealId: {
            __rl: true,
            value: "={{ $('HS-Read-a-Deal').item.json.id }}",
            mode: "id"
        },
        updateFields: {
            customPropertiesUi: {
                customPropertiesValues: [
                    {
                        property: "acmeco_standort",
                        value: "={{ $('chosenOwner als HV-Objekt abrufen').item.json.results[0].properties.acmeco_standort }}"
                    },
                    {
                        property: "telli_status",
                        value: "forwarded_to_telli"
                    }
                ]
            }
        }
    };

    @node({
        id: "86e2017b-8b29-4936-be71-1534f458ae03",
        name: "Kauflead",
        type: "n8n-nodes-base.if",
        version: 2.3,
        position: [4016, -1216]
    })
    Kauflead = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 3
            },
            conditions: [
                {
                    id: "bcc9eb24-c280-4a26-9fa2-f29ba42bf37c",
                    leftValue: "={{ ['DAA', 'Aorundhome', 'Wattfox', 'Angebotsguru', 'welovex'].includes($('HS-Read-a-Deal').item.json.properties.deal_quelle) }}",
                    rightValue: "Telefon",
                    operator: {
                        type: "boolean",
                        operation: "true",
                        singleValue: true
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };

    @node({
        id: "d0e117f5-b2d8-4ec5-a7ba-ff5154275657",
        name: "No Operation, do nothing",
        type: "n8n-nodes-base.noOp",
        version: 1,
        position: [4464, -1312]
    })
    NoOperationDoNothing = {};

    @node({
        id: "d8ad0dd3-13bc-45c2-899a-4291eea4c638",
        name: "telli-Routing",
        type: "n8n-nodes-base.switch",
        version: 3.4,
        position: [4240, -1328]
    })
    TelliRouting = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "loose",
                            version: 3
                        },
                        conditions: [
                            {
                                leftValue: "={{ $('HS-Read-a-Deal').item.json.properties.telli_status }}",
                                rightValue: "",
                                operator: {
                                    type: "string",
                                    operation: "empty",
                                    singleValue: true
                                },
                                id: "f292292c-0c09-443f-bb1e-9ca27435c767"
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Übertragung an telli"
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "loose",
                            version: 3
                        },
                        conditions: [
                            {
                                id: "c598028e-730f-41a0-977b-7e5cdbc235bc",
                                leftValue: "={{ ['forwarded_to_telli', 'transferred_to_telli'].includes($('HS-Read-a-Deal').item.json.properties.telli_status) }}",
                                rightValue: "",
                                operator: {
                                    type: "boolean",
                                    operation: "true",
                                    singleValue: true
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "Liegt bei telli"
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: "",
                            typeValidation: "loose",
                            version: 3
                        },
                        conditions: [
                            {
                                id: "b221bbf3-56f2-4e39-9572-318337f4a771",
                                leftValue: "={{ ['qualified_by_telli', 'lost_after_telli_call', 'not_reached'].includes($('HS-Read-a-Deal').item.json.properties.telli_status) }}",
                                rightValue: "",
                                operator: {
                                    type: "string",
                                    operation: "equals",
                                    name: "filter.operator.equals"
                                }
                            }
                        ],
                        combinator: "and"
                    },
                    renameOutput: true,
                    outputKey: "von telli erledigt"
                }
            ]
        },
        looseTypeValidation: true,
        options: {
            fallbackOutput: 2
        }
    };

    @node({
        id: "846137c9-8b3d-402e-9961-9f3fa5ca940c",
        name: "telli Owner?",
        type: "n8n-nodes-base.if",
        version: 2.3,
        position: [3792, -1152]
    })
    TelliOwner = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose",
                version: 3
            },
            conditions: [
                {
                    id: "d0d40c83-edf2-46bd-8202-801cf1309aeb",
                    leftValue: "={{ $('chosenOwner als HV-Objekt abrufen').item.json.results[0].properties.telli_hv }}",
                    rightValue: "true",
                    operator: {
                        type: "boolean",
                        operation: "true",
                        singleValue: true
                    }
                }
            ],
            combinator: "and"
        },
        looseTypeValidation: true,
        options: {}
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.HvAusHubspotAbrufen.out(0).to(this.HvNachPlzGebietMatchen1.in(0));
        this.UpdateADeal.out(0).to(this.CreateOrUpdateAContact.in(0));
        this.Vertriebsgebiet.out(0).to(this.HvAusHubspotAbrufen.in(0));
        this.Vertriebsgebiet.out(1).to(this.DealDorleZuweisen.in(0));
        this.GetAContact.out(0).to(this.ZustandigerMaBekannt.in(0));
        this.PlzgebietExtrahieren3Stellen.out(0).to(this.PlzregionExtrahieren2Stellen.in(0));
        this.PlzregionExtrahieren2Stellen.out(0).to(this.Vertriebsgebiet.in(0));
        this.HvAusHubspotAbrufenFallback.out(0).to(this.RoundRobinOnlineTeam.in(0));
        this.CreateOrUpdateAContact.out(0).to(this.HsCreateAnEngagement.in(0));
        this.Webhook.out(0).to(this.CodeInJavascript.in(0));
        this.CodeInJavascript.out(0).to(this.Crypto.in(0));
        this.RespondToWebhook.out(0).to(this.HsReadADeal.in(0));
        this.Crypto.out(0).to(this.WebhookSuccess.in(0));
        this.Filter1.out(0).to(this.KontaktZugeordnet.in(0));
        this.HsReadADeal.out(0).to(this.Filter1.in(0));
        this.Wait.out(0).to(this.HsReadADeal.in(0));
        this.KontaktZugeordnet.out(0).to(this.ExecutionData.in(0));
        this.KontaktZugeordnet.out(0).to(this.IstHvObjektBereitsVerknupft.in(0));
        this.KontaktZugeordnet.out(1).to(this.Wait.in(0));
        this.WebhookSuccess.out(0).to(this.RespondToWebhook.in(0));
        this.WebhookSuccess.out(1).to(this.RespondToWebhook1.in(0));
        this.ZustandigerMaBekannt.out(0).to(this.HvAusHubspotAbrufenOwnerCheck.in(0));
        this.ZustandigerMaBekannt.out(1).to(this.PlzgebietExtrahieren3Stellen.in(0));
        this.DealOwnerBereitsAusgewahlt.out(0).to(this.HvIdAbrufen.in(0));
        this.DealOwnerBereitsAusgewahlt.out(1).to(this.GetAContact.in(0));
        this.JsonItemOwnerIdDefinieren1.out(0).to(this.MergeChosenHubspotId.in(0));
        this.JsonItemOwnerIdDefinieren.out(0).to(this.MergeChosenHubspotId.in(0));
        this.HvNachPlzGebietMatchen1.out(0).to(this.HvIdentifiziert1.in(0));
        this.HvIdentifiziert1.out(0).to(this.RoundRobinHandelsvertreterWahlen1.in(0));
        this.HvIdentifiziert1.out(1).to(this.If_.in(0));
        this.RoundRobinHandelsvertreterWahlen1.out(0).to(this.HvCounter1Weekly.in(0));
        this.RoundRobinHandelsvertreterWahlen1.out(0).to(this.MergeChosenHubspotId.in(0));
        this.If_.out(0).to(this.JsonItemOwnerIdDefinierenTeamlead.in(0));
        this.If_.out(1).to(this.JsonItemOwnerIdDefinierenAli.in(0));
        this.HvAusHubspotAbrufenOwnerCheck.out(0).to(this.ValidateContactOwnerViaHvAktiv.in(0));
        this.HvAusHubspotAbrufenOwnerCheck.out(1).to(this.PlzgebietExtrahieren3Stellen.in(0));
        this.ValidateContactOwnerViaHvAktiv.out(0).to(this.ContactOwnerAlsHvAktiv.in(0));
        this.ContactOwnerAlsHvAktiv.out(0).to(this.JsonItemOwnerIdDefinieren1.in(0));
        this.ContactOwnerAlsHvAktiv.out(1).to(this.PlzgebietExtrahieren3Stellen.in(0));
        this.JsonItemOwnerIdDefinierenTeamlead.out(0).to(this.MergeChosenHubspotId.in(0));
        this.JsonItemOwnerIdDefinierenAli.out(0).to(this.MergeChosenHubspotId.in(0));
        this.ChosenownerAlsHvObjektAbrufen.out(0).to(this.DealUndHvObjektVerknupfen.in(0));
        this.MergeChosenHubspotId.out(0).to(this.ChosenownerAlsHvObjektAbrufen.in(0));
        this.DealUndHvObjektVerknupfen.out(0).to(this.TelliOwner.in(0));
        this.DealDorleZuweisen.out(0).to(this.KontaktDorleZuweisen.in(0));
        this.IstHvObjektBereitsVerknupft.out(0).to(this.DealOwnerBereitsAusgewahlt.in(0));
        this.HvIdAbrufen.out(0).to(this.JsonItemOwnerIdDefinieren.in(0));
        this.Kauflead.out(0).to(this.TelliRouting.in(0));
        this.Kauflead.out(1).to(this.UpdateADeal.in(0));
        this.TelliRouting.out(0).to(this.UpdateTelliStatus.in(0));
        this.TelliRouting.out(1).to(this.NoOperationDoNothing.in(0));
        this.TelliRouting.out(2).to(this.UpdateADeal.in(0));
        this.TelliOwner.out(0).to(this.Kauflead.in(0));
        this.TelliOwner.out(1).to(this.UpdateADeal.in(0));
    }
}