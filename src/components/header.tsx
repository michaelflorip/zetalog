"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const wordmarkClassName =
  "shrink-0 font-sans text-xs font-normal leading-none tracking-[0.2em] uppercase text-black transition-colors duration-300 dark:text-white";

const navRowClassName =
  "text-sm font-normal leading-none tracking-[0.2em] uppercase text-black/85 transition-colors duration-300 hover:text-black dark:text-white/85 dark:hover:text-white";

const navItems = [
  { href: "/play", label: "Play" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
] as const;

const mobileDrawerLinkClassName =
  "block w-full px-8 py-4 font-mono text-xs tracking-widest uppercase text-black/85 transition-colors duration-300 hover:text-black dark:text-white/85 dark:hover:text-white";

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      setHeaderHeight(header.offsetHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <header
      ref={headerRef}
      className="border-b border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-black"
    >
      <div className="mx-auto flex max-w-4xl items-baseline justify-between gap-3 px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top,0px))] sm:px-6 md:pb-10 md:pt-10">
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
          className="shrink-0 sm:hidden"
          aria-expanded={isOpen}
          aria-controls="site-mobile-nav"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? (
            <span className="font-mono text-lg leading-none text-black dark:text-white">
              ×
            </span>
          ) : (
            <div className="flex cursor-pointer flex-col gap-1.5">
              <span className="block h-px w-5 bg-black dark:bg-white" />
              <span className="block h-px w-5 bg-black dark:bg-white" />
              <span className="block h-px w-5 bg-black dark:bg-white" />
            </div>
          )}
        </button>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 z-40 sm:hidden"
            style={{ top: headerHeight }}
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="site-mobile-nav"
            className="fixed left-0 right-0 z-50 border-b border-gray-200 bg-white sm:hidden dark:border-gray-800 dark:bg-black"
            style={{ top: headerHeight }}
            aria-label="Primary mobile"
          >
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={mobileDrawerLinkClassName}
                onClick={() => setIsOpen(false)}
              >
                {label.toUpperCase()}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
