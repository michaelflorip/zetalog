"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatSwissDate,
  localCalendarMonthUtcIsoRange,
  localCalendarWeekUtcIsoRange,
} from "@/lib/datetime";

type LeaderboardTab = "all" | "month" | "week";

interface LeaderRow {
  rank: number;
  username: string;
  score: number;
  created_at: string;
}

function tabButtonClass(active: boolean) {
  return [
    "text-xs font-normal tracking-[0.22em] uppercase pb-3 border-b-2 transition-colors",
    active
      ? "border-gray-950 text-gray-950"
      : "border-transparent text-gray-400 hover:text-gray-700",
  ].join(" ");
}

export default function LeaderboardClient() {
  const [tab, setTab] = useState<LeaderboardTab>("all");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (range: LeaderboardTab) => {
    setLoading(true);
    setError(null);
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
      setLoading(false);
      return;
    }

    let q = supabase
      .from("sessions")
      .select("score, created_at, user_id")
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
    }));

    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData(tab);
  }, [tab, fetchData]);

  return (
    <div className="flex flex-1 flex-col bg-white font-sans">
      <div className="mx-auto w-full max-w-3xl px-8 py-20">
        <h1 className="text-xl font-semibold tracking-tight text-gray-950">
          Leaderboard
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-500">
          Highest scores among players who have made their profiles public.
        </p>

        <div className="mt-16 flex flex-wrap gap-x-10 gap-y-2 border-b border-gray-100">
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
            <p className="rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {loading && (
            <p className="text-sm text-gray-400">Loading…</p>
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="text-sm text-gray-500">No qualifying scores yet.</p>
          )}

          {!loading && rows.length > 0 && (
            <div className="border-t border-gray-200">
              <header className="grid grid-cols-[52px_minmax(0,1fr)_48px_auto] items-baseline gap-x-8 gap-y-1 border-b border-gray-100 py-5 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 sm:gap-x-14">
                <span>Rank</span>
                <span>Username</span>
                <span className="text-right">Score</span>
                <span className="text-right">Date</span>
              </header>
              <ul role="list">
                {rows.map((r, i) => (
                  <li
                    key={`${r.created_at}-${r.username}-${r.score}-${i}`}
                    className="grid grid-cols-[52px_minmax(0,1fr)_48px_auto] items-baseline gap-x-8 gap-y-2 border-b border-gray-100 py-12 last:border-b-0 sm:gap-x-14"
                  >
                    <span className="font-mono text-sm tabular-nums text-gray-500">
                      #{r.rank}
                    </span>
                    <span className="break-all font-mono text-sm text-gray-950">
                      {r.username}
                    </span>
                    <span className="text-right font-mono text-sm font-medium tabular-nums text-gray-950">
                      {r.score}
                    </span>
                    <span className="text-right font-mono text-xs tabular-nums text-gray-500">
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
