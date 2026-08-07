/**
 * services/parsers/factories/pathTypeCode.js
 *
 * For agents that encode platform + productId as path segments, e.g.
 * /product/{typeCode}/{id} — Litbuy, Hoobuy, Ponybuy, OOPBuy, USFans,
 * GTBuy, Hipobuy's own product-page format, Basetao. The typeCode isn't
 * standardized across agents (Litbuy/Hoobuy/OOPBuy/GTBuy use "0" for
 * 1688, Ponybuy uses "2", USFans uses "1", Hipobuy/Basetao spell it out
 * as "1688") — each agent gets its own typeCodeMap rather than assuming
 * a shared convention. Only codes seen in a real confirmed example are
 * mapped; an unmapped code returns null rather than guessing.
 */

import { endsWithDomain } from "../domainUtils.js";
import { buildOriginalUrl } from "../platformUtils.js";

/**
 * @param {{id:string, domain:string, pattern:RegExp, typeCodeMap:Record<string,string>}} config
 *   `pattern` must have exactly two capture groups, in order: (typeCode)(productId)
 */
export function createPathTypeCodeParser({ id, domain, pattern, typeCodeMap }) {
  return {
    id,
    match: (url) => endsWithDomain(url.hostname, domain),
    parse: (url) => {
      const match = url.pathname.match(pattern);
      if (!match) return null;

      const [, typeCode, productId] = match;
      const platform = typeCodeMap[typeCode];
      if (!platform || !productId || !/^\d+$/.test(productId)) return null;

      return {
        platform,
        productId,
        originalUrl: buildOriginalUrl(platform, productId),
        sourceAgent: id
      };
    }
  };
}
