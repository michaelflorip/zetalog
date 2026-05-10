import Link from "next/link";

const navClassName =
  "text-sm font-normal tracking-[0.2em] uppercase text-black/85 transition-colors duration-300 hover:text-black dark:text-white/85 dark:hover:text-white";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-normal tracking-[0.2em] uppercase text-black transition-colors duration-300 dark:text-white"
        >
          ZETALOG
        </Link>

        <nav
          className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 sm:gap-x-8"
          aria-label="Primary"
        >
          <Link href="/play" className={navClassName}>
            Play
          </Link>
          <Link href="/dashboard" className={navClassName}>
            Dashboard
          </Link>
          <Link href="/leaderboard" className={navClassName}>
            Leaderboard
          </Link>
          <Link href="/settings" className={navClassName}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
