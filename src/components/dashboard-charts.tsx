"use client";

import {
  Bar,
  BarChart,
  Cell,
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

export interface LineDatum {
  at: string;
  score: number;
}

export interface BarDatum {
  operator: string;
  avgMs: number | null;
}

interface DashboardChartsProps {
  lineData: LineDatum[];
  barData: BarDatum[];
  /** When false, omits the score trend card (ranked line chart unchanged internally). */
  showScoreTrend?: boolean;
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

export default function DashboardCharts({
  lineData,
  barData,
  showScoreTrend = true,
}: DashboardChartsProps) {
  const chart = useChartThemeColors();

  const barPrepared = barData.map((d) => ({
    ...d,
    avgMsDisplay: d.avgMs ?? 0,
  }));

  const cardClass =
    "rounded-sm border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black";

  const mutedBody = "text-neutral-500 dark:text-neutral-400";
  const sectionLabel =
    "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

  return (
    <div className="flex flex-col gap-4">
      {showScoreTrend && (
      <div className={cardClass}>
        <h2 className={sectionLabel}>Score trend</h2>
        {lineData.length === 0 ? (
          <p className={`mt-6 py-10 text-center text-sm ${mutedBody}`}>
            No sessions in this window yet.
          </p>
        ) : (
          <div className="mt-4 h-[200px] w-full">
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
        )}
      </div>
      )}

      <div className={cardClass}>
        <h2 className={sectionLabel}>Time by operation</h2>
        {barPrepared.every((d) => d.avgMs === null) ? (
          <p className={`mt-6 py-10 text-center text-sm ${mutedBody}`}>
            No breakdown data yet. Sessions need recorded attempts in raw
            data.
          </p>
        ) : (
          <div className="mt-4 h-[188px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barPrepared}
                margin={{ top: 6, right: 4, left: 2, bottom: 4 }}
              >
                <XAxis
                  dataKey="operator"
                  tick={<XMonoTick />}
                  tickLine={false}
                  axisLine={{ stroke: chart.axis }}
                  interval={0}
                />
                <YAxis
                  width={36}
                  tick={<YMonoTick />}
                  tickLine={false}
                  axisLine={{ stroke: chart.axis }}
                  tickFormatter={(v) => `${v}`}
                  label={{
                    value: "ms",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: chart.axis,
                      fontSize: 10,
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                    },
                  }}
                />
                <Tooltip
                  cursor={{ fill: chart.cursorFill }}
                  contentStyle={lineTooltipStyles(chart)}
                  formatter={(_v, _n, item) => {
                    const ms = item?.payload?.avgMs as number | null | undefined;
                    return [
                      ms == null ? "—" : `${ms} ms`,
                      "Average",
                    ];
                  }}
                />
                <Bar
                  dataKey="avgMsDisplay"
                  radius={[1, 1, 0, 0]}
                  maxBarSize={40}
                >
                  {barPrepared.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgMs == null ? chart.barMuted : chart.stroke}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
