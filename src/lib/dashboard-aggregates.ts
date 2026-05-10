export type OperatorLabel =
  | "Addition"
  | "Subtraction"
  | "Multiplication"
  | "Division";

export const OPERATOR_ORDER: OperatorLabel[] = [
  "Addition",
  "Subtraction",
  "Multiplication",
  "Division",
];

export function operationFromQuestion(question: string): OperatorLabel | null {
  if (!question) return null;
  if (question.includes("÷")) return "Division";
  if (question.includes("×")) return "Multiplication";
  if (question.includes("−")) return "Subtraction";
  if (question.includes("+")) return "Addition";
  return null;
}

interface RawAttempt {
  question?: string;
  timeTakenMs?: number;
}

export function eventsFromRawData(raw: unknown): RawAttempt[] {
  if (Array.isArray(raw)) return raw as RawAttempt[];
  if (
    raw &&
    typeof raw === "object" &&
    "history" in raw &&
    Array.isArray((raw as { history: unknown }).history)
  ) {
    return (raw as { history: RawAttempt[] }).history;
  }
  return [];
}

export function averagesByOperator(
  sessionsWithRaw: { raw_data: unknown }[],
): { operator: OperatorLabel; avgMs: number | null }[] {
  const sums: Record<OperatorLabel, number> = {
    Addition: 0,
    Subtraction: 0,
    Multiplication: 0,
    Division: 0,
  };
  const counts: Record<OperatorLabel, number> = {
    Addition: 0,
    Subtraction: 0,
    Multiplication: 0,
    Division: 0,
  };

  for (const row of sessionsWithRaw) {
    for (const ev of eventsFromRawData(row.raw_data)) {
      if (typeof ev.timeTakenMs !== "number") continue;
      const op = ev.question ? operationFromQuestion(ev.question) : null;
      if (!op) continue;
      sums[op] += ev.timeTakenMs;
      counts[op] += 1;
    }
  }

  return OPERATOR_ORDER.map((operator) =>
    counts[operator] === 0
      ? { operator, avgMs: null }
      : { operator, avgMs: Math.round(sums[operator] / counts[operator]) },
  );
}
