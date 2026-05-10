"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

export interface ChartThemeColors {
  axis: string;
  stroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipFg: string;
  tooltipMuted: string;
  barMuted: string;
  cursorStroke: string;
  cursorFill: string;
}

const light: ChartThemeColors = {
  axis: "#a3a3a3",
  stroke: "#000000",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e5e5e5",
  tooltipFg: "#000000",
  tooltipMuted: "#737373",
  barMuted: "#e5e5e5",
  cursorStroke: "#a3a3a3",
  cursorFill: "#fafafa",
};

const dark: ChartThemeColors = {
  axis: "rgba(255,255,255,0.42)",
  stroke: "#ffffff",
  tooltipBg: "#000000",
  tooltipBorder: "rgba(255,255,255,0.2)",
  tooltipFg: "#ffffff",
  tooltipMuted: "rgba(255,255,255,0.55)",
  barMuted: "rgba(255,255,255,0.18)",
  cursorStroke: "rgba(255,255,255,0.35)",
  cursorFill: "rgba(255,255,255,0.06)",
};

export function useChartThemeColors(): ChartThemeColors {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return useMemo(() => {
    const isDark = mounted && resolvedTheme === "dark";
    return isDark ? dark : light;
  }, [mounted, resolvedTheme]);
}
