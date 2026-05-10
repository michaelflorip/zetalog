"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useZetamacGame } from "@/hooks/use-zetamac-game";
import { createClient } from "@/lib/supabase/client";
import SessionTimeChart from "@/components/session-time-chart";
import { localCalendarDayUtcIsoRange } from "@/lib/datetime";

const GAME_DURATION_S = 120;
const SESSION_SOURCE = "zetalog";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Dedupe Strict Mode dev double-invoke across remount (same logical game end). */
function sessionSaveStorageKey(historyTailTs: number, scoreVal: number) {
  return `zetalog_session_saved_${historyTailTs}_${scoreVal}`;
}

export default function PlayPage() {
  const {
    status,
    timeLeft,
    score,
    history,
    currentProblem,
    start,
    reset,
    submitAnswer,
  } = useZetamacGame();

  const [input, setInput] = useState("");
  const [todayAttemptNumber, setTodayAttemptNumber] = useState<number | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const saveAttemptedRef = useRef(false);

  useEffect(() => {
    if (status === "playing") {
      saveAttemptedRef.current = false;
      setTodayAttemptNumber(null);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "finished") return;

    async function saveSession() {
      const lastTs = history[history.length - 1]?.timestamp ?? 0;
      const dedupeKey = sessionSaveStorageKey(lastTs, score);
      if (typeof window !== "undefined") {
        if (window.sessionStorage.getItem(dedupeKey)) {
          console.log("[Play] Session save skipped (already persisted this round).");
          return;
        }
      }

      if (saveAttemptedRef.current) return;
      saveAttemptedRef.current = true;

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[Play] auth.getUser() error:", userError);
        saveAttemptedRef.current = false;
        return;
      }

      if (!user) {
        console.warn("[Play] No user session — skipping session insert.");
        saveAttemptedRef.current = false;
        return;
      }

      const { startIso, endIso } = localCalendarDayUtcIsoRange(new Date());
      const { count: todayCount, error: countError } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startIso)
        .lte("created_at", endIso);

      if (countError) {
        console.error("[Play] sessions count error (today local):");
        console.dir(countError, { depth: null });
        saveAttemptedRef.current = false;
        return;
      }

      const attempt_number = (todayCount ?? 0) + 1;
      setTodayAttemptNumber(attempt_number);

      const totalAttempts = history.length;
      const correctAttempts = history.filter((e) => e.isCorrect).length;
      const accuracy =
        totalAttempts === 0
          ? 0
          : Number(((correctAttempts / totalAttempts) * 100).toFixed(2));

      const row = {
        user_id: user.id,
        score,
        accuracy,
        duration_seconds: GAME_DURATION_S,
        attempt_number,
        source: SESSION_SOURCE,
        raw_data: { history },
      };

      const payload = [row];

      console.log("Attempting to save session...", row);
      console.log("[Play] Session insert payload (array passed to .insert):", payload);
      console.log(
        "[Play] Verifying insert user_id matches auth user id:",
        row.user_id === user.id,
        "| user_id:",
        row.user_id,
        "| auth.user.id:",
        user.id,
      );

      const { data: insertRows, error: insertError } = await supabase
        .from("sessions")
        .insert(payload)
        .select();

      if (insertError) {
        console.error("[Play] sessions insert failed.");
        console.dir(insertError, { depth: null });
        setTodayAttemptNumber(null);
        saveAttemptedRef.current = false;
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(dedupeKey, "1");
      }
      console.log("[Play] Session saved successfully.", insertRows);
    }

    saveSession();
  }, [status, score, history]);

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
    const timingPoints = history.map((h) => ({
      question: h.question,
      timeTakenMs: h.timeTakenMs,
    }));

    return (
      <div className="flex min-h-screen flex-col items-center bg-white px-6 py-12 font-sans">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
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
            {todayAttemptNumber != null && (
              <p className="text-center text-sm font-medium tracking-tight text-gray-950">
                Session Complete — Attempt #{todayAttemptNumber} today
              </p>
            )}
          </div>

          <div className="w-full border border-gray-200 bg-white px-5 py-6 rounded-sm">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Time per question
            </p>
            <SessionTimeChart
              points={timingPoints}
              height={260}
              className="mt-4 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex px-10 py-3 text-sm font-medium tracking-widest uppercase border border-gray-950 bg-white text-gray-950 rounded-sm transition-colors hover:bg-gray-50"
            >
              View Dashboard
            </Link>
            <button
              onClick={start}
              type="button"
              className="px-10 py-3 text-sm font-medium tracking-widest uppercase bg-gray-950 text-white rounded-sm transition-colors hover:bg-gray-800"
            >
              Restart
            </button>
          </div>
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
