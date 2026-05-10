import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-gray-50 font-sans">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-24 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-gray-950">
            Zetalog
          </p>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
            High-performance mental math
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-gray-500">
            Track speed, accuracy, and progress with a lean practice flow built
            for repetition and clarity.
          </p>
          <Link
            href="/login"
            className="mt-14 inline-flex items-center justify-center bg-gray-950 px-10 py-3 text-sm font-medium tracking-widest uppercase text-white rounded-sm transition-colors hover:bg-gray-800"
          >
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
    <div className="flex flex-1 flex-col bg-gray-50 font-sans">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-gray-950">
          Zetalog
        </p>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
          Welcome back
        </h1>
        {user.email && (
          <p className="mt-3 text-sm text-gray-500 font-mono">{user.email}</p>
        )}

        <div className="mt-16 w-full border-t border-gray-200 pt-16">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Most recent score
          </p>
          {recentScore != null ? (
            <p className="mt-4 text-6xl font-semibold tabular-nums tracking-tight text-gray-950 sm:text-7xl">
              {recentScore}
            </p>
          ) : (
            <p className="mt-4 text-base text-gray-500">
              No sessions yet. Start a round to record your first score.
            </p>
          )}
        </div>

        <div className="mt-20 flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/play"
            className="inline-flex flex-1 items-center justify-center border border-gray-950 bg-gray-950 px-8 py-4 text-sm font-medium tracking-widest uppercase text-white rounded-sm transition-colors hover:bg-gray-900 sm:min-w-[200px] sm:flex-none"
          >
            Start New Round
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex flex-1 items-center justify-center border border-gray-300 bg-white px-8 py-4 text-sm font-medium tracking-widest uppercase text-gray-950 rounded-sm transition-colors hover:border-gray-950 sm:min-w-[200px] sm:flex-none"
          >
            View Full Analytics
          </Link>
        </div>
      </main>
    </div>
  );
}
