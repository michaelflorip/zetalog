"use client";

import type { GameConfig, Operator } from "@/hooks/use-zetamac-game";

const SECTION_LABEL =
  "mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const BTN_BASE =
  "border border-black px-3 py-1 font-mono text-xs tracking-widest uppercase transition-colors duration-300 dark:border-white";

const BTN_ACTIVE =
  "bg-black text-white dark:bg-white dark:text-black";

const BTN_INACTIVE =
  "bg-transparent text-black hover:bg-neutral-50 dark:text-white dark:hover:bg-white/10";

const RANGE_INPUT =
  "w-16 border-0 border-b border-black bg-transparent text-right font-mono text-sm tabular-nums outline-none transition-colors duration-300 focus:border-black dark:border-white dark:text-white";

const DURATION_PRESETS = [
  { label: "15S", seconds: 15 },
  { label: "30S", seconds: 30 },
  { label: "60S", seconds: 60 },
  { label: "90S", seconds: 90 },
  { label: "2:00", seconds: 120 },
] as const;

const OPERATOR_BUTTONS: { op: Operator; label: string }[] = [
  { op: "+", label: "+" },
  { op: "-", label: "−" },
  { op: "×", label: "×" },
  { op: "÷", label: "÷" },
];

export interface SandboxConfigProps {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}

function presetButtonClass(active: boolean) {
  return [BTN_BASE, active ? BTN_ACTIVE : BTN_INACTIVE].join(" ");
}

function clampPair(
  min: number,
  max: number,
  floor: number,
  ceiling: number,
): { min: number; max: number } {
  let lo = Math.max(floor, Math.min(ceiling, min));
  let hi = Math.max(floor, Math.min(ceiling, max));
  if (lo > hi) {
    const tmp = lo;
    lo = hi;
    hi = tmp;
  }
  return { min: lo, max: hi };
}

function RangeFieldRow({
  label,
  min,
  max,
  onBlurMin,
  onBlurMax,
}: {
  label: string;
  min: number;
  max: number;
  onBlurMin: (value: number) => void;
  onBlurMax: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          defaultValue={min}
          key={`${label}-min-${min}`}
          className={RANGE_INPUT}
          onBlur={(e) => onBlurMin(Number(e.target.value))}
        />
        <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
          –
        </span>
        <input
          type="number"
          defaultValue={max}
          key={`${label}-max-${max}`}
          className={RANGE_INPUT}
          onBlur={(e) => onBlurMax(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function OperationRanges({
  title,
  range,
  onBlur,
}: {
  title: string;
  range: { min1: number; max1: number; min2: number; max2: number };
  onBlur: (field: "min1" | "max1" | "min2" | "max2", value: number) => void;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-black dark:text-white">
        {title}
      </p>
      <div className="space-y-3">
        <RangeFieldRow
          label="FIRST NUMBER"
          min={range.min1}
          max={range.max1}
          onBlurMin={(v) => onBlur("min1", v)}
          onBlurMax={(v) => onBlur("max1", v)}
        />
        <RangeFieldRow
          label="SECOND NUMBER"
          min={range.min2}
          max={range.max2}
          onBlurMin={(v) => onBlur("min2", v)}
          onBlurMax={(v) => onBlur("max2", v)}
        />
      </div>
    </div>
  );
}

export function SandboxConfig({ config, onChange }: SandboxConfigProps) {
  function setDuration(seconds: number) {
    onChange({ ...config, duration: seconds });
  }

  function toggleOperator(op: Operator) {
    const active = config.operators.includes(op);
    if (active && config.operators.length <= 1) return;
    const operators = active
      ? config.operators.filter((o) => o !== op)
      : [...config.operators, op];
    onChange({ ...config, operators });
  }

  function blurAddition(field: "min1" | "max1" | "min2" | "max2", raw: number) {
    const next = {
      ...config.ranges.addition,
      [field]: Number.isFinite(raw) ? raw : 2,
    };
    const row1 = clampPair(next.min1, next.max1, 2, 100);
    const row2 = clampPair(next.min2, next.max2, 2, 100);
    onChange({
      ...config,
      ranges: {
        ...config.ranges,
        addition: {
          min1: row1.min,
          max1: row1.max,
          min2: row2.min,
          max2: row2.max,
        },
      },
    });
  }

  function blurMultiplication(
    field: "min1" | "max1" | "min2" | "max2",
    raw: number,
  ) {
    const next = {
      ...config.ranges.multiplication,
      [field]: Number.isFinite(raw) ? raw : 2,
    };
    const row1 = clampPair(next.min1, next.max1, 2, 100);
    const row2 = clampPair(next.min2, next.max2, 2, 100);
    onChange({
      ...config,
      ranges: {
        ...config.ranges,
        multiplication: {
          min1: row1.min,
          max1: row1.max,
          min2: row2.min,
          max2: row2.max,
        },
      },
    });
  }

  return (
    <div
      className="mx-auto w-full max-w-lg rounded-sm border border-gray-200 p-6 dark:border-gray-800"
      aria-label="Sandbox configuration"
    >
      <div className="space-y-6">
        <section>
          <p className={SECTION_LABEL}>Duration</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map(({ label, seconds }) => (
              <button
                key={seconds}
                type="button"
                className={presetButtonClass(config.duration === seconds)}
                onClick={() => setDuration(seconds)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className={SECTION_LABEL}>Operators</p>
          <div className="flex flex-wrap gap-2">
            {OPERATOR_BUTTONS.map(({ op, label }) => (
              <button
                key={op}
                type="button"
                className={presetButtonClass(config.operators.includes(op))}
                onClick={() => toggleOperator(op)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className={SECTION_LABEL}>Ranges</p>
          <div className="grid grid-cols-2 gap-6">
            <OperationRanges
              title="Addition"
              range={config.ranges.addition}
              onBlur={blurAddition}
            />
            <OperationRanges
              title="Multiplication"
              range={config.ranges.multiplication}
              onBlur={blurMultiplication}
            />
          </div>
          <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Subtraction and division use inverted ranges.
          </p>
        </section>
      </div>
    </div>
  );
}
