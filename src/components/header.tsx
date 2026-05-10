"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const wordmarkClassName =
  "shrink-0 text-sm font-normal leading-none tracking-[0.2em] uppercase text-black transition-colors duration-300 dark:text-white";

const navRowClassName =
  "text-sm font-normal leading-none tracking-[0.2em] uppercase text-black/85 transition-colors duration-300 hover:text-black dark:text-white/85 dark:hover:text-white";

const navStackClassName =
  "block w-full border-b border-gray-200 py-3.5 text-left text-sm font-normal leading-none tracking-[0.2em] uppercase text-black/85 transition-colors duration-300 first:pt-4 last:border-b-0 last:pb-4 hover:text-black dark:border-gray-800 dark:text-white/85 dark:hover:text-white";

const navItems = [
  { href: "/play", label: "Play" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
] as const;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <div className="mx-auto flex h-14 max-w-4xl items-baseline justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className={wordmarkClassName}>
          ZETAVANT
        </Link>

        <nav
          className="hidden items-baseline gap-x-4 md:flex lg:gap-x-6"
          aria-label="Primary"
        >
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href} className={navRowClassName}>
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="shrink-0 text-sm font-normal leading-none tracking-[0.2em] uppercase text-black/85 transition-colors duration-300 hover:text-black md:hidden dark:text-white/85 dark:hover:text-white"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="site-mobile-nav"
          className="border-t border-gray-200 md:hidden dark:border-gray-800"
          aria-label="Primary mobile"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={navStackClassName}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
