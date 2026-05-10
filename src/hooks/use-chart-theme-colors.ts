"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

/** Matches Tailwind `gray-400` — readable on white and pure black backgrounds. */
const AXIS_GRAY = "#9ca3af";

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
  axis: AXIS_GRAY,
  stroke: "#000000",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e5e5e5",
  tooltipFg: "#000000",
  tooltipMuted: "#737373",
  barMuted: "#e5e5e5",
  cursorStroke: AXIS_GRAY,
  cursorFill: "#fafafa",
};

const dark: ChartThemeColors = {
  axis: AXIS_GRAY,
  stroke: "#ffffff",
  tooltipBg: "#000000",
  tooltipBorder: "rgba(255,255,255,0.22)",
  tooltipFg: "#ffffff",
  tooltipMuted: "rgba(255,255,255,0.55)",
  barMuted: "rgba(255,255,255,0.18)",
  cursorStroke: AXIS_GRAY,
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
