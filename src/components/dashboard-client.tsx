"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import DashboardCharts from "@/components/dashboard-charts";
import DashboardSessionList, {
  type DashboardSessionRow,
} from "@/components/dashboard-session-list";
import { SandboxBestGrid } from "@/components/sandbox-best-grid";
import { SandboxScoreTrendTabs } from "@/components/sandbox-score-trend-tabs";
import { useSandboxMode } from "@/hooks/use-sandbox-mode";
import { averagesByOperator } from "@/lib/dashboard-aggregates";
import {
  formatSwissDate,
  localCalendarDayUtcIsoRange,
  localCalendarMonthUtcIsoRange,
} from "@/lib/datetime";

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

function formatAverageScore(value: number | null): string {
  if (value == null) return "—";
  return value % 1 === 0
    ? String(Math.round(value))
    : value.toFixed(1);
}

function StatCard({
  label,
  value,
  boldMono = false,
}: {
  label: string;
  value: string;
  boldMono?: boolean;
}) {
  const isEmpty = value === "—";

  return (
    <div className="rounded-sm border border-gray-200 bg-white px-4 py-4 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p
        className={
          boldMono
            ? "mt-3 font-mono text-2xl font-bold tabular-nums text-black transition-colors duration-300 dark:text-white"
            : isEmpty
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

  const averageLast10 = useMemo(() => {
    const last10 = activeSessions.slice(0, 10);
    if (last10.length === 0) return null;
    return (
      Math.round(
        (last10.reduce((acc, s) => acc + s.score, 0) / last10.length) * 10,
      ) / 10
    );
  }, [activeSessions]);

  const averageThisMonth = useMemo(() => {
    const { startIso } = localCalendarMonthUtcIsoRange();
    const startMs = new Date(startIso).getTime();
    const nowMs = Date.now();
    const monthSessions = rankedSessions.filter((s) => {
      const ms = new Date(s.created_at).getTime();
      return ms >= startMs && ms <= nowMs;
    });
    if (monthSessions.length === 0) return null;
    return (
      Math.round(
        (monthSessions.reduce((acc, s) => acc + s.score, 0) /
          monthSessions.length) *
          10,
      ) / 10
    );
  }, [rankedSessions]);

  const sandboxSessionsToday = useMemo(() => {
    const { startIso, endIso } = localCalendarDayUtcIsoRange();
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    return sandboxSessions.filter((s) => {
      const ms = new Date(s.created_at).getTime();
      return ms >= startMs && ms <= endMs;
    }).length;
  }, [sandboxSessions]);

  const sandboxSessionsThisMonth = useMemo(() => {
    const { startIso } = localCalendarMonthUtcIsoRange();
    const startMs = new Date(startIso).getTime();
    const nowMs = Date.now();
    return sandboxSessions.filter((s) => {
      const ms = new Date(s.created_at).getTime();
      return ms >= startMs && ms <= nowMs;
    }).length;
  }, [sandboxSessions]);

  const lineData = useMemo(() => {
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const chronological = [...activeSessions].reverse();
    return chronological.map((s) => {
      const at = new Date(s.created_at);
      return {
        at: `${formatSwissDate(at)}, ${timeFmt.format(at)}`,
        score: s.score,
      };
    });
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

  const rankedHighValue = rankedAllTimeHigh != null ? String(rankedAllTimeHigh) : "—";
  const sandboxBestValue = allTimeHigh != null ? String(allTimeHigh) : "—";
  const averageValue = formatAverageScore(averageLast10);
  const averageMonthValue = formatAverageScore(averageThisMonth);

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

      {isSandbox ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Sandbox best" value={sandboxBestValue} boldMono />
          <StatCard
            label="Sessions today"
            value={String(sandboxSessionsToday)}
            boldMono
          />
          <StatCard
            label="Sessions this month"
            value={String(sandboxSessionsThisMonth)}
            boldMono
          />
          <StatCard
            label="Total sessions"
            value={String(sandboxSessions.length)}
            boldMono
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="All-time high" value={rankedHighValue} />
          <StatCard
            label="Average score (this month)"
            value={averageMonthValue}
          />
          <StatCard label="Average score (last 10)" value={averageValue} />
          <StatCard label="Total attempts" value={String(rankedTotalAttempts)} />
        </div>
      )}

      {!isSandbox && (
        <p className="mt-2 mb-6 text-xs text-neutral-400 dark:text-neutral-500">
          Stats and charts reflect ranked sessions only. Sandbox sessions are
          excluded.
        </p>
      )}

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

      <ActivityHeatmap
        sessions={isSandbox ? sandboxSessions : rankedSessions}
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
