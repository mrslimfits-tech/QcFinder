/**
 * services/affiliates/kakobuy.js
 *
 * Two exports:
 *
 *   generateKakobuyLink(originalUrl) -> per-product affiliate link
 *     Format: https://www.kakobuy.com/item/details?url=ENCODED_URL&affcode=AFFCODE
 *     Built fresh on every call from the originalUrl passed in — NEVER
 *     persisted to Supabase (services/database.js has no column for it),
 *     so changing the affcode takes effect for every product immediately,
 *     nothing to backfill.
 *
 *   KAKOBUY_REGISTER_URL -> fixed signup link (https://ikako.vip/r/<affcode>),
 *     same for every product/page — not product-specific, so it's just a
 *     constant rather than something computed per request.
 *
 * The affcode is hardcoded as the default ("6qxtv") rather than requiring
 * .env setup, per the requirement that both links must ALWAYS be
 * generated — this isn't a placeholder waiting to be configured, it's
 * the real value. KAKOBUY_AFFCODE in .env.local can still override it
 * without a code change, if you ever need to.
 */

const AFFCODE = process.env.KAKOBUY_AFFCODE || "6qxtv";

export const KAKOBUY_REGISTER_URL = `https://ikako.vip/r/${AFFCODE}`;

/**
 * @param {string|null|undefined} originalUrl
 * @returns {string|null} null only if there's no originalUrl to wrap —
 *   the affcode itself always has a value, so this practically always
 *   returns a real link whenever a product was found.
 */
export function generateKakobuyLink(originalUrl) {
  if (!originalUrl) return null;
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(originalUrl)}&affcode=${AFFCODE}`;
}
