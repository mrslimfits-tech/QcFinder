const STYLES = {
  error: "border-flag/40 bg-flag-soft text-ink",
  not_found: "border-line bg-surface text-ink"
};

export default function StatusBanner({ status, message, productId }) {
  return (
    <div
      className={`animate-rise rounded-2xl border p-6 text-sm ${STYLES[status] ?? STYLES.error}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="font-display text-xs font-medium uppercase tracking-wide text-slate-muted">
          {status === "not_found" ? "Not found" : "Error"}
        </span>
        {productId && (
          <span className="font-mono text-[11px] text-slate-muted">#{productId}</span>
        )}
      </div>
      <p className="text-ink">{message}</p>
    </div>
  );
}
