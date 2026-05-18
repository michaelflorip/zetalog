"use client";

import { useMemo, useState } from "react";
import type { DashboardSessionRecord } from "@/components/dashboard-client";
import { ScoreTrendCard, type LineDatum } from "@/components/score-trend-card";
import { formatSwissDate } from "@/lib/datetime";
import { formatDurationPreset, isSandboxSettings } from "@/lib/session-settings";

const DURATION_PRESETS = [15, 30, 60, 90, 120] as const;

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const TAB_BASE =
  "border border-black px-3 py-1 font-mono text-xs tracking-widest uppercase transition-colors duration-300 dark:border-white";

const TAB_ACTIVE =
  "bg-black text-white dark:bg-white dark:text-black";

const TAB_INACTIVE =
  "bg-transparent text-black hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10";

const EMPTY_STATE_CLASS =
  "py-12 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

function defaultDurationFromSessions(
  sandboxSessions: DashboardSessionRecord[],
): number {
  if (sandboxSessions.length === 0) return 15;

  const counts = new Map<number, number>(
    DURATION_PRESETS.map((d) => [d, 0]),
  );

  for (const session of sandboxSessions) {
    if (!isSandboxSettings(session.settings)) continue;
    const d = session.settings.duration_seconds;
    if ((DURATION_PRESETS as readonly number[]).includes(d)) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }

  let bestDuration: (typeof DURATION_PRESETS)[number] = 15;
  let bestCount = -1;
  for (const d of DURATION_PRESETS) {
    const count = counts.get(d) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestDuration = d;
    }
  }
  return bestDuration;
}

function tabButtonClass(active: boolean) {
  return [TAB_BASE, active ? TAB_ACTIVE : TAB_INACTIVE].join(" ");
}

interface SandboxScoreTrendTabsProps {
  sandboxSessions: DashboardSessionRecord[];
}

export function SandboxScoreTrendTabs({
  sandboxSessions,
}: SandboxScoreTrendTabsProps) {
  const initialDuration = useMemo(
    () => defaultDurationFromSessions(sandboxSessions),
    [sandboxSessions],
  );
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);

  const filteredSessions = useMemo(
    () =>
      sandboxSessions.filter(
        (s) =>
          isSandboxSettings(s.settings) &&
          s.settings.duration_seconds === selectedDuration,
      ),
    [sandboxSessions, selectedDuration],
  );

  const lineData: LineDatum[] = useMemo(() => {
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const chronological = [...filteredSessions].reverse();
    return chronological.map((s) => {
      const at = new Date(s.created_at);
      return {
        at: `${formatSwissDate(at)}, ${timeFmt.format(at)}`,
        score: s.score,
      };
    });
  }, [filteredSessions]);

  return (
    <section>
      <h2 className={SECTION_LABEL}>Score trend</h2>
      <div className="mt-4 rounded-sm border border-gray-200 p-6 dark:border-gray-800">
        <div className="mb-4 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((duration) => (
            <button
              key={duration}
              type="button"
              className={tabButtonClass(selectedDuration === duration)}
              onClick={() => setSelectedDuration(duration)}
            >
              {formatDurationPreset(duration)}
            </button>
          ))}
        </div>

        {lineData.length === 0 ? (
          <p className={EMPTY_STATE_CLASS}>No sessions at this duration</p>
        ) : (
          <ScoreTrendCard lineData={lineData} />
        )}
      </div>
    </section>
  );
}
