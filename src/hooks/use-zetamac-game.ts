"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Operator = "+" | "-" | "×" | "÷";

export interface GameConfig {
  duration: number;
  operators: Operator[];
  ranges: {
    addition: { min1: number; max1: number; min2: number; max2: number };
    multiplication: { min1: number; max1: number; min2: number; max2: number };
  };
}

export const DEFAULT_CONFIG: GameConfig = {
  duration: 120,
  operators: ["+", "-", "×", "÷"],
  ranges: {
    addition: { min1: 2, max1: 100, min2: 2, max2: 100 },
    multiplication: { min1: 2, max1: 12, min2: 2, max2: 100 },
  },
};

const ALL_OPERATORS: Operator[] = ["+", "-", "×", "÷"];

interface HistoryEvent {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  timeTakenMs: number;
  isCorrect: boolean;
  timestamp: number;
}

interface Problem {
  question: string;
  answer: number;
}

type GameStatus = "idle" | "playing" | "finished";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveOperators(config: GameConfig): Operator[] {
  return config.operators.length > 0 ? config.operators : ALL_OPERATORS;
}

export function generateProblem(config: GameConfig): Problem {
  const ops = resolveOperators(config);
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const add = config.ranges.addition;
  const mul = config.ranges.multiplication;

  switch (op) {
    case "+": {
      const a = randInt(add.min1, add.max1);
      const b = randInt(add.min2, add.max2);
      return { question: `${a} + ${b}`, answer: a + b };
    }
    case "-": {
      const a = randInt(add.min1, add.max1);
      const b = randInt(add.min2, add.max2);
      return { question: `${a + b} − ${a}`, answer: b };
    }
    case "×": {
      const a = randInt(mul.min1, mul.max1);
      const b = randInt(mul.min2, mul.max2);
      return { question: `${a} × ${b}`, answer: a * b };
    }
    case "÷": {
      const a = randInt(mul.min1, mul.max1);
      const b = randInt(mul.min2, mul.max2);
      return { question: `${a * b} ÷ ${a}`, answer: b };
    }
  }
}

export function useZetamacGame(config: GameConfig = DEFAULT_CONFIG) {
  const configRef = useRef(config);
  configRef.current = config;

  const [status, setStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem>(() =>
    generateProblem(config),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const problemStartRef = useRef<number>(Date.now());
  const timerStartedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setStatus("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    if (status !== "idle") return;
    const cfg = configRef.current;
    setTimeLeft(cfg.duration);
    setCurrentProblem(generateProblem(cfg));
  }, [config, status]);

  const start = useCallback(() => {
    const cfg = configRef.current;
    clearTimer();
    timerStartedRef.current = false;
    setStatus("playing");
    setTimeLeft(cfg.duration);
    setScore(0);
    setHistory([]);
    const p = generateProblem(cfg);
    setCurrentProblem(p);
    problemStartRef.current = Date.now();
  }, [clearTimer]);

  const reset = useCallback(() => {
    const cfg = configRef.current;
    clearTimer();
    timerStartedRef.current = false;
    setStatus("idle");
    setTimeLeft(cfg.duration);
    setScore(0);
    setHistory([]);
    setCurrentProblem(generateProblem(cfg));
    problemStartRef.current = Date.now();
  }, [clearTimer]);

  const submitAnswer = useCallback(
    (input: string) => {
      if (status !== "playing") return;

      const parsed = Number(input);
      if (Number.isNaN(parsed)) return;

      if (!timerStartedRef.current) {
        startTimer();
      }

      const now = Date.now();
      const timeTakenMs = now - problemStartRef.current;
      const isCorrect = parsed === currentProblem.answer;

      const event: HistoryEvent = {
        question: currentProblem.question,
        userAnswer: parsed,
        correctAnswer: currentProblem.answer,
        timeTakenMs,
        isCorrect,
        timestamp: now,
      };

      setHistory((prev) => [...prev, event]);
      if (isCorrect) setScore((prev) => prev + 1);

      const next = generateProblem(configRef.current);
      setCurrentProblem(next);
      problemStartRef.current = Date.now();
    },
    [status, currentProblem, startTimer],
  );

  return {
    status,
    timeLeft,
    score,
    history,
    currentProblem,
    start,
    reset,
    submitAnswer,
  } as const;
}
