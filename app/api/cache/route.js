import { NextResponse } from "next/server";
import { deleteProduct } from "../../../services/database.js";

/**
 * DELETE /api/cache?productId=905256798304
 *
 * Blunt, simple cache invalidation for a single productId — for testing.
 * Deletes the products row outright (quality_checks rows go with it via
 * ON DELETE CASCADE, see supabase/schema.sql). The next search for that
 * productId is a clean cache-miss and goes straight to the agents.
 *
 * Also reachable via GET (same effect) purely for convenience — so you
 * can invalidate a productId by just pasting a URL in the browser during
 * local testing, without needing curl/Postman for a DELETE request.
 *
 * Not linked from the UI anywhere — deliberately a dev/test tool, not a
 * user-facing feature.
 */
export async function DELETE(request) {
  return handleInvalidate(request);
}

export async function GET(request) {
  return handleInvalidate(request);
}

async function handleInvalidate(request) {
  const productId = new URL(request.url).searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ ok: false, error: "Parametro ?productId= mancante." }, { status: 400 });
  }

  try {
    const result = await deleteProduct(productId);
    return NextResponse.json({ ok: true, productId, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error during invalidation." },
      { status: 500 }
    );
  }
}
