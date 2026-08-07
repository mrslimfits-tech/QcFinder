"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1PgVzuN6LfbEMJSMviKF_bCx0mUk2aBbS99mUJBlFfI8/edit?gid=1281688000#gid=1281688000";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="font-display text-sm font-medium tracking-tight text-ink">
          QC Finder
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-md active:translate-y-0"
          >
            Best Spreadsheet here
          </a>
        </nav>
      </div>
    </header>
  );
}
