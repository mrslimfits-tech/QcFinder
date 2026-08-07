/**
 * services/parsers/platformUtils.js
 *
 * Two small, shared jobs every parser needs:
 *   1. normalizePlatform() — agents spell the source platform differently
 *      (ALI_1688, ali_1688, "1688", "ALI1688", ...) — normalize all of
 *      them to the three canonical values the rest of the app uses.
 *   2. buildOriginalUrl() — some agent links only carry a bare productId
 *      + platform (no embedded original URL at all, e.g. Lovegobuy,
 *      Mulebuy, Hipobuy's own path format). For those, reconstruct the
 *      canonical source-platform URL from the template — this is what
 *      lets QC connectors and the Kakobuy link generator get a real
 *      originalUrl even when the user pasted an agent link that never
 *      contained one.
 */

const PLATFORM_ALIASES = {
  "1688": "1688",
  ali_1688: "1688",
  ali1688: "1688",
  taobao: "taobao",
  weidian: "weidian"
};

/**
 * @param {string|null|undefined} token
 * @returns {"1688"|"taobao"|"weidian"|null}
 */
export function normalizePlatform(token) {
  if (!token) return null;
  const key = String(token).trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? null;
}

const ORIGINAL_URL_TEMPLATES = {
  "1688": (id) => `https://detail.1688.com/offer/${id}.html`,
  taobao: (id) => `https://item.taobao.com/item.htm?id=${id}`,
  weidian: (id) => `https://weidian.com/item.html?itemID=${id}`
};

/**
 * @param {"1688"|"taobao"|"weidian"} platform
 * @param {string} productId
 * @returns {string|null}
 */
export function buildOriginalUrl(platform, productId) {
  const template = ORIGINAL_URL_TEMPLATES[platform];
  return template ? template(productId) : null;
}
