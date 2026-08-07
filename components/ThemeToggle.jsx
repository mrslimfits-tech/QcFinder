"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qc-finder-theme";

export default function ThemeToggle() {
  // Starts null so the server-rendered markup and the first client
  // render match (avoids a hydration mismatch) — the real value is read
  // from the DOM right after mount, since the inline script in
  // layout.jsx already set the correct class on <html> before paint.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in some privacy modes — theme just won't
      // persist across reloads, not worth failing the toggle over.
    }
    setTheme(next);
  }

  if (!theme) {
    // Placeholder holds the exact same footprint as the real button so
    // nothing shifts once theme is known.
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-paper"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
