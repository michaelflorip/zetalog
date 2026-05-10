"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisMuted = "#a3a3a3";
const lineColor = "#0a0a0a";

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
}

function TimingTooltip({ active, payload }: TimingTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="border border-gray-200 bg-white px-3 py-2 rounded-sm text-left shadow-none">
      <p className="text-xs font-semibold tracking-tight text-gray-950">
        {row.question}
      </p>
      <p className="mt-1 font-mono text-[11px] tabular-nums text-gray-500">
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
  if (points.length === 0) {
    return (
      <p className={`text-center text-sm text-gray-500 ${className ?? ""}`}>
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
            tick={{ fontSize: 10, fill: axisMuted }}
            tickLine={false}
            axisLine={{ stroke: axisMuted }}
            interval={points.length <= 24 ? "preserveEnd" : 2}
          />
          <YAxis
            width={40}
            dataKey="secs"
            tick={{ fontSize: 10, fill: axisMuted }}
            tickLine={false}
            axisLine={{ stroke: axisMuted }}
            tickFormatter={(v) => `${Number(v).toFixed(0)}s`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<TimingTooltip />}
            cursor={{ stroke: axisMuted, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="secs"
            stroke={lineColor}
            strokeWidth={1}
            dot={{ fill: lineColor, strokeWidth: 0, r: 2.5 }}
            activeDot={{ r: 4, fill: lineColor }}
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
