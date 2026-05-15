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

function XMonoTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) {
  if (x == null || y == null) return null;
  const v = payload?.value;
  return (
    <text
      x={x}
      y={y}
      dy={12}
      textAnchor="middle"
      className="fill-neutral-400 font-mono text-[10px] tabular-nums"
    >
      {v != null ? String(v) : ""}
    </text>
  );
}

function YMonoTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) {
  if (x == null || y == null) return null;
  const v = payload?.value;
  return (
    <text
      x={x}
      y={y}
      dx={-2}
      dy={3}
      textAnchor="end"
      className="fill-neutral-400 font-mono text-[10px] tabular-nums"
    >
      {v != null ? String(v) : ""}
    </text>
  );
}

function lineTooltipStyles(c: ChartThemeColors) {
  return {
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: "2px",
    fontSize: "12px",
    background: c.tooltipBg,
    color: c.tooltipFg,
  };
}

export interface LineDatum {
  at: string;
  score: number;
}

/** Score trend line chart (same rendering as ranked dashboard card). */
export function ScoreTrendCard({ lineData }: { lineData: LineDatum[] }) {
  const chart = useChartThemeColors();

  if (lineData.length === 0) {
    return null;
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={lineData}
          margin={{ top: 6, right: 4, left: 4, bottom: 4 }}
        >
          <XAxis
            dataKey="at"
            tick={<XMonoTick />}
            tickLine={false}
            axisLine={{ stroke: chart.axis }}
            interval="preserveStartEnd"
          />
          <YAxis
            width={32}
            tick={<YMonoTick />}
            tickLine={false}
            axisLine={{ stroke: chart.axis }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: chart.cursorStroke }}
            contentStyle={lineTooltipStyles(chart)}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={chart.stroke}
            strokeWidth={1}
            dot={{ fill: chart.stroke, strokeWidth: 0, r: 2.5 }}
            activeDot={{ r: 3.5, fill: chart.stroke }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
