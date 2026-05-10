"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartThemeColors } from "@/hooks/use-chart-theme-colors";
import { useChartThemeColors } from "@/hooks/use-chart-theme-colors";

export type SessionTimingPoint = {
  question: string;
  timeTakenMs: number;
};

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function buildChartData(points: SessionTimingPoint[]) {
  return points.map((p, i) => ({
    ix: String(i + 1),
    question: p.question,
    timeTakenMs: p.timeTakenMs,
    secs: p.timeTakenMs / 1000,
  }));
}

type TooltipPayloadRow = {
  ix: string;
  question: string;
  timeTakenMs: number;
  secs: number;
};

interface TimingTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: TooltipPayloadRow }>;
  palette: ChartThemeColors;
}

function TimingTooltip({ active, payload, palette }: TimingTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-sm text-left shadow-none"
      style={{
        border: `1px solid ${palette.tooltipBorder}`,
        background: palette.tooltipBg,
      }}
    >
      <p
        className="text-xs font-semibold tracking-tight"
        style={{ color: palette.tooltipFg }}
      >
        {row.question}
      </p>
      <p
        className="mt-1 font-mono text-[11px] tabular-nums"
        style={{ color: palette.tooltipMuted }}
      >
        {formatSeconds(row.timeTakenMs)}
      </p>
    </div>
  );
}

export interface SessionTimeChartProps {
  points: SessionTimingPoint[];
  /** Fixed height area for ResponsiveContainer */
  height?: number;
  className?: string;
}

/** Line chart of response time per question (Swiss: thin stroke, no grid). */
export default function SessionTimeChart({
  points,
  height = 240,
  className,
}: SessionTimeChartProps) {
  const chart = useChartThemeColors();

  if (points.length === 0) {
    return (
      <p
        className={`text-center text-sm text-foreground/50 ${className ?? ""}`}
      >
        No timed attempts in this session.
      </p>
    );
  }

  const data = buildChartData(points);

  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: -4, bottom: 0 }}
        >
          <XAxis
            dataKey="ix"
            tick={{ fontSize: 10, fill: chart.axis }}
            tickLine={false}
            axisLine={{ stroke: chart.axis }}
            interval={points.length <= 24 ? "preserveEnd" : 2}
          />
          <YAxis
            width={40}
            dataKey="secs"
            tick={{ fontSize: 10, fill: chart.axis }}
            tickLine={false}
            axisLine={{ stroke: chart.axis }}
            tickFormatter={(v) => `${Number(v).toFixed(0)}s`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={(props) => (
              <TimingTooltip
                {...(props as Omit<TimingTooltipProps, "palette">)}
                palette={chart}
              />
            )}
            cursor={{
              stroke: chart.cursorStroke,
              strokeWidth: 1,
            }}
          />
          <Line
            type="monotone"
            dataKey="secs"
            stroke={chart.stroke}
            strokeWidth={1}
            dot={{ fill: chart.stroke, strokeWidth: 0, r: 2.5 }}
            activeDot={{ r: 4, fill: chart.stroke }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function sanitizeTimingPoints(raw: unknown): SessionTimingPoint[] {
  const fromHistory = (hist: unknown) => {
    if (!Array.isArray(hist)) return [];
    return hist
      .map((entry) => {
        if (
          entry &&
          typeof entry === "object" &&
          "timeTakenMs" in entry &&
          typeof (entry as { timeTakenMs: unknown }).timeTakenMs ===
            "number" &&
          "question" in entry &&
          typeof (entry as { question: unknown }).question === "string"
        ) {
          return {
            question: (entry as { question: string }).question,
            timeTakenMs: (entry as { timeTakenMs: number }).timeTakenMs,
          };
        }
        return null;
      })
      .filter((x): x is SessionTimingPoint => x !== null);
  };

  if (Array.isArray(raw)) return fromHistory(raw);
  if (
    raw &&
    typeof raw === "object" &&
    "history" in raw &&
    Array.isArray((raw as { history: unknown }).history)
  ) {
    return fromHistory((raw as { history: unknown }).history);
  }
  return [];
}
