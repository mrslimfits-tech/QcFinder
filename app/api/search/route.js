import { NextResponse } from "next/server";
import { parseAnyProductLink } from "../../../services/parsers/index.js";
import { AGENT_LIST } from "../../../services/agents/registry.js";
import { getProductById, createProduct, upsertQualityChecks, getQualityChecksByProduct } from "../../../services/database.js";
import { logStep, newRequestId } from "../../../services/logger.js";
import { generateKakobuyLink, KAKOBUY_REGISTER_URL } from "../../../services/affiliates/kakobuy.js";

/**
 * POST /api/search
 * body: { url: string }
 *
 * SIMPLIFIED FLOW — product info removed entirely, QC is the only thing
 * that matters:
 *
 *   parse URL
 *     → identify platform/productId (services/parsers/) — "Unsupported
 *       agent" if the link isn't recognized at all
 *     → query QC from every registered agent (services/agents/registry.js
 *       — currently Mulebuy + Hipobuy), always, in parallel
 *     → save new QC images (additive — never deletes/replaces existing
 *       ones, see services/database.js#upsertQualityChecks)
 *     → return { qcImages, qcCount, agents, kakobuyLink }
 *
 * No product-info fetch, no title/price/image gathering, no platform
 * adapter. A result with qcCount: 0 is still `ok: true` — an empty QC
 * gallery is not an error, it's just nothing found yet.
 *
 * DESIGN DECISION (flagged explicitly, not hidden): "Unsupported agent"
 * fires only when the pasted link can't be resolved to a source platform
 * at all (parseAnyProductLink returns null) — NOT when it resolves but
 * to a link whose sourceAgent isn't literally Mulebuy or Hipobuy (e.g. a
 * direct 1688 link, or a Kakobuy/Superbuy link). Once a platform+productId
 * is resolved, QC is queried from every registered agent regardless of
 * which site's link format was pasted — this preserves the core "paste a
 * 1688 link, get QC from Mulebuy/Hipobuy" use case, which would otherwise
 * break under a stricter literal-agent-link-only interpretation. See
 * README for the reasoning; say so explicitly if you want the narrower
 * behavior instead.
 *
 * `agents` in the response is NOT persisted — quality_checks no longer
 * has an `agent` column (removed, see services/database.js and
 * supabase/schema.sql), so it only ever reflects which agent(s)
 * succeeded in THIS run, not historically. Since every search always
 * queries agents live (no cache-skip), this is accurate for the common
 * case but won't retroactively attribute older accumulated QC.
 */
export async function POST(request) {
  const requestId = newRequestId();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { url } = body ?? {};
  logStep(requestId, "route", "incoming", { url });

  // --- 1. Parse the link --------------------------------------------------
  const parsed = parseAnyProductLink(url);
  if (!parsed) {
    logStep(requestId, "route", "unsupported-agent", { url });
    return NextResponse.json({ ok: false, error: "Unsupported agent" }, { status: 400 });
  }

  const { platform, productId, originalUrl } = parsed;
  const ctx = { productId, platform, originalUrl, requestId };
  logStep(requestId, "route", "parsed", { platform, productId });

  // --- 2. Find QC — every registered agent, always, in parallel ----------
  logStep(requestId, "route", "querying-agents", { productId, agents: AGENT_LIST.map((a) => a.id) });

  const settled = await Promise.allSettled(
    AGENT_LIST.map(async (agent) => ({ agent, result: await safeCall(() => agent.getQC(ctx)) }))
  );

  const contributingAgents = [];
  const seenUrls = new Set();
  const thisRunQc = [];

  for (const outcome of settled) {
    if (outcome.status !== "fulfilled") continue;
    const { agent, result } = outcome.value;
    if (result?.ok && result.images.length > 0) {
      contributingAgents.push(agent.id);
      for (const imgUrl of result.images) {
        if (!seenUrls.has(imgUrl)) {
          seenUrls.add(imgUrl);
          thisRunQc.push(imgUrl);
        }
      }
    }
  }

  logStep(requestId, "route", "qc-results", {
    productId,
    contributingAgents,
    thisRunCount: thisRunQc.length
  });

  // --- 3. Save/return — QC presence is success; product info never enters
  //        this flow at all, so it can never block or error a result.
  const existingQc = await tryReadExistingQc(productId, requestId);
  const written = await tryWriteCache(ctx, thisRunQc, requestId);

  let finalQcImages;
  if (written) {
    finalQcImages = await getQualityChecksByProduct(productId, written).catch(() =>
      Array.from(new Set([...existingQc, ...thisRunQc]))
    );
  } else {
    finalQcImages = Array.from(new Set([...existingQc, ...thisRunQc]));
  }

  const result = {
    ok: true,
    platform,
    productId,
    agents: contributingAgents,
    qcCount: finalQcImages.length,
    qcImages: finalQcImages,
    kakobuyLink: generateKakobuyLink(originalUrl),
    kakobuyRegisterUrl: KAKOBUY_REGISTER_URL
  };

  logStep(requestId, "route", "result", {
    productId,
    qcCount: result.qcCount,
    agents: contributingAgents
  });

  return NextResponse.json(result);
}

/**
 * @param {string} productId @param {string} requestId
 * @returns {Promise<string[]>}
 */
async function tryReadExistingQc(productId, requestId) {
  try {
    return await getQualityChecksByProduct(productId);
  } catch (err) {
    logStep(requestId, "route", "cache-read-error", { productId, error: err?.message });
    return [];
  }
}

/**
 * Always creates/confirms the minimal product row (productId/platform/
 * originalUrl only — no product info fields exist to pass here anymore),
 * then additively upserts whatever QC this run found, if any.
 * @param {{productId:string, platform:string, originalUrl:string}} ctx
 * @param {string[]} thisRunQc
 * @param {string} requestId
 * @returns {Promise<object|null>} the product row, or null if the write failed/Supabase unavailable
 */
async function tryWriteCache(ctx, thisRunQc, requestId) {
  try {
    const existing = await getProductById(ctx.productId).catch(() => null);
    const product = await createProduct(
      { productId: ctx.productId, platform: ctx.platform, originalUrl: ctx.originalUrl },
      existing
    );

    let inserted = [];
    if (thisRunQc.length) {
      inserted = await upsertQualityChecks(product.id, thisRunQc);
    }

    logStep(requestId, "route", "cache-write", {
      productId: ctx.productId,
      qcCandidates: thisRunQc.length,
      qcInserted: inserted.length
    });

    return product;
  } catch (err) {
    logStep(requestId, "route", "cache-write-error", { productId: ctx.productId, error: err?.message });
    return null;
  }
}

/**
 * Wraps a connector call so one agent throwing never breaks Promise.all
 * for the others.
 * @param {() => Promise<any>} fn
 */
async function safeCall(fn) {
  try {
    return await fn();
  } catch (err) {
    return { ok: false, reason: err?.message ?? "Unknown error", images: [] };
  }
}
