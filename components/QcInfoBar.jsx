const AGENT_LABELS = {
  mulebuy: "Mulebuy",
  hipobuy: "Hipobuy"
};

/**
 * Replaces the old ResultSummary (title/price/image card) entirely.
 * Product info doesn't exist in this system anymore — this just names
 * which agent(s) actually contributed QC for this search, plus a count.
 * `agents` reflects THIS run only (see app/api/search/route.js — the
 * DB no longer tracks per-image agent attribution).
 */
export default function QcInfoBar({ platform, productId, agents, qcCount }) {
  const agentLabel = agents?.length ? agents.map((a) => AGENT_LABELS[a] ?? a).join(", ") : "—";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-sm text-ink">
          Agent: <span className="font-medium">{agentLabel}</span>
        </span>
        <span className="font-mono text-[11px] text-slate-muted">
          {platform} · #{productId}
        </span>
      </div>
      <span className="font-mono text-sm text-ink">
        {qcCount} {qcCount === 1 ? "QC Photo" : "QC Photos"}
      </span>
    </div>
  );
}
