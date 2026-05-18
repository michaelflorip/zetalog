import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const LABEL_MUTED =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const PRIMARY_BTN =
  "inline-flex items-center justify-center bg-black px-10 py-3 font-sans text-xs tracking-widest uppercase text-white rounded-sm transition-colors duration-300 dark:bg-white dark:text-black";

const GHOST_BTN =
  "inline-flex items-center justify-center border border-black px-10 py-3 font-sans text-xs tracking-widest uppercase text-black rounded-sm transition-colors duration-300 dark:border-white dark:text-white";

const PRIMARY_BTN_WIDE =
  "inline-flex flex-1 items-center justify-center bg-black px-8 py-4 text-sm font-medium tracking-widest uppercase text-white transition-colors duration-300 hover:opacity-90 dark:bg-white dark:text-black rounded-sm sm:min-w-[200px] sm:flex-none";

const OUTLINE_BTN =
  "inline-flex flex-1 items-center justify-center border border-black bg-white px-8 py-4 text-sm font-medium tracking-widest uppercase text-black transition-colors duration-300 hover:bg-neutral-50 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/10 rounded-sm sm:min-w-[200px] sm:flex-none";

const OPERATOR_SPECS = [
  { name: "ADDITION", range: "2–100 + 2–100" },
  { name: "SUBTRACTION", range: "Inverted addition" },
  { name: "MULTIPLICATION", range: "2–12 × 2–100" },
  { name: "DIVISION", range: "Inverted multiplication" },
] as const;

const HOW_IT_WORKS = [
  {
    numeral: "01",
    title: "ANSWER",
    body: "Rapid-fire mental math problems. Four operations, configurable difficulty. Two minutes on the clock.",
  },
  {
    numeral: "02",
    title: "GET SCORED",
    body: "Every session logs your accuracy, speed per question, and operator breakdown. Ranked sessions count toward the leaderboard.",
  },
  {
    numeral: "03",
    title: "TRACK PROGRESS",
    body: "Review trends, personal bests, and your full session history on your dashboard. See where time is being lost.",
  },
] as const;

interface TopSessionRow {
  username: string;
  score: number;
}

function profileUsername(
  profiles: { username: string | null } | { username: string | null }[] | null,
): string {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.username?.trim() || "—";
}

async function fetchTopSessions(): Promise<TopSessionRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("score, user_id, profiles!inner(username)")
      .eq("source", "zetavant")
      .eq("profiles.is_public", true)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];

    const seen = new Set<string>();
    const topUsers: TopSessionRow[] = [];

    for (const row of data) {
      const userId = row.user_id as string;
      if (!userId || seen.has(userId)) continue;

      seen.add(userId);
      const raw = row.profiles as
        | { username: string | null }
        | { username: string | null }[]
        | null;

      topUsers.push({
        username: profileUsername(raw),
        score: Number(row.score),
      });

      if (topUsers.length === 5) break;
    }

    return topUsers;
  } catch {
    return [];
  }
}

