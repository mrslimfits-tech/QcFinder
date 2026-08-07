/**
 * services/agents/mulebuy.js
 *
 * QC ONLY. The product-info endpoint (GET /search-api/detail/product-info)
 * and everything around it (mapProduct, title/price/image extraction,
 * MULEBUY_PRODUCT_INFO_BASE/MULEBUY_PRODUCT_PATH) has been REMOVED
 * entirely per explicit decision: this app no longer wants product info
 * at all, from any agent, ever. Do not re-add it here — if it comes
 * back, it belongs in a clearly separate, optional feature that can
 * never block or gate a QC result.
 *
 * QC request (confirmed, unchanged):
 *   POST <MULEBUY_API_BASE><MULEBUY_QC_PATH>
 *   Content-Type: application/json
 *   { skuPid: PRODUCT_ID, skuId: "", shopType: "ALI_1688", shopUrl: ORIGINAL_SHOP_URL, site: "mulebuy", lang: "en" }
 *
 * Confirmed real values:
 *   MULEBUY_API_BASE = https://mulebuy.com
 *   MULEBUY_QC_PATH   = /buffet/open/ad-order-item/get-quality-picture
 *
 * QC response field (confirmed): data.waterMarkImageUrls (array of URLs).
 *
 * MULTIPLE ATTEMPTS BEFORE GIVING UP: getQC tries a couple of plausible
 * variants of `skuId` (empty string, and equal to skuPid) before
 * reporting no QC found — some agents require skuId to mirror skuPid for
 * products with a single default variant.
 */

import { qcFound, qcUnavailable, firstSuccessful } from "./base.js";
import { buildAuthHeaders } from "./session.js";
import { mapPlatformToShopType } from "./shopType.js";
import { logStep } from "../logger.js";

const BASE_URL = process.env.MULEBUY_API_BASE || "https://mulebuy.com";
const QC_PATH = process.env.MULEBUY_QC_PATH || "/buffet/open/ad-order-item/get-quality-picture";

const QC_ATTEMPT_VARIANTS = [
  { label: "skuId:empty", skuId: "" },
  { label: "skuId:equals-skuPid", skuId: null } // filled in with skuPid at call time
];

/** @param {import("./base.js").AgentContext} ctx */
function buildQcBody(ctx) {
  return {
    skuPid: ctx.productId,
    shopType: mapPlatformToShopType(ctx.platform) ?? "ALI_1688",
    shopUrl: ctx.originalUrl,
    site: "mulebuy",
    lang: "en"
  };
}

/**
 * @param {object} body
 * @param {string} requestId
 * @param {string} attemptLabel
 */
async function postJson(body, requestId, attemptLabel) {
  logStep(requestId, "mulebuy", "request", {
    attempt: attemptLabel,
    skuPid: body.skuPid,
    shopType: body.shopType,
    shopUrl: body.shopUrl
  });

  const fullUrl = `${BASE_URL}${QC_PATH}`;

  let response;
  try {
    response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
        ...buildAuthHeaders("mulebuy")
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });
  } catch (networkError) {
    logStep(requestId, "mulebuy", "network-error", { attempt: attemptLabel, error: networkError.message });
    return { failed: true, reason: `Chiamata a Mulebuy fallita (rete/CORS): ${networkError.message}` };
  }

  if (!response.ok) {
    logStep(requestId, "mulebuy", "http-error", { attempt: attemptLabel, status: response.status });
    return { failed: true, reason: `Mulebuy ha risposto con status ${response.status}.` };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    logStep(requestId, "mulebuy", "invalid-json", { attempt: attemptLabel });
    return { failed: true, reason: "Risposta di Mulebuy non è JSON valido." };
  }

  const data = payload?.data ?? payload?.result ?? null;
  const notFound = !data || payload?.code === 404 || payload?.success === false;

  logStep(requestId, "mulebuy", "response", {
    attempt: attemptLabel,
    notFound,
    rawKeys: data ? Object.keys(data) : []
  });

  return { failed: false, notFound, data };
}

/** @param {import("./base.js").AgentContext} ctx */
async function getQC(ctx) {
  const requestId = ctx.requestId ?? "no-id";

  const attempts = QC_ATTEMPT_VARIANTS.map((variant) => async () => {
    const skuId = variant.skuId === null ? ctx.productId : variant.skuId;
    const result = await postJson({ ...buildQcBody(ctx), skuId }, requestId, variant.label);

    if (result.failed) return qcUnavailable(result.reason);
    if (result.notFound) return qcUnavailable("Prodotto non trovato su Mulebuy.");

    const images = mapQc(result.data);
    logStep(requestId, "mulebuy", "qc-mapped", { attempt: variant.label, imageCount: images.length });
    return qcFound(images);
  });

  const outcome = await firstSuccessful(attempts, qcUnavailable);
  logStep(requestId, "mulebuy", "qc-final", {
    ok: outcome.ok,
    imageCount: outcome.images?.length ?? 0,
    reason: outcome.reason
  });
  return outcome;
}

/**
 * @param {any} data
 * CONFIRMED: QC photos come back under `waterMarkImageUrls` (array of
 * image URL strings). Fallback field names kept in case a different
 * response shape shows up for another product, but waterMarkImageUrls is
 * checked first since it's the one actually verified.
 */
function mapQc(data) {
  const images =
    data.waterMarkImageUrls ??
    data.checkPhotos ??
    data.qcImages ??
    data.qcPhotos ??
    data.pictureList ??
    [];

  return images
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.url ?? item.imageUrl ?? item.picUrl ?? item.src ?? "";
      }
      return "";
    })
    .filter(Boolean);
}

export default {
  id: "mulebuy",
  label: "Mulebuy",
  implemented: Boolean(BASE_URL),
  getQC
};
