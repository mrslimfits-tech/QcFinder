import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display"
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata = {
  title: "QC Finder",
  description: "Paste a product link and find available Quality Check photos."
};

// Sets the .dark class on <html> before first paint, based on the
// user's saved preference (or system preference if they've never
// toggled it) — without this, the page would flash the wrong theme for
// a frame on every load. Kept as a tiny inline script (not a React
// effect) specifically so it runs synchronously before the browser paints.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("qc-finder-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body antialiased">
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Header />
        {children}
      </body>
    </html>
  );
}
