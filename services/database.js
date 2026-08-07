/**
 * services/database.js
 *
 * Minimal, QC-focused schema. products only needs product_id/platform/
 * original_url to exist — title/price/currency/image_url are NOT
 * required anywhere in this file anymore (product info was removed from
 * the whole app per explicit decision). quality_checks only needs
 * product_id + image_url — no `agent`/`last_seen_at` columns are
 * referenced here anymore, which is what actually fixes the repeated
 * "column does not exist" errors for good: the code simply doesn't ask
 * for columns beyond what it truly needs, regardless of what extra
 * columns your live table happens to have (harmless either way).
 *
 * getRecentProducts() (which powered "Recently Searched") has been
 * removed along with the feature itself.
 *
 * Every function here uses the SERVICE-ROLE client, including reads.
 * products.original_url is privacy-sensitive (used only to generate the
 * Kakobuy affiliate link server-side — never shown to users, see
 * supabase/schema.sql), and this app never reads Supabase from the
 * browser at all, so there's no reason to route anything through the
 * anon-privileged client.
 */

import { getServiceClient } from "../lib/supabase.js";

function requireServiceClient() {
  const client = getServiceClient();
  if (!client) {
    throw new Error("Supabase non configurato per la scrittura (SUPABASE_SERVICE_ROLE_KEY mancante).");
  }
  return client;
}

/**
 * @param {string} productId - source-platform productId (products.product_id)
 * @returns {Promise<object|null>} the product row (including original_url — caller must never forward it in an API response), or null if not cached yet
 */
export async function getProductById(productId) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Creates a product row, or — if one already exists for this product_id
 * — leaves it as-is (nothing to update: platform/original_url don't
 * change for a given productId). Relies on the UNIQUE constraint on
 * products.product_id to guarantee no duplicates even under concurrent
 * requests.
 *
 * @param {{productId:string, platform:string, originalUrl:string}} data
 * @param {object|null} [existing] - pass the already-fetched row to skip an extra lookup; if omitted, it's fetched here.
 * @returns {Promise<object>} the product row after the upsert
 */
export async function createProduct(data, existing = undefined) {
  const supabase = requireServiceClient();

  const existingRow = existing !== undefined ? existing : await getProductById(data.productId).catch(() => null);
  if (existingRow) return existingRow;

  const { data: row, error } = await supabase
    .from("products")
    .upsert(
      { product_id: data.productId, platform: data.platform ?? null, original_url: data.originalUrl ?? null },
      { onConflict: "product_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return row;
}

/**
 * Additive, historical-archive QC storage — NEVER deletes or replaces
 * existing rows. Each new image_url for this product is inserted; an
 * already-known image_url is simply skipped (no-op) rather than
 * duplicated. UNIQUE(product_id, image_url) (supabase/schema.sql) is
 * what makes this safe at the DB level, not just in application code.
 *
 * @param {string} productDbId - products.id (UUID)
 * @param {string[]} imageUrls
 * @returns {Promise<string[]>} the image_url values actually inserted (new ones only)
 */
export async function upsertQualityChecks(productDbId, imageUrls) {
  const urls = (imageUrls ?? []).filter(Boolean);
  if (!urls.length) return [];

  const supabase = requireServiceClient();
  const rows = urls.map((url) => ({ product_id: productDbId, image_url: url }));

  const { data, error } = await supabase
    .from("quality_checks")
    .upsert(rows, { onConflict: "product_id,image_url", ignoreDuplicates: true })
    .select();

  if (error) throw error;
  return (data ?? []).map((row) => row.image_url);
}

/**
 * The full, historical QC archive for a product: every image ever
 * confirmed by any agent, still present (never pruned by this app).
 *
 * @param {string} productId - source-platform productId
 * @param {object|null} [knownProduct] - pass the already-fetched products
 *   row (from getProductById) to skip a redundant second lookup.
 * @returns {Promise<string[]>} image URLs, oldest first
 */
export async function getQualityChecksByProduct(productId, knownProduct = undefined) {
  const product = knownProduct !== undefined ? knownProduct : await getProductById(productId);
  if (!product) return [];

  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("quality_checks")
    .select("image_url, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.image_url);
}

/**
 * Deletes a product row (and, via ON DELETE CASCADE in the schema, all
 * its quality_checks rows with it). Simple, blunt cache invalidation for
 * a single productId — meant for testing.
 *
 * @param {string} productId - source-platform productId
 * @returns {Promise<{deleted: boolean}>}
 */
export async function deleteProduct(productId) {
  const supabase = requireServiceClient();
  const { error, count } = await supabase
    .from("products")
    .delete({ count: "exact" })
    .eq("product_id", productId);

  if (error) throw error;
  return { deleted: (count ?? 0) > 0 };
}
