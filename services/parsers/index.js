/**
 * services/parsers/index.js
 *
 * Single entry point the rest of the app should use:
 * `parseAnyProductLink(rawUrl)`.
 *
 * Tries, in order:
 *   1. Is it already a direct 1688/Taobao/Weidian product link?
 *      (services/parsers/sourcePlatforms.js)
 *   2. Otherwise, does it match one of the ~23 known agent link formats?
 *      (services/parsers/agents.js)
 *
 * Returns a normalized result or null — never throws, never partially
 * fills in a result. The caller decides how to report "not recognized".
 *
 * @typedef {Object} ParsedProductLink
 * @property {"1688"|"taobao"|"weidian"} platform
 * @property {string} productId
 * @property {string} originalUrl - resolved/reconstructed source-platform URL
 * @property {string|null} sourceAgent - which agent site the link came
 *   from (e.g. "kakobuy"), or null for a direct source-platform link.
 *   Purely informational (logging/analytics) — QC lookup always queries
 *   every registered agent (services/agents/registry.js) regardless of
 *   this value.
 */

import { parseSourceUrl } from "./sourcePlatforms.js";
import { AGENT_PARSERS } from "./agents.js";

/**
 * @param {string} rawUrl
 * @returns {ParsedProductLink | null}
 */
export function parseAnyProductLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const trimmed = rawUrl.trim();

  const direct = parseSourceUrl(trimmed);
  if (direct) return direct;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  for (const parser of AGENT_PARSERS) {
    if (!parser.match(url)) continue;
    const result = parser.parse(url);
    if (result) return result;
  }

  return null;
}

export { parseSourceUrl } from "./sourcePlatforms.js";