function GuestHome({ topSessions }: { topSessions: TopSessionRow[] }) {
  return (
    <>
      <style>{`
  @keyframes mouse-scroll {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(6px); }
  }
  .mouse-dot {
    animation: mouse-scroll 1.5s ease-in-out infinite;
  }
`}</style>
      <div className="flex flex-1 flex-col bg-white font-sans transition-colors duration-300 dark:bg-black">
      <section className="relative flex min-h-screen flex-col items-center justify-center text-center">
        <div className="mx-auto w-full max-w-3xl px-6">
          <p className={LABEL_MUTED}>Zetavant</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-black dark:text-white md:text-6xl">
            Master your mental math
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base text-neutral-500 dark:text-neutral-400 md:text-lg">
            Two minutes. Sharpen speed and accuracy under pressure.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={PRIMARY_BTN}>
              GET STARTED
            </Link>
            <Link href="/leaderboard" className={GHOST_BTN}>
              VIEW LEADERBOARD
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex h-8 w-5 justify-center rounded-sm border border-neutral-300 pt-1.5 dark:border-neutral-600">
            <div className="mouse-dot h-1.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-20 md:py-28 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className={LABEL_MUTED}>How it works</p>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.numeral}>
                <p className="font-mono text-4xl font-medium tabular-nums text-black dark:text-white">
                  {step.numeral}
                </p>
                <p className="mt-3 text-sm font-medium tracking-widest uppercase text-black dark:text-white">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-20 md:py-28 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className={LABEL_MUTED}>Hall of fame</p>
          <p className="mt-1 font-mono text-xs tracking-widest text-neutral-400">
            TOP SCORES — STANDARD 2-MINUTE SESSIONS
          </p>
          <div className="mt-8 w-full">
            {topSessions.length > 0 ? (
              topSessions.map((row, index) => (
                <div
                  key={`${row.username}-${row.score}-${index}`}
                  className="flex items-baseline justify-between border-b border-gray-100 py-3 dark:border-gray-900"
                >
                  <div className="flex items-baseline">
                    <span className="w-6 font-mono text-xs tabular-nums text-neutral-400">
                      #{index + 1}
                    </span>
                    <span className="ml-4 font-mono text-sm text-black dark:text-white">
                      {row.username}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-medium tabular-nums text-black dark:text-white">
                    {row.score}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-baseline justify-between border-b border-gray-100 py-3 dark:border-gray-900">
                <span className="font-mono text-sm text-neutral-400">—</span>
                <span className="font-mono text-sm text-neutral-400">—</span>
              </div>
            )}
          </div>
          <p className="mt-4 text-right">
            <Link
              href="/leaderboard"
              className="font-mono text-xs tracking-widest uppercase text-neutral-400 transition-colors duration-300 hover:text-black dark:hover:text-white"
            >
              VIEW FULL LEADERBOARD →
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 py-20 md:py-28 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className={LABEL_MUTED}>Standard protocol</p>
          <p className="mt-1 font-mono text-xs tracking-widest text-neutral-400">
            RANKED SESSION — 120 SECONDS
          </p>
          <div className="mt-8 divide-y divide-gray-100 dark:divide-gray-900">
            {OPERATOR_SPECS.map((spec) => (
              <div
                key={spec.name}
                className="flex items-baseline justify-between py-3"
              >
                <span className="text-xs font-medium tracking-widest uppercase text-neutral-400">
                  {spec.name}
                </span>
                <span className="font-mono text-sm text-black dark:text-white">
                  {spec.range}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-20 md:py-28 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mt-10 rounded-sm border border-gray-200 p-8 dark:border-gray-800 md:flex md:items-center md:justify-between">
            <div>
              <p className={LABEL_MUTED}>Sandbox mode</p>
              <p className="mt-1 text-lg font-medium text-black dark:text-white">
                Practice on your terms.
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                Configure duration, operators, and number ranges. Sandbox
                sessions are never ranked — just focused, deliberate practice.
              </p>
            </div>
            <div className="mt-6 shrink-0 md:mt-0 md:ml-12">
              <Link href="/signup" className={GHOST_BTN}>
                EXPLORE SANDBOX
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 py-20 md:py-28 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className={LABEL_MUTED}>Get started</p>
          <h2 className="mt-2 text-2xl font-bold text-black md:text-3xl dark:text-white">
            Free. No credit card. Just math.
          </h2>
          <Link href="/signup" className={`mt-8 ${PRIMARY_BTN}`}>
            CREATE ACCOUNT
          </Link>
          <p className="mt-4">
            <Link
              href="/login"
              className="font-mono text-xs tracking-widest uppercase text-neutral-400 transition-colors duration-300 hover:text-black dark:hover:text-white"
            >
              ALREADY HAVE AN ACCOUNT? LOG IN →
            </Link>
          </p>
        </div>
      </section>
    </div>
    </>
  );
}

export default async function Home() {
  const topSessions = await fetchTopSessions();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <GuestHome topSessions={topSessions} />;
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
