/**
 * services/parsers/factories/idPlatformQuery.js
 *
 * For agents that pass productId + platform as plain query params, no
 * embedded original URL at all: Mulebuy (?id=&platform=), Lovegobuy
 * (?id=&shop_type=), OrientDig/Joyagoo (?id=&platform=), CSSBuy
 * (?type=&id=), CNShopper (?keyword=&platform=). Since there's no
 * embedded URL to decode, the original URL is RECONSTRUCTED from the
 * platform+id via buildOriginalUrl() (services/parsers/platformUtils.js).
 */

import { normalizePlatform, buildOriginalUrl } from "../platformUtils.js";
import { endsWithDomain } from "../domainUtils.js";

/**
 * @param {{id:string, domain:string, idParam?:string, platformParam?:string}} config
 */
export function createIdPlatformQueryParser({ id, domain, idParam = "id", platformParam = "platform" }) {
  return {
    id,
    match: (url) => endsWithDomain(url.hostname, domain),
    parse: (url) => {
      const productId = url.searchParams.get(idParam);
      const platform = normalizePlatform(url.searchParams.get(platformParam));
      if (!productId || !/^\d+$/.test(productId) || !platform) return null;

      return {
        platform,
        productId,
        originalUrl: buildOriginalUrl(platform, productId),
        sourceAgent: id
      };
    }
  };
}
