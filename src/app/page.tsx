import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const PRIMARY_BTN =
  "inline-flex items-center justify-center bg-black px-10 py-3 text-sm font-medium tracking-widest uppercase text-white transition-colors duration-300 hover:opacity-90 dark:bg-white dark:text-black rounded-sm";

const PRIMARY_BTN_WIDE =
  "inline-flex flex-1 items-center justify-center bg-black px-8 py-4 text-sm font-medium tracking-widest uppercase text-white transition-colors duration-300 hover:opacity-90 dark:bg-white dark:text-black rounded-sm sm:min-w-[200px] sm:flex-none";

const OUTLINE_BTN =
  "inline-flex flex-1 items-center justify-center border border-black bg-white px-8 py-4 text-sm font-medium tracking-widest uppercase text-black transition-colors duration-300 hover:bg-neutral-50 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/10 rounded-sm sm:min-w-[200px] sm:flex-none";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-white font-sans transition-colors duration-300 dark:bg-black">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-24 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-black transition-colors duration-300 dark:text-white">
            Zetavant
          </p>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white sm:text-4xl">
            Master your mental math
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            A disciplined practice environment for speed, accuracy, and
            competitive mastery—built for repetition with clarity.
          </p>
          <Link href="/login" className={`mt-14 ${PRIMARY_BTN}`}>
            Get Started
          </Link>
        </main>
      </div>
    );
  }

  const { data: latestSession } = await supabase
    .from("sessions")
    .select("score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const recentScore = latestSession?.score;

  return (
    <div className="flex flex-1 flex-col bg-white font-sans transition-colors duration-300 dark:bg-black">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-black transition-colors duration-300 dark:text-white">
          Zetavant
        </p>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white sm:text-4xl">
          Welcome back
        </h1>
        {user.email && (
          <p className="mt-3 font-mono text-sm text-neutral-500 dark:text-neutral-400">
            {user.email}
          </p>
        )}

        <div className="mt-16 w-full border-t border-gray-200 pt-16 transition-colors duration-300 dark:border-gray-800">
          <p className="text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500">
            Latest peak score
          </p>
          {recentScore != null ? (
            <p className="mt-4 text-6xl font-semibold tabular-nums tracking-tight text-black transition-colors duration-300 dark:text-white sm:text-7xl">
              {recentScore}
            </p>
          ) : (
            <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400">
              No rounds yet. Start a session to establish your baseline.
            </p>
          )}
        </div>

        <div className="mt-20 flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/play" className={PRIMARY_BTN_WIDE}>
            Start New Round
          </Link>
          <Link href="/dashboard" className={OUTLINE_BTN}>
            View Full Analytics
          </Link>
        </div>
      </main>
    </div>
  );
}
