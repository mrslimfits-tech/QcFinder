"use client";

export default function SearchBar({ value, onChange, onSubmit, loading }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[0_1px_0_rgba(20,21,26,0.04)] sm:flex-row sm:items-center">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a product link (1688, Taobao, Weidian, or a link from a supported agent)"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 font-mono text-sm text-ink placeholder:text-slate-muted/70 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="whitespace-nowrap rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-verified disabled:cursor-not-allowed disabled:opacity-40 sm:mx-2"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
