"use client";

import { useEffect, useRef, useState } from "react";
import { useZetamacGame } from "@/hooks/use-zetamac-game";

const GAME_DURATION_S = 120;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayPage() {
  const {
    status,
    timeLeft,
    score,
    currentProblem,
    start,
    reset,
    submitAnswer,
  } = useZetamacGame();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "playing" || input === "") return;
    if (Number(input) === currentProblem.answer) {
      submitAnswer(input);
      setInput("");
    }
  }, [input, status, currentProblem.answer, submitAnswer]);

  useEffect(() => {
    if (status === "playing") {
      inputRef.current?.focus();
    }
  }, [status, currentProblem]);

  const progress = timeLeft / GAME_DURATION_S;

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-950">
            Zetalog
          </h1>
          <p className="text-base text-gray-500 tracking-wide">
            120 seconds. How fast can you go?
          </p>
          <button
            onClick={start}
            className="mt-4 px-10 py-3 text-sm font-medium tracking-widest uppercase bg-gray-950 text-white rounded-sm hover:bg-gray-800 transition-colors"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Game Over
          </p>
          <p className="text-8xl font-semibold tracking-tight text-gray-950 tabular-nums">
            {score}
          </p>
          <p className="text-sm text-gray-500">
            problems solved in 2 minutes
          </p>
          <button
            onClick={start}
            className="mt-6 px-10 py-3 text-sm font-medium tracking-widest uppercase bg-gray-950 text-white rounded-sm hover:bg-gray-800 transition-colors"
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-white font-sans select-none">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className="h-full bg-gray-950 transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Time
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-950 font-mono tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Score
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-950 font-mono tabular-nums">
            {score}
          </span>
        </div>
      </header>

      {/* Problem + Input */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-12">
        <p className="text-6xl sm:text-7xl font-semibold tracking-tight text-gray-950">
          {currentProblem.question}
        </p>

        <div className="mt-10 w-48">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={input}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setInput(v);
            }}
            className="w-full text-center text-4xl font-semibold tracking-tight text-gray-950 bg-transparent border-b-2 border-gray-300 focus:border-gray-950 outline-none pb-2 transition-colors font-mono tabular-nums placeholder:text-gray-300"
            placeholder="?"
          />
        </div>
      </main>
    </div>
  );
}
