/**
 * services/agents/shopType.js
 *
 * Agents encode which source platform a product came from as a
 * "shopType"/"platform" code in their requests. Confirmed for Mulebuy:
 * "ALI_1688" for 1688, and "WEIDIAN" for Weidian (seen literally in a
 * real captured product-info request: ?platform=WEIDIAN&productID=...).
 * "TAOBAO" for Taobao is still an unconfirmed guess following the same
 * naming convention — verify against a real captured request before
 * relying on it.
 */
const DEFAULT_SHOP_TYPE_MAP = {
  "1688": "ALI_1688",
  taobao: "TAOBAO", // unconfirmed
  weidian: "WEIDIAN" // CONFIRMED — seen in a real captured Mulebuy product-info request
};

/**
 * @param {string} platform - "1688" | "taobao" | "weidian" | "agent:<name>"
 * @param {Record<string,string>} [overrides] - per-agent overrides, if a given agent uses different codes
 */
export function mapPlatformToShopType(platform, overrides = {}) {
  return overrides[platform] ?? DEFAULT_SHOP_TYPE_MAP[platform] ?? null;
}
