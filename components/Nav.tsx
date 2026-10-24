"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Nav({ game = false }: { game?: boolean }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("portfolio-theme");
    } catch {}
    const v = stored
      ? stored === "light"
      : matchMedia("(prefers-color-scheme: light)").matches;
    setLight(v);
    document.documentElement.dataset.theme = v ? "light" : "dark";
  }, []);
  return (
    <header className="site-nav">
      <Link href="/" className="brand" aria-label="Jalal Grini home">
        JG<span>Jalal Grini</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/portfolio/">Portfolio</Link>
        <Link href="/play/" className={game ? "active" : ""}>
          Explore town <span>↗</span>
        </Link>
        <button
          className="icon-button theme-toggle"
          aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          onClick={() => {
            setLight(!light);
            document.documentElement.dataset.theme = !light ? "light" : "dark";
            try {
              localStorage.setItem(
                "portfolio-theme",
                !light ? "light" : "dark",
              );
            } catch {}
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            {light ? (
              <path d="M20.7 13.4A8.8 8.8 0 0 1 10.6 3.3 9 9 0 1 0 20.7 13.4Z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
              </>
            )}
          </svg>
        </button>
      </nav>
    </header>
  );
}
