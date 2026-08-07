/**
 * services/parsers/agents.js
 *
 * One entry per agent link format, each built from a shared factory
 * (services/parsers/factories/) instead of a hand-written file per
 * agent. With ~23 formats that mostly reduce to 3 recurring shapes
 * (embedded original URL / id+platform query params / path type-code),
 * duplicating near-identical boilerplate 23 times would itself be the
 * "temporary workaround" — this keeps each agent's definition to a few
 * lines while the actual parsing logic lives in exactly one place per
 * shape. Adding agent #24 is a new entry in the array below, not a new
 * file and not a change to services/parsers/index.js.
 *
 * Every domain/param/typeCode here is taken directly from the confirmed
 * example link for that agent. Where an agent's typeCode scheme could
 * plausibly cover Taobao/Weidian too, only the confirmed 1688 code is
 * mapped — add the others once you have a real example link for them
 * rather than guessing.
 */

import { createEmbeddedUrlParser, createHashEmbeddedUrlParser } from "./factories/embeddedUrl.js";
import { createIdPlatformQueryParser } from "./factories/idPlatformQuery.js";
import { createPathTypeCodeParser } from "./factories/pathTypeCode.js";

export const AGENT_PARSERS = [
  // --- embedded original URL (?url=... or ?productLink=...) ----------
  createEmbeddedUrlParser({ id: "kakobuy", domain: "kakobuy.com", param: "url" }),
  createEmbeddedUrlParser({ id: "superbuy", domain: "superbuy.com", param: "url" }),
  createEmbeddedUrlParser({ id: "eastmallbuy", domain: "eastmallbuy.com", param: "url" }),
  createEmbeddedUrlParser({ id: "hubbuycn", domain: "hubbuycn.com", param: "url" }),
  createEmbeddedUrlParser({ id: "loongbuy", domain: "loongbuy.com", param: "url" }),
  createEmbeddedUrlParser({ id: "itaobuy", domain: "itaobuy.com", param: "url" }),
  createEmbeddedUrlParser({ id: "lolobuy", domain: "lolobuy.com", param: "url" }),

  // --- hash-route + double-encoded embedded URL -----------------------
  createHashEmbeddedUrlParser({ id: "sugargoo", domain: "sugargoo.com", param: "productLink", doubleEncoded: true }),
  createHashEmbeddedUrlParser({ id: "fishgoo", domain: "fishgoo.com", param: "productLink", doubleEncoded: true }),

  // --- ?id=&platform= (or equivalent param names) ---------------------
  createIdPlatformQueryParser({ id: "lovegobuy", domain: "lovegobuy.com", idParam: "id", platformParam: "shop_type" }),
  createIdPlatformQueryParser({ id: "mulebuy", domain: "mulebuy.com", idParam: "id", platformParam: "platform" }),
  createIdPlatformQueryParser({ id: "orientdig", domain: "orientdig.com", idParam: "id", platformParam: "platform" }),
  createIdPlatformQueryParser({ id: "joyagoo", domain: "joyagoo.com", idParam: "id", platformParam: "platform" }),
  createIdPlatformQueryParser({ id: "cssbuy", domain: "cssbuy.com", idParam: "id", platformParam: "type" }),
  createIdPlatformQueryParser({ id: "cnshopper", domain: "cnshopper.com", idParam: "keyword", platformParam: "platform" }),

  // --- /product/{typeCode}/{id} style paths ---------------------------
  createPathTypeCodeParser({
    id: "hipobuy-link",
    domain: "hipobuy.com",
    pattern: /\/product\/([a-zA-Z]+)\/(\d+)/,
    typeCodeMap: { "1688": "1688", taobao: "taobao", weidian: "weidian" }
  }),
  createPathTypeCodeParser({
    id: "litbuy",
    domain: "litbuy.com",
    pattern: /\/product\/(\d+)\/(\d+)/,
    typeCodeMap: { "0": "1688" }
  }),
  createPathTypeCodeParser({
    id: "hoobuy",
    domain: "hoobuy.com",
    pattern: /\/product\/(\d+)\/(\d+)/,
    typeCodeMap: { "0": "1688" }
  }),
  createPathTypeCodeParser({
    id: "oopbuy",
    domain: "oopbuy.com",
    pattern: /\/product\/(\d+)\/(\d+)/,
    typeCodeMap: { "0": "1688" }
  }),
  createPathTypeCodeParser({
    id: "gtbuy",
    domain: "gtbuy.com",
    pattern: /\/product\/(\d+)\/(\d+)/,
    typeCodeMap: { "0": "1688" }
  }),
  createPathTypeCodeParser({
    id: "ponybuy",
    domain: "ponybuy.com",
    pattern: /\/products\/(\d+)\/(\d+)/,
    typeCodeMap: { "2": "1688" }
  }),
  createPathTypeCodeParser({
    id: "usfans",
    domain: "usfans.com",
    pattern: /\/product\/(\d+)\/(\d+)/,
    typeCodeMap: { "1": "1688" }
  }),
  createPathTypeCodeParser({
    id: "basetao",
    domain: "basetao.com",
    // Confirmed example nests it under /best-taobao-agent-service/products/agent/...
    // — that prefix isn't anchored here in case it varies; only the
    // /agent/{platform}/{id}.html tail is required to match.
    pattern: /\/agent\/([a-zA-Z]+)\/(\d+)\.html/,
    typeCodeMap: { "1688": "1688", taobao: "taobao", weidian: "weidian" }
  })
];
