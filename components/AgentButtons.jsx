"use client";

/**
 * Two buttons only — "Try on Kakobuy" has been removed entirely.
 * Labels match the requested layout: "Open Product" (primary — opens the
 * Kakobuy-wrapped product link) and "Kakobuy" (secondary — the referral
 * signup link). Same underlying logic as before, just relabeled since
 * there's no longer a product image/title to make "Buy on Kakobuy"
 * self-evidently about a specific product.
 *
 * Both links come from the API response (route.js), never computed
 * client-side: kakobuyLink is per-product and privacy-sensitive to
 * generate (needs the real source URL, which never reaches the client
 * directly — see services/affiliates/kakobuy.js), and kakobuyRegisterUrl
 * is served from the same place purely so there's one source of truth
 * for the affcode, rather than duplicating it into client-bundle code.
 */
export default function AgentButtons({ kakobuyLink, kakobuyRegisterUrl }) {
  if (!kakobuyLink && !kakobuyRegisterUrl) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {kakobuyLink && (
        <a
          href={kakobuyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-verified"
        >
          Open Product
        </a>
      )}

      {kakobuyRegisterUrl && (
        <a
          href={kakobuyRegisterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          Kakobuy
        </a>
      )}
    </div>
  );
}
