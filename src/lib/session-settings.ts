import type { GameConfig, Operator } from "@/hooks/use-zetamac-game";

const OPERATOR_DISPLAY: Record<Operator, string> = {
  "+": "+",
  "-": "−",
  "×": "×",
  "÷": "÷",
};

const OPERATOR_ORDER: Operator[] = ["+", "-", "×", "÷"];

interface HistoryLike {
  isCorrect: boolean;
}

export interface SandboxSettingsPayload {
  mode: "sandbox";
  duration_seconds: number;
  operators: Operator[];
  ranges: GameConfig["ranges"];
}

export type ConfigSummary = [string, string, string];

export function computeAccuracy(
  history: ReadonlyArray<HistoryLike>,
): number {
  const totalAttempts = history.length;
  if (totalAttempts === 0) return 0;
  const correctAttempts = history.filter((e) => e.isCorrect).length;
  return Number(((correctAttempts / totalAttempts) * 100).toFixed(2));
}

export function formatDurationPreset(seconds: number): string {
  if (seconds === 120) return "2:00";
  return `${seconds}S`;
}

function formatOperators(operators: Operator[]): string {
  return OPERATOR_ORDER.filter((op) => operators.includes(op))
    .map((op) => OPERATOR_DISPLAY[op])
    .join(" ");
}

function normalizeConfig(
  config: GameConfig | SandboxSettingsPayload,
): { durationSeconds: number; operators: Operator[]; ranges: GameConfig["ranges"] } {
  return {
    durationSeconds:
      "duration" in config ? config.duration : config.duration_seconds,
    operators: config.operators,
    ranges: config.ranges,
  };
}

export function formatSandboxConfigSummary(
  config: GameConfig | SandboxSettingsPayload,
): ConfigSummary {
  const { durationSeconds, operators, ranges } = normalizeConfig(config);
  const durationLabel = formatDurationPreset(durationSeconds);
  const line1 = `${durationLabel}  ·  ${formatOperators(operators)}`;

  const line2Parts: string[] = [];
  if (operators.includes("+")) {
    const { min1, max1, min2, max2 } = ranges.addition;
    line2Parts.push(`ADD ${min1}–${max1} + ${min2}–${max2}`);
  }
  if (operators.includes("×")) {
    const { min1, max1, min2, max2 } = ranges.multiplication;
    line2Parts.push(`MULT ${min1}–${max1} × ${min2}–${max2}`);
  }

  const line3Parts: string[] = [];
  if (operators.includes("-")) {
    const { min1, max1, min2, max2 } = ranges.addition;
    line3Parts.push(
      `SUB ${min1 + min2}–${max1 + max2} − ${min2}–${max2}`,
    );
  }
  if (operators.includes("÷")) {
    const { min1, max1, min2, max2 } = ranges.multiplication;
    line3Parts.push(
      `DIV ${min1 * min2}–${max1 * max2} ÷ ${min2}–${max2}`,
    );
  }

  return [line1, line2Parts.join("  ·  "), line3Parts.join(" · ")];
}

export function buildSandboxSettingsPayload(
  config: GameConfig,
): SandboxSettingsPayload {
  return {
    mode: "sandbox",
    duration_seconds: config.duration,
    operators: config.operators,
    ranges: {
      addition: { ...config.ranges.addition },
      multiplication: { ...config.ranges.multiplication },
    },
  };
}

export function isSandboxSettings(
  settings: unknown,
): settings is SandboxSettingsPayload {
  return (
    settings != null &&
    typeof settings === "object" &&
    "mode" in settings &&
    (settings as { mode: unknown }).mode === "sandbox"
  );
}
