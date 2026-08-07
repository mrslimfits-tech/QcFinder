/**
 * services/agents/base.js
 *
 * Contract shared by every agent connector (Hipobuy, Mulebuy). PRODUCT
 * INFO (title/price/image) IS NOT PART OF THIS SYSTEM ANYMORE — removed
 * entirely per explicit decision: QC photos are the only thing this app
 * cares about now, and must never depend on or be blocked by product
 * info succeeding or failing.
 *
 * @typedef {Object} AgentContext
 * @property {string} productId    - source-platform productId (1688/Taobao/Weidian offer id)
 * @property {string} platform     - "1688" | "taobao" | "weidian" — resolved by
 *                                    services/parsers/, regardless of which site the
 *                                    user actually pasted a link from
 * @property {string} originalUrl  - the resolved source-platform product URL (NOT
 *                                    necessarily the literal string the user pasted —
 *                                    if they pasted e.g. a Kakobuy or Hipobuy link,
 *                                    this is the underlying 1688/Taobao/Weidian URL
 *                                    that services/parsers/ extracted or reconstructed
 *                                    from it)
 *
 *   Promise.all([
 *     HipobuyService.getQC(ctx),
 *     MulebuyService.getQC(ctx)
 *   ])
 *
 * QC RESULT (getQC return shape):
 *   { ok: true, images: string[] }   // [] is a legitimate "no photos", not an error
 *   or { ok: false, reason, images: [] }
 *
 * "Not found" only happens after every configured attempt has been tried
 * (see firstSuccessful below) — never after a single request shape fails.
 */

/** @param {string[]} images */
export function qcFound(images) {
  return { ok: true, images };
}

/** @param {string} reason */
export function qcUnavailable(reason) {
  return { ok: false, reason, images: [] };
}

/**
 * Runs a list of attempts IN SEQUENCE and returns the first one that
 * succeeds (ok:true with non-empty images). Only once every attempt has
 * been exhausted does this fall back to the last failure — this is what
 * guarantees a connector never reports "not found" after trying just
 * one request shape.
 *
 * Each attempt is a zero-arg async function returning a result in the
 * shapes above (or throwing, which is treated as a failed attempt).
 *
 * @param {Array<() => Promise<{ok:boolean, images?: string[], [key: string]: any}>>} attempts
 * @param {(reason: string) => {ok:false, [key:string]: any}} makeFailure
 */
export async function firstSuccessful(attempts, makeFailure) {
  let lastReason = "Nessun metodo disponibile per questo agent.";

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      const hasUsableData = result?.ok && (!("images" in result) || result.images.length > 0);
      if (hasUsableData) return result;
      if (result && !result.ok && result.reason) lastReason = result.reason;
    } catch (err) {
      lastReason = err?.message ?? lastReason;
    }
  }

  return makeFailure(lastReason);
}

/**
 * Every connector module must export an object matching this shape:
 * @typedef {Object} AgentConnector
 * @property {string} id
 * @property {string} label
 * @property {boolean} implemented
 * @property {(ctx: AgentContext) => Promise<ReturnType<typeof qcFound> | ReturnType<typeof qcUnavailable>>} getQC
 */
