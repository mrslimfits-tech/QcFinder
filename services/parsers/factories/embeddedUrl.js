/**
 * services/parsers/factories/embeddedUrl.js
 *
 * For agents whose product link just carries the real source URL in a
 * query param: Kakobuy, Superbuy, EastMallBuy, HubBuyCN, LoongBuy,
 * iTaobuy, LoloBuy. Decode it, then delegate to parseSourceUrl() — the
 * agent parser does nothing platform-specific itself.
 */

import { parseSourceUrl } from "../sourcePlatforms.js";
import { endsWithDomain } from "../domainUtils.js";

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {{id:string, domain:string, param:string}} config
 */
export function createEmbeddedUrlParser({ id, domain, param }) {
  return {
    id,
    match: (url) => endsWithDomain(url.hostname, domain),
    parse: (url) => {
      const raw = url.searchParams.get(param); // URLSearchParams already decoded this once
      if (!raw) return null;

      const source = parseSourceUrl(raw);
      return source ? { ...source, sourceAgent: id } : null;
    }
  };
}

/**
 * Variant for agents using hash-based routing (`#/route?param=...`),
 * where the "query string" the app cares about lives inside `url.hash`
 * rather than `url.search` — plain URLSearchParams never sees it.
 * Sugargoo and Fishgoo additionally double-percent-encode the value
 * (decode twice) — pass `doubleEncoded: true` for those.
 *
 * @param {{id:string, domain:string, param:string, doubleEncoded?:boolean}} config
 */
export function createHashEmbeddedUrlParser({ id, domain, param, doubleEncoded = false }) {
  return {
    id,
    match: (url) => endsWithDomain(url.hostname, domain),
    parse: (url) => {
      const queryIndex = url.hash.indexOf("?");
      if (queryIndex === -1) return null;

      const hashParams = new URLSearchParams(url.hash.slice(queryIndex + 1));
      let raw = hashParams.get(param); // URLSearchParams already decoded this once
      if (!raw) return null;

      if (doubleEncoded) raw = safeDecode(raw); // one more decode for %2525-style double-encoding
      const source = parseSourceUrl(raw);
      return source ? { ...source, sourceAgent: id } : null;
    }
  };
}
