# QC Finder — MVP (QC-only)

Incolla un link prodotto (1688, Taobao, Weidian, o un link da un agent
supportato) → il sistema estrae piattaforma + productId → interroga
**Mulebuy e Hipobuy** per le foto di Quality Check → mostra una galleria
QC pulita con link Kakobuy.

**Il sistema non recupera più informazioni prodotto** (titolo, prezzo,
valuta, immagine originale). Non è una scelta temporanea: è stata
rimossa esplicitamente da ogni parte del codice — connector, database,
API, frontend — proprio perché era la causa di errori ricorrenti (colonne
DB inesistenti, endpoint mai confermati che restituivano dati vuoti). Le
uniche cose che contano ora sono: link → piattaforma/agent → foto QC →
link Kakobuy.

## Avvio

```bash
npm install
cp .env.example .env.local   # opzionale, vedi sotto
npm run dev
```

Apri http://localhost:3000

## Flusso reale (`POST /api/search`)

```
url
  |
  v
parseAnyProductLink(url)          services/parsers/
  |  riconosce piattaforma (1688/taobao/weidian) + productId
  |  da un link diretto o da uno dei ~23 formati agent conosciuti
  |
  |  se non riconosciuto -> { ok:false, error:"Unsupported agent" }
  v
Promise.allSettled su ogni agent registrato   services/agents/registry.js
  |  (oggi: Mulebuy, Hipobuy) - chiamano SOLO getQC(ctx), mai product info
  v
merge QC (deduplicate per URL) + salvataggio additivo su Supabase
  |  services/database.js#upsertQualityChecks
  v
{ ok:true, platform, productId, agents, qcCount, qcImages, kakobuyLink, kakobuyRegisterUrl }
```

Un risultato con `qcCount: 0` è comunque `ok: true` — una galleria vuota
non è un errore, è semplicemente "nessuna QC trovata per ora". Non esiste
nessun percorso nel codice in cui un fallimento su titolo/prezzo/immagine
possa bloccare o marcare come errore un risultato QC, perché quei dati
non vengono più cercati da nessuna parte.

## Decisione di design da conoscere: quali agent vengono interrogati

Ogni link riconosciuto (diretto 1688/Taobao/Weidian, o uno dei ~23
formati agent) fa interrogare **sempre entrambi** Mulebuy e Hipobuy per
le QC — non solo l'agent del sito da cui il link è stato copiato.
`"Unsupported agent"` scatta solo se il link non è riconoscibile affatto
da `parseAnyProductLink`, non quando è riconosciuto ma proviene da un
sito diverso da Mulebuy/Hipobuy (es. un link 1688 diretto, o un link
Kakobuy/Superbuy).

Questo preserva il caso d'uso originale del progetto — incollare un link
1688 diretto e ottenere QC da più agent — che si sarebbe rotto con
un'interpretazione più stretta ("solo se il link è letteralmente un link
Mulebuy o Hipobuy"). Se vuoi invece il routing stretto per-agent, è un
cambiamento mirato in `app/api/search/route.js` (sezione 2 del flusso).

## Struttura

```
/app
  /page.jsx                     homepage: search bar + risultato QC
  /api/search/route.js           parse -> QC (Mulebuy+Hipobuy) -> salva -> ritorna
  /api/cache/route.js             DELETE/GET ?productId= - invalidazione singolo prodotto (test)
/components
  SearchBar.jsx
  QcInfoBar.jsx                   "Agent: X - piattaforma - #id - N QC Photos" - sostituisce ResultSummary
  QCGallery.jsx                    carousel + lightbox, galleria unica
  AgentButtons.jsx                  "Open Product" (Kakobuy) + "Kakobuy" (registrazione)
  StatusBanner.jsx                  solo errori di input (link non riconosciuto)
  Header.jsx                        nav globale: logo, ThemeToggle, pulsante Spreadsheet
  ThemeToggle.jsx                    toggle chiaro/scuro, persistito in localStorage
/lib
  supabase.js                      client service-role (server-only)
/services
  /parsers                          riconoscimento link - invariato, non e' "product info"
    sourcePlatforms.js                link diretto 1688/Taobao/Weidian
    platformUtils.js
    domainUtils.js
    /factories                        embeddedUrl / idPlatformQuery / pathTypeCode
    agents.js                          ~23 agent, link recognition (include fishgoo.com - solo
                                        pattern URL, non collegato a nessun connector QC)
    index.js                           parseAnyProductLink(url)
  /agents
    base.js         contratto QC-only: {id, label, implemented, getQC}
    session.js       cookie/token da env, solo server-side
    shopType.js       mappa platform -> shopType per agent
    registry.js       Mulebuy, Hipobuy
    mulebuy.js         solo getQC - product-info rimosso interamente
    hipobuy.js          solo getQC - product-info rimosso interamente
  /affiliates
    kakobuy.js       generateKakobuyLink(originalUrl) + KAKOBUY_REGISTER_URL
  database.js         getProductById / createProduct / upsertQualityChecks /
                       getQualityChecksByProduct / deleteProduct - schema minimale
  logger.js           logStep/newRequestId - structured per-search logging
/supabase
  schema.sql          products(product_id,platform,original_url,...) + quality_checks(product_id,image_url)
.env.example          variabili da copiare in .env.local
```

