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
}: DashboardChartsProps) {
  const chart = useChartThemeColors();

  const barPrepared = barData.map((d) => ({
    ...d,
    avgMsDisplay: d.avgMs ?? 0,
  }));

  const cardClass =
    "border border-black/10 bg-background p-6 rounded-sm dark:border-white/15";

  const mutedBody = "text-foreground/50";

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="text-xs font-medium tracking-widest uppercase text-foreground/45">
          Score trend
        </h2>
        {lineData.length === 0 ? (
          <p className={`mt-8 py-16 text-center text-sm ${mutedBody}`}>
            No sessions in this window yet.
          </p>
        ) : (
          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <XAxis
                  dataKey="at"
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickLine={{ stroke: chart.axis }}
                  axisLine={{ stroke: chart.axis }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={36}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickLine={{ stroke: chart.axis }}
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
                  strokeWidth={1.5}
                  dot={{ fill: chart.stroke, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 4, fill: chart.stroke }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="text-xs font-medium tracking-widest uppercase text-foreground/45">
          Avg. time by operation
        </h2>
        {barPrepared.every((d) => d.avgMs === null) ? (
          <p className={`mt-8 py-16 text-center text-sm ${mutedBody}`}>
            No breakdown data yet. Sessions need recorded attempts in raw
            data.
          </p>
        ) : (
          <div className="mt-6 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barPrepared}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <XAxis
                  dataKey="operator"
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickLine={{ stroke: chart.axis }}
                  axisLine={{ stroke: chart.axis }}
                />
                <YAxis
                  width={40}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickLine={{ stroke: chart.axis }}
                  axisLine={{ stroke: chart.axis }}
                  tickFormatter={(v) => `${v}`}
                  label={{
                    value: "ms",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: chart.axis, fontSize: 10 },
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
                  radius={[2, 2, 0, 0]}
                  maxBarSize={52}
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
