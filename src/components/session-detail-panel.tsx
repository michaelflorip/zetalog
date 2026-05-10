"use client";

import SessionTimeChart, {
  sanitizeTimingPoints,
} from "@/components/session-time-chart";
import { operandComposition } from "@/lib/dashboard-aggregates";
import { useNarrowViewport } from "@/hooks/use-narrow-viewport";

const LABEL_MUTED =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const BAR_SHADES: Record<string, string> = {
  "+": "bg-black dark:bg-white",
  "−": "bg-neutral-600 dark:bg-neutral-400",
  "×": "bg-neutral-400 dark:bg-neutral-600",
  "÷": "bg-neutral-200 dark:bg-neutral-700",
};

interface SessionDetailPanelProps {
  rawData: unknown;
  chartHeight?: number;
}

export default function SessionDetailPanel({
  rawData,
  chartHeight = 220,
}: SessionDetailPanelProps) {
  const narrow = useNarrowViewport();
  const points = sanitizeTimingPoints(rawData);
  const composition = operandComposition(rawData);
  const chartVisualHeight = chartHeight + (narrow ? 56 : 0);

  if (points.length === 0 && composition.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No detail data available for this session.
      </p>
    );
  }

  return (
    <div
      className="touch-manipulation"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:gap-6">
        <div className="min-w-0 sm:w-[60%]">
          <p className={LABEL_MUTED}>Time per question</p>
          <SessionTimeChart
            points={points}
            height={chartVisualHeight}
            className="mt-4 w-full"
          />
        </div>

        {composition.length > 0 && (
          <div className="sm:w-[40%]">
            <p className={LABEL_MUTED}>Composition</p>

            <div className="mt-4 flex h-2 w-full overflow-hidden">
              {composition.map((entry) => (
                <div
                  key={entry.symbol}
                  className={`h-full ${BAR_SHADES[entry.symbol] ?? "bg-neutral-300 dark:bg-neutral-600"}`}
                  style={{ width: `${entry.percentage}%` }}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {composition.map((entry) => (
                <div
                  key={entry.symbol}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-2 w-2 shrink-0 ${BAR_SHADES[entry.symbol] ?? "bg-neutral-300 dark:bg-neutral-600"}`}
                    />
                    <span className="font-mono text-xs tracking-wide text-black dark:text-white">
                      {entry.symbol}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
