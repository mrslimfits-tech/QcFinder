"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function QCGallery({ images }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const scrollRef = useRef(null);

  const scrollByAmount = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  return (
    <div className="animate-rise overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-dashed border-line px-6 py-4">
        <h2 className="font-display text-sm font-medium uppercase tracking-wide text-ink">
          QC Photos
        </h2>
        {images.length > 0 && (
          <span className="font-mono text-[11px] text-slate-muted">
            {images.length} {images.length === 1 ? "photo" : "photos"}
          </span>
        )}
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
          <span className="rounded-full bg-flag-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-flag">
            No QC found
          </span>
        </div>
      ) : (
        <div className="relative px-2 py-6 sm:px-4">
          {images.length > 1 && (
            <>
              <CarouselArrow direction="left" onClick={() => scrollByAmount(-1)} />
              <CarouselArrow direction="right" onClick={() => scrollByAmount(1)} />
            </>
          )}

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                title="Click to view full size"
                className="group relative aspect-square h-40 flex-shrink-0 snap-start overflow-hidden rounded-xl ring-1 ring-line transition-transform hover:scale-[1.02] sm:h-48"
              >
                {/* object-cover crops thumbnails to a square for a tidy
                    grid; the full uncropped image (watermark included)
                    is always shown at full size in the lightbox below —
                    thumbnails are just a preview, never the only view. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`QC photo ${i + 1}`} className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}

function CarouselArrow({ direction, onClick }) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? "Scroll left" : "Scroll right"}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm hover:bg-paper sm:flex ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      {isLeft ? "‹" : "›"}
    </button>
  );
}

// The lightbox intentionally does NOT use the theme-aware ink/paper
// tokens — a photo viewer conventionally stays dark regardless of the
// site's light/dark mode (max contrast for examining detail/watermarks),
// so it uses fixed black/white values instead of colors that would
// invert in dark mode and turn this into a blinding white overlay.
function Lightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") onNavigate((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, onClose, onNavigate]);

  const goTo = (delta) => onNavigate(Math.min(Math.max(index + delta, 0), images.length - 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white hover:bg-white/10"
      >
        ✕
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goTo(-1);
          }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-xl text-white hover:bg-white/10 sm:left-6"
        >
          ‹
        </button>
      )}

      {/* object-contain: the full image, uncropped, exactly as the
          agent returned it — watermarks and all — always fully visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`QC photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain"
      />

      {index < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goTo(1);
          }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-xl text-white hover:bg-white/10 sm:right-6"
        >
          ›
        </button>
      )}

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/70">
        {index + 1} / {images.length}
      </span>
    </div>
  );
}
