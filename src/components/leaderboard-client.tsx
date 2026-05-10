"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatSwissDate,
  localCalendarMonthUtcIsoRange,
  localCalendarWeekUtcIsoRange,
} from "@/lib/datetime";

type LeaderboardTab = "hof" | "all" | "month" | "week";

interface SessionRow {
  score: number;
  created_at: string;
  user_id: string;
  attempt_number: number | null;
}

interface LeaderRow {
  rank: number;
  username: string;
  score: number;
  created_at: string;
  attempt_number: number | null;
}

const HOF_EMPTY =
  "The Hall of Fame is currently empty. Toggle your profile to public to join.";

const PAGE_SIZE = 1000;

function tabButtonClass(active: boolean) {
  return [
    "pb-3 text-xs font-normal uppercase tracking-[0.22em] transition-colors duration-300",
    active
      ? "border-b-2 border-black font-medium text-black dark:border-white dark:text-white"
      : "border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
  ].join(" ");
}

async function fetchAllSessionsForUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<SessionRow[]> {
  if (userIds.length === 0) return [];

  const rows: SessionRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("sessions")
      .select("score, created_at, user_id, attempt_number")
      .in("user_id", userIds)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const s of data) {
      rows.push({
        score: Number(s.score),
        created_at: s.created_at as string,
        user_id: s.user_id as string,
        attempt_number:
          s.attempt_number != null ? Number(s.attempt_number) : null,
      });
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function buildHallOfFameRows(
  sessions: SessionRow[],
  usernameById: Map<string, string>,
): LeaderRow[] {
  const best = new Map<string, SessionRow>();

  for (const s of sessions) {
    const prev = best.get(s.user_id);
    if (!prev || s.score > prev.score) {
      best.set(s.user_id, s);
    } else if (prev && s.score === prev.score) {
      const prevT = new Date(prev.created_at).getTime();
      const nextT = new Date(s.created_at).getTime();
      if (nextT > prevT) best.set(s.user_id, s);
    }
  }

  const sorted = [...best.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50);

  return sorted.map(([userId, s], index) => ({
    rank: index + 1,
    username: usernameById.get(userId) ?? "—",
    score: s.score,
    created_at: s.created_at,
    attempt_number: null,
  }));
}

export default function LeaderboardClient() {
  const [tab, setTab] = useState<LeaderboardTab>("hof");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPublicProfiles, setNoPublicProfiles] = useState(false);

  const fetchData = useCallback(async (range: LeaderboardTab) => {
    setLoading(true);
    setError(null);
    setNoPublicProfiles(false);
    const supabase = createClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("is_public", true);

    if (profilesError) {
      setError(profilesError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = (profiles ?? []).map((p) => p.id).filter(Boolean);
    const usernameById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p.username ?? "—"]),
    );

    if (userIds.length === 0) {
      setRows([]);
      setNoPublicProfiles(true);
      setLoading(false);
      return;
    }

    try {
      if (range === "hof") {
        const allSessions = await fetchAllSessionsForUsers(supabase, userIds);
        const list = buildHallOfFameRows(allSessions, usernameById);
        setRows(list);
        setLoading(false);
        return;
      }

      let q = supabase
        .from("sessions")
        .select("score, created_at, user_id, attempt_number")
        .in("user_id", userIds)
        .order("score", { ascending: false })
        .limit(50);

      if (range === "month") {
        const { startIso, endIso } = localCalendarMonthUtcIsoRange(new Date());
        q = q.gte("created_at", startIso).lte("created_at", endIso);
      } else if (range === "week") {
        const { startIso, endIso } = localCalendarWeekUtcIsoRange(new Date());
        q = q.gte("created_at", startIso).lte("created_at", endIso);
      }

      const { data: sessions, error: sessError } = await q;

      if (sessError) {
        setError(sessError.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const list: LeaderRow[] = (sessions ?? []).map((s, index) => ({
        rank: index + 1,
        username: usernameById.get(s.user_id as string) ?? "—",
        score: Number(s.score),
        created_at: s.created_at as string,
        attempt_number:
          s.attempt_number != null ? Number(s.attempt_number) : null,
      }));

      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      setRows([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData(tab);
  }, [tab, fetchData]);

  const showHofEmptyMessage =
    !loading && !error && noPublicProfiles && tab === "hof";
  const showGenericEmpty =
    !loading &&
    !error &&
    ((!noPublicProfiles && rows.length === 0) ||
      (noPublicProfiles && tab !== "hof"));
  const showTable = !loading && !error && rows.length > 0;

  /** Shared 5-col template: Rank | Username | Attempt (or spacer) | Score | Date — keeps alignment across tabs. */
  const gridCols =
    "grid-cols-[44px_minmax(0,1fr)_minmax(72px,96px)_52px_auto] sm:grid-cols-[52px_minmax(0,1fr)_minmax(88px,104px)_56px_auto]";

  const gridHeaderClass = [
    "grid items-baseline gap-x-6 gap-y-1 border-b border-gray-200 py-5 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 dark:border-gray-800 dark:text-neutral-500 sm:gap-x-10",
    gridCols,
  ].join(" ");

  const gridRowClass = [
    "grid items-baseline gap-x-6 gap-y-2 border-b border-gray-200 py-12 transition-colors duration-300 last:border-b-0 dark:border-gray-800 sm:gap-x-10",
    gridCols,
  ].join(" ");

  return (
    <div className="flex flex-1 flex-col bg-white font-sans transition-colors duration-300 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-8 py-20">
        <h1 className="text-xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
          Leaderboard
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-500 transition-colors duration-300 dark:text-neutral-400">
          Highest scores among players who have made their profiles public.
        </p>

        <div className="mt-16 flex flex-wrap gap-x-8 gap-y-2 border-b border-gray-200 pb-px transition-colors duration-300 dark:border-gray-800 sm:gap-x-10">
          <button
            type="button"
            className={tabButtonClass(tab === "hof")}
            onClick={() => setTab("hof")}
          >
            Hall of Fame
          </button>
          <button
            type="button"
            className={tabButtonClass(tab === "all")}
            onClick={() => setTab("all")}
          >
            All-time
          </button>
          <button
            type="button"
            className={tabButtonClass(tab === "month")}
            onClick={() => setTab("month")}
          >
            This month
          </button>
          <button
            type="button"
            className={tabButtonClass(tab === "week")}
            onClick={() => setTab("week")}
          >
            This week
          </button>
        </div>

        <div className="mt-12">
          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 transition-colors duration-300 dark:border-red-900 dark:bg-red-950/35 dark:text-red-200">
              {error}
            </p>
          )}

          {loading && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Loading…
            </p>
          )}

          {showHofEmptyMessage && (
            <p className="max-w-md text-sm leading-relaxed text-neutral-500 transition-colors duration-300 dark:text-neutral-400">
              {HOF_EMPTY}
            </p>
          )}

          {showGenericEmpty && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No qualifying scores yet.
            </p>
          )}

          {showTable && (
            <div className="border-t border-gray-200 transition-colors duration-300 dark:border-gray-800">
              <header className={gridHeaderClass}>
                <span>Rank</span>
                <span>Username</span>
                {tab === "hof" ? (
                  <span className="invisible select-none" aria-hidden="true">
                    Attempt
                  </span>
                ) : (
                  <span className="text-right sm:text-left">Attempt</span>
                )}
                <span className="text-right">Score</span>
                <span className="text-right">Date</span>
              </header>
              <ul role="list">
                {rows.map((r, i) => (
                  <li
                    key={`${tab}-${r.created_at}-${r.username}-${r.score}-${i}`}
                    className={gridRowClass}
                  >
                    <span className="font-mono text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                      #{r.rank}
                    </span>
                    <span className="break-all font-mono text-sm text-black dark:text-white">
                      {r.username}
                    </span>
                    {tab === "hof" ? (
                      <span
                        className="invisible text-right font-mono text-[10px] sm:text-left sm:text-xs"
                        aria-hidden="true"
                      >
                        #0
                      </span>
                    ) : (
                      <span className="text-right font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sm:text-left sm:text-xs">
                        {r.attempt_number != null ? `#${r.attempt_number}` : "—"}
                      </span>
                    )}
                    <span
                      className={
                        tab === "hof"
                          ? "text-right font-mono text-sm font-bold tabular-nums text-black dark:text-white"
                          : "text-right font-mono text-sm font-medium tabular-nums text-black dark:text-white"
                      }
                    >
                      {r.score}
                    </span>
                    <span className="text-right font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                      {formatSwissDate(r.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
