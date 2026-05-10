import Link from "next/link";

const navClassName =
  "text-sm font-normal tracking-[0.2em] uppercase text-foreground/85 hover:text-foreground transition-colors";

export default function Header() {
  return (
    <header className="border-b border-black/10 bg-background dark:border-white/15">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-normal tracking-[0.2em] uppercase text-foreground"
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
