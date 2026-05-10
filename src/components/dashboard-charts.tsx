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

const axisStroke = "#a3a3a3";
const dataStroke = "#0a0a0a";

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

export default function DashboardCharts({
  lineData,
  barData,
}: DashboardChartsProps) {
  const barPrepared = barData.map((d) => ({
    ...d,
    avgMsDisplay: d.avgMs ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-gray-200 bg-white p-6 rounded-sm">
        <h2 className="text-xs font-medium tracking-widest uppercase text-gray-400">
          Score trend
        </h2>
        {lineData.length === 0 ? (
          <p className="mt-8 py-16 text-center text-sm text-gray-500">
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
                  tick={{ fontSize: 10, fill: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                  axisLine={{ stroke: axisStroke }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={36}
                  tick={{ fontSize: 10, fill: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                  axisLine={{ stroke: axisStroke }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: axisStroke }}
                  contentStyle={{
                    border: "1px solid #e5e5e5",
                    borderRadius: "2px",
                    fontSize: "12px",
                    background: "#fff",
                    color: "#0a0a0a",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={dataStroke}
                  strokeWidth={1.5}
                  dot={{ fill: dataStroke, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 4, fill: dataStroke }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="border border-gray-200 bg-white p-6 rounded-sm">
        <h2 className="text-xs font-medium tracking-widest uppercase text-gray-400">
          Avg. time by operation
        </h2>
        {barPrepared.every((d) => d.avgMs === null) ? (
          <p className="mt-8 py-16 text-center text-sm text-gray-500">
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
                  tick={{ fontSize: 10, fill: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                  axisLine={{ stroke: axisStroke }}
                />
                <YAxis
                  width={40}
                  tick={{ fontSize: 10, fill: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                  axisLine={{ stroke: axisStroke }}
                  tickFormatter={(v) => `${v}`}
                  label={{
                    value: "ms",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: axisStroke, fontSize: 10 },
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#fafafa" }}
                  contentStyle={{
                    border: "1px solid #e5e5e5",
                    borderRadius: "2px",
                    fontSize: "12px",
                    background: "#fff",
                    color: "#0a0a0a",
                  }}
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
                      fill={entry.avgMs == null ? "#e5e5e5" : dataStroke}
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
