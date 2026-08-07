/**
 * services/parsers/sourcePlatforms.js
 *
 * Parses a link that's ALREADY a direct 1688/Taobao/Weidian product URL
 * (not wrapped by any agent). This is also reused internally by the
 * embedded-URL agent parsers (Kakobuy, Superbuy, ...) once they've
 * decoded the real URL out of their own wrapper — see factories.js.
 */

import { endsWithDomain } from "./domainUtils.js";
import { buildOriginalUrl } from "./platformUtils.js";

const PATTERNS = [
  {
    platform: "1688",
    domain: "1688.com",
    extract: (url) => {
      const m = url.pathname.match(/\/offer\/(\d+)\.html?/i);
      return m ? m[1] : null;
    }
  },
  {
    platform: "taobao",
    domain: "taobao.com",
    extract: (url) => url.searchParams.get("id")
  },
  {
    platform: "weidian",
    domain: "weidian.com",
    extract: (url) => url.searchParams.get("itemID") ?? url.searchParams.get("itemId")
  }
];

/**
 * @param {string} rawUrl
 * @returns {{platform:string, productId:string, originalUrl:string, sourceAgent:null} | null}
 */
export function parseSourceUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();

  for (const pattern of PATTERNS) {
    if (!endsWithDomain(hostname, pattern.domain)) continue;

    const productId = pattern.extract(url);
    if (productId && /^\d+$/.test(productId)) {
      return {
        platform: pattern.platform,
        productId,
        originalUrl: buildOriginalUrl(pattern.platform, productId) ?? rawUrl.trim(),
        sourceAgent: null
      };
    }
  }

  return null;
}

/**
 * Dev-only sanity check, run once at module load, that the canonical
 * 1688 conversion still holds: /offer/ID.html -> productId=ID. If this
 * ever logs a warning, the regex has regressed — check it before
 * looking anywhere else.
 */
if (process.env.NODE_ENV !== "production") {
  const check = parseSourceUrl("https://detail.1688.com/offer/905256798304.html");
  const isCorrect = check?.platform === "1688" && check?.productId === "905256798304";
  if (!isCorrect) {
    console.warn(
      "[qc-finder] ATTENZIONE: parseSourceUrl self-check fallito.",
      "Atteso productId=905256798304, ottenuto:",
      check
    );
  }
}
