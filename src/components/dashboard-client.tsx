"use client";

import Link from "next/link";
import { useMemo } from "react";
import DashboardCharts from "@/components/dashboard-charts";
import DashboardSessionList, {
  type DashboardSessionRow,
} from "@/components/dashboard-session-list";
import { SandboxBestGrid } from "@/components/sandbox-best-grid";
import { SandboxScoreTrendTabs } from "@/components/sandbox-score-trend-tabs";
import { useSandboxMode } from "@/hooks/use-sandbox-mode";
import { averagesByOperator } from "@/lib/dashboard-aggregates";

const RANKED_SESSION_SOURCE = "zetavant";

const SANDBOX_MODE_TAG =
  "font-mono text-[10px] uppercase tracking-[0.2em] px-1.5 py-0.5 border border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500";

export interface DashboardSessionRecord {
  id: string;
  created_at: string;
  score: number;
  attempt_number: number | null;
  source: string | null;
  settings: unknown;
  raw_data: unknown;
}

interface DashboardClientProps {
  sessions: DashboardSessionRecord[];
  rankedAllTimeHigh: number | null;
  rankedTotalAttempts: number;
}

function isRankedSource(source: string | null | undefined): boolean {
  return source === RANKED_SESSION_SOURCE;
}

function StatCard({ label, value }: { label: string; value: string }) {
  const isEmpty = value === "—";

  return (
    <div className="rounded-sm border border-gray-200 bg-white px-4 py-4 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p
        className={
          isEmpty
            ? "mt-3 font-mono text-2xl tabular-nums text-black transition-colors duration-300 dark:text-white"
            : "mt-3 text-2xl font-semibold tabular-nums tracking-tight text-black transition-colors duration-300 dark:text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardClient({
  sessions,
  rankedAllTimeHigh,
  rankedTotalAttempts,
}: DashboardClientProps) {
  const { isSandbox } = useSandboxMode();

  const rankedSessions = useMemo(
    () => sessions.filter((s) => isRankedSource(s.source)),
    [sessions],
  );

  const sandboxSessions = useMemo(
    () => sessions.filter((s) => s.source === "sandbox"),
    [sessions],
  );

  const activeSessions = isSandbox ? sandboxSessions : rankedSessions;

  const allTimeHigh = useMemo(() => {
    if (isSandbox) {
      if (sandboxSessions.length === 0) return null;
      return Math.max(...sandboxSessions.map((s) => s.score));
    }
    return rankedAllTimeHigh;
  }, [isSandbox, sandboxSessions, rankedAllTimeHigh]);

  const totalAttempts = isSandbox
    ? sandboxSessions.length
    : rankedTotalAttempts;

  const averageLast10 = useMemo(() => {
    const last10 = activeSessions.slice(0, 10);
    if (last10.length === 0) return null;
    return (
      Math.round(
        (last10.reduce((acc, s) => acc + s.score, 0) / last10.length) * 10,
      ) / 10
    );
  }, [activeSessions]);

  const lineData = useMemo(() => {
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const chronological = [...activeSessions].reverse();
    return chronological.map((s) => ({
      at: dateFmt.format(new Date(s.created_at)),
      score: s.score,
    }));
  }, [activeSessions]);

  const barData = useMemo(() => {
    const barAgg = averagesByOperator(activeSessions);
    return barAgg.map(({ operator, avgMs }) => ({
      operator,
      avgMs,
    }));
  }, [activeSessions]);

  const displaySessions: DashboardSessionRow[] = useMemo(() => {
    const rows = isSandbox
      ? [...sandboxSessions, ...rankedSessions]
      : sessions;
    return rows.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      score: s.score,
      attempt_number: s.attempt_number,
      source: s.source,
      settings: s.settings,
      raw_data: s.raw_data,
    }));
  }, [isSandbox, sessions, sandboxSessions, rankedSessions]);

  const highLabel = isSandbox ? "Sandbox best" : "All-time high";
  const totalLabel = isSandbox ? "Sandbox sessions" : "Total attempts";

  const highValue =
    allTimeHigh != null ? String(allTimeHigh) : "—";
  const averageValue =
    averageLast10 != null
      ? averageLast10 % 1 === 0
        ? String(Math.round(averageLast10))
        : averageLast10.toFixed(1)
      : "—";

  return (
    <>
      <header className="w-full">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
          Analytics
        </p>
        <div className="mt-4 flex w-full items-baseline justify-between gap-6">
          <div className="flex min-w-0 flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
              Dashboard
            </h1>
            {isSandbox && <span className={SANDBOX_MODE_TAG}>SANDBOX</span>}
          </div>
          <Link
            href="/play"
            className="shrink-0 font-mono text-xs tracking-wide text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
          >
            → Play
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={highLabel} value={highValue} />
        <StatCard label="Average score (last 10)" value={averageValue} />
        <StatCard label={totalLabel} value={String(totalAttempts)} />
      </div>

      {isSandbox ? (
        <SandboxBestGrid sandboxSessions={sandboxSessions} />
      ) : null}

      {isSandbox ? (
        <SandboxScoreTrendTabs sandboxSessions={sandboxSessions} />
      ) : null}

      <DashboardCharts
        lineData={lineData}
        barData={barData}
        showScoreTrend={!isSandbox}
      />

      <DashboardSessionList
        sessions={displaySessions}
        listSubtitle={
          isSandbox
            ? "All sessions shown · sandbox first"
            : `Last ${displaySessions.length} games`
        }
      />
    </>
  );
}
