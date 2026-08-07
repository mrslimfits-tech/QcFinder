/**
 * services/agents/hipobuy.js
 *
 * QC ONLY. getProductInfo()/mapProduct() (title/price/image extraction)
 * have been REMOVED entirely per explicit decision: this app no longer
 * wants product info at all, from any agent, ever.
 *
 * Endpoint (confirmed):
 *   GET https://hipobuy.com/clientapi/product/detail/V2?spuNo=<productId>
 *
 * Two param shapes are tried in sequence (bare spuNo, then spuNo +
 * shopType/shopUrl) before reporting nothing found.
 */

import { qcFound, qcUnavailable, firstSuccessful } from "./base.js";
import { buildAuthHeaders } from "./session.js";
import { mapPlatformToShopType } from "./shopType.js";
import { logStep } from "../logger.js";

const BASE_URL = "https://hipobuy.com/clientapi/product/detail/V2";

/**
 * @param {URLSearchParams} params
 * @param {string} requestId
 * @param {string} attemptLabel
 */
async function doFetch(params, requestId, attemptLabel) {
  const requestUrl = `${BASE_URL}?${params.toString()}`;

  logStep(requestId, "hipobuy", "request", {
    attempt: attemptLabel,
    url: requestUrl,
    spuNo: params.get("spuNo"),
    shopType: params.get("shopType"),
    shopUrl: params.get("shopUrl")
  });

  let response;
  try {
    response = await fetch(requestUrl, {
      method: "GET",
      headers: { Accept: "application/json", "Cache-Control": "no-cache", ...buildAuthHeaders("hipobuy") },
      cache: "no-store"
    });
  } catch (networkError) {
    logStep(requestId, "hipobuy", "network-error", { attempt: attemptLabel, error: networkError.message });
    return { failed: true, reason: `Chiamata a Hipobuy fallita (rete/CORS): ${networkError.message}` };
  }

  if (!response.ok) {
    logStep(requestId, "hipobuy", "http-error", { attempt: attemptLabel, status: response.status });
    return { failed: true, reason: `Hipobuy ha risposto con status ${response.status}.` };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    logStep(requestId, "hipobuy", "invalid-json", { attempt: attemptLabel });
    return { failed: true, reason: "Risposta di Hipobuy non è JSON valido." };
  }

  const data = payload?.data ?? payload?.result ?? null;
  const notFound = !data || payload?.code === 404 || payload?.success === false;

  logStep(requestId, "hipobuy", "response", { attempt: attemptLabel, notFound, rawKeys: data ? Object.keys(data) : [] });

  return { failed: false, notFound, data };
}

/** @param {import("./base.js").AgentContext} ctx */
function buildAttemptParamSets(ctx) {
  const bare = new URLSearchParams({ spuNo: ctx.productId });

  const enriched = new URLSearchParams({ spuNo: ctx.productId });
  const shopType = mapPlatformToShopType(ctx.platform);
  if (shopType) enriched.set("shopType", shopType);
  if (ctx.originalUrl) enriched.set("shopUrl", ctx.originalUrl);

  return [
    { label: "bare-spuNo", params: bare },
    { label: "spuNo+shopType+shopUrl", params: enriched }
  ];
}

/** @param {import("./base.js").AgentContext} ctx */
async function getQC(ctx) {
  const requestId = ctx.requestId ?? "no-id";

  const attempts = buildAttemptParamSets(ctx).map(({ label, params }) => async () => {
    const result = await doFetch(params, requestId, label);
    if (result.failed) return qcUnavailable(result.reason);
    if (result.notFound) return qcUnavailable("Prodotto non trovato su Hipobuy.");
    return qcFound(mapQc(result.data));
  });

  const outcome = await firstSuccessful(attempts, qcUnavailable);
  logStep(requestId, "hipobuy", "qc-final", { ok: outcome.ok, imageCount: outcome.images?.length ?? 0 });
  return outcome;
}

/** @param {any} data */
function mapQc(data) {
  return toArray(data.checkPhotos ?? data.qcImages ?? data.qcPhotos ?? data.inspectionImages);
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

export default {
  id: "hipobuy",
  label: "Hipobuy",
  implemented: true,
  getQC
};
