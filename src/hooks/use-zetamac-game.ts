"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Operation = "+" | "−" | "×" | "÷";

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

const GAME_DURATION_S = 120;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(): Problem {
  const ops: Operation[] = ["+", "−", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number;
  let b: number;
  let answer: number;
  let question: string;

  switch (op) {
    case "+": {
      a = randInt(2, 100);
      b = randInt(2, 100);
      answer = a + b;
      question = `${a} + ${b}`;
      break;
    }
    case "−": {
      a = randInt(2, 100);
      b = randInt(2, 100);
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} − ${b}`;
      break;
    }
    case "×": {
      a = randInt(2, 12);
      b = randInt(2, 12);
      answer = a * b;
      question = `${a} × ${b}`;
      break;
    }
    case "÷": {
      a = randInt(2, 12);
      b = randInt(2, 12);
      const product = a * b;
      answer = b;
      question = `${product} ÷ ${a}`;
      break;
    }
  }

  return { question: question!, answer: answer! };
}

export function useZetamacGame() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem>(
    generateProblem,
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

  const start = useCallback(() => {
    clearTimer();
    timerStartedRef.current = false;
    setStatus("playing");
    setTimeLeft(GAME_DURATION_S);
    setScore(0);
    setHistory([]);
    const p = generateProblem();
    setCurrentProblem(p);
    problemStartRef.current = Date.now();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    timerStartedRef.current = false;
    setStatus("idle");
    setTimeLeft(GAME_DURATION_S);
    setScore(0);
    setHistory([]);
    setCurrentProblem(generateProblem());
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

      const next = generateProblem();
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
