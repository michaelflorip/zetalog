"use client";

import { useMemo } from "react";
import {
  formatDurationPreset,
  isSandboxSettings,
} from "@/lib/session-settings";
const DURATION_PRESETS = [15, 30, 60, 90, 120] as const;

interface SandboxSessionForGrid {
  score: number;
  settings: unknown;
}

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const DURATION_LABEL_CLASS =
  "mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const SCORE_CLASS =
  "font-mono text-2xl font-bold tabular-nums text-black dark:text-white";

const SCORE_EMPTY_CLASS =
  "font-mono text-2xl font-bold tabular-nums text-neutral-300 dark:text-neutral-700";

interface SandboxBestGridProps {
  sandboxSessions: SandboxSessionForGrid[];
}

export function SandboxBestGrid({ sandboxSessions }: SandboxBestGridProps) {
  const bests = useMemo(() => {
    return DURATION_PRESETS.map((duration) => {
      const matching = sandboxSessions.filter((s) => {
        if (!isSandboxSettings(s.settings)) return false;
        return s.settings.duration_seconds === duration;
      });
      if (matching.length === 0) return null;
      return Math.max(...matching.map((s) => s.score));
    });
  }, [sandboxSessions]);

  return (
    <section>
      <h2 className={SECTION_LABEL}>Sandbox best</h2>
      <div className="mt-4 rounded-sm border border-gray-200 p-6 dark:border-gray-800">
        <div className="grid grid-cols-5 divide-x divide-gray-200 dark:divide-gray-800">
          {DURATION_PRESETS.map((duration, index) => {
            const best = bests[index];
            return (
              <div
                key={duration}
                className="flex flex-col items-center px-2 first:pl-0 last:pr-0"
              >
                <span className={DURATION_LABEL_CLASS}>
                  {formatDurationPreset(duration)}
                </span>
                <span className={best == null ? SCORE_EMPTY_CLASS : SCORE_CLASS}>
                  {best == null ? "—" : best}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