## Database

### `products`

```
id, product_id, platform, original_url, title, price, currency, image_url, created_at
```

`title`/`price`/`currency`/`image_url` **esistono ancora nella tabella**
(non droppati — modificare uno schema live rimuovendo colonne con
potenzialmente dati dentro è un'operazione distruttiva senza reale
beneficio) ma **nessuna query nel codice li legge o li scrive più**.
`createProduct()` in `services/database.js` accetta solo
`{productId, platform, originalUrl}`.

### `quality_checks`

```
id, product_id, image_url, created_at, unique(product_id, image_url)
```

**Non più `agent`, non più `last_seen_at`** — erano la causa diretta di
due errori ricorrenti (`column quality_checks.agent does not exist`,
`Could not find the 'last_seen_at' column`) perché il codice li
richiedeva ma il database live non li aveva mai avuti applicati per
davvero. La correzione questa volta è stata rimuovere la dipendenza dal
codice invece di continuare a chiedere una migrazione — se il tuo
database live ha ancora quelle colonne da tentativi precedenti, restano
lì innocue, semplicemente non vengono più lette né scritte.

`UNIQUE(product_id, image_url)` è quello che rende l'archivio QC
**puramente additivo**: la stessa foto non viene mai duplicata; una foto
già vista viene semplicemente ignorata al secondo inserimento (mai
sostituita, mai cancellata se un agent smette di restituirla).

### Setup

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Apri l'SQL editor e incolla il contenuto di `supabase/schema.sql`.
3. Copia `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` da Project Settings → API in `.env.local`.
4. Senza queste variabili l'app funziona lo stesso: `services/database.js`
   lancia un errore leggibile che viene catturato e degradato a "nessuna
   cache", va comunque live sugli agent.

## Connector QC

| Connector | Stato | Endpoint |
|---|---|---|
| **Mulebuy** | Confermato | `POST https://mulebuy.com/buffet/open/ad-order-item/get-quality-picture` — campo QC confermato: `waterMarkImageUrls` |
| **Hipobuy** | Confermato | `GET https://hipobuy.com/clientapi/product/detail/V2?spuNo=...` |

Entrambi espongono solo `getQC(ctx)` — `services/agents/base.js` non
definisce più `getProductInfo` nel contratto. Se un giorno serve
reintrodurre informazioni prodotto, deve essere una feature
esplicitamente separata che non può mai bloccare o far fallire un
risultato QC.

## Kakobuy

`services/affiliates/kakobuy.js` — invariato, era già indipendente dal
product info: `generateKakobuyLink(originalUrl)` usa solo il link
sorgente risolto dal parser, mai dati prodotto. Affcode `6qxtv`
hardcoded come default (funziona senza configurazione).

`original_url` non lascia mai il server — `route.js` lo legge solo per
generare `kakobuyLink`, non è mai incluso nella risposta JSON. Difesa
aggiuntiva a livello DB in `schema.sql`:
```sql
revoke select (original_url) on products from anon, authenticated;
```

## Rimosso in questa modifica

- **Recently Searched** — pagina `/history`, API `/api/history`,
  `getRecentProducts()`, link in `Header.jsx`. Nessun residuo nel flusso
  attivo (verificato via grep, non dichiarato senza controllo).
- **Pagina dettaglio prodotto** (`/product/[productId]`) — era
  raggiungibile solo da Recently Searched, rimossa insieme perché
  altrimenti orfana.
- **Product info scraper** — `getProductInfo()` rimosso da Mulebuy e
  Hipobuy; `services/platforms/` (adapter Weidian + registry) eliminato
  interamente; `services/products/publicView.js` e `displayTitle.js`
  eliminati; `services/fx/getCnyToUsdRate.js` eliminato (nessun prezzo
  da convertire).
- **`ResultSummary.jsx`** (card titolo/prezzo/immagine) — sostituito da
  `QcInfoBar.jsx` (solo agent + piattaforma + conteggio QC).

## Cosa NON fa (di proposito)

- Nessuna raccolta di titolo/prezzo/valuta/immagine prodotto, da nessun
  agent, per nessun motivo — rimosso a livello di contratto (`base.js`),
  non solo di UI.
- Nessuna pagina "Recently Searched" o cronologia in alcuna forma.
- Nessun blocco del risultato QC per dati prodotto mancanti — non può
  succedere per costruzione, non esiste più quel percorso di codice.
- Nessun `originalUrl` nella risposta API o nella UI, mai — solo
  `kakobuyLink`/`kakobuyRegisterUrl` generati lato server.
- Nessuna colonna DB richiesta oltre a quelle minime effettivamente
  usate (`products.product_id/platform/original_url`,
  `quality_checks.product_id/image_url`).
- Nessun dato mockato: un agent non configurato o senza risultati
  contribuisce zero foto, mai contenuti inventati.
