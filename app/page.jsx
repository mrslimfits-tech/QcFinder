"use client";

import { useState } from "react";
import SearchBar from "../components/SearchBar";
import QcInfoBar from "../components/QcInfoBar";
import QCGallery from "../components/QCGallery";
import StatusBanner from "../components/StatusBanner";
import AgentButtons from "../components/AgentButtons";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [clientError, setClientError] = useState(null);

  async function handleSearch() {
    setLoading(true);
    setClientError(null);
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (data.ok === false) {
        setClientError(data.error || "Search failed.");
      } else {
        setResult(data);
      }
    } catch {
      setClientError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 bg-scanline bg-[length:100%_120px] opacity-40" />

      <div className="relative mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col items-center px-6 py-16 sm:py-24">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-slate-muted">
            QC search
          </span>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            QC Finder
          </h1>
          <p className="max-w-md text-sm text-slate-muted">
            Paste a Mulebuy or Hipobuy product link and find available Quality Check photos.
          </p>
        </div>

        <SearchBar value={url} onChange={setUrl} onSubmit={handleSearch} loading={loading} />

        <div className="mt-10 w-full max-w-2xl space-y-6">
          {clientError && <StatusBanner status="error" message={clientError} />}

          {result && (
            // key={result.productId} forces React to fully unmount and
            // recreate these on every new search — avoids stale
            // QCGallery lightbox/scroll state leaking between products.
            <div key={result.productId} className="space-y-6">
              <QcInfoBar
                platform={result.platform}
                productId={result.productId}
                agents={result.agents}
                qcCount={result.qcCount}
              />
              <QCGallery images={result.qcImages ?? []} />
              <AgentButtons kakobuyLink={result.kakobuyLink} kakobuyRegisterUrl={result.kakobuyRegisterUrl} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
