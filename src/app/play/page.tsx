"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SessionTimeChart from "@/components/session-time-chart";
import { useZetamacGame } from "@/hooks/use-zetamac-game";
import { localCalendarDayUtcIsoRange } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/client";

const GAME_DURATION_S = 120;
const SESSION_SOURCE = "zetalog";

const PRIMARY_BTN_PLAY =
  "px-10 py-3 text-sm font-medium tracking-widest uppercase rounded-sm transition-colors duration-300 bg-black text-white hover:opacity-90 dark:bg-white dark:text-black";

const OUTLINE_BTN_PLAY =
  "inline-flex px-10 py-3 text-sm font-medium tracking-widest uppercase rounded-sm transition-colors duration-300 border border-black bg-white text-black hover:bg-neutral-50 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/10";

const LABEL_MUTED =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const INPUT_UNDERLINE_PLAY =
  "w-full bg-transparent pb-2 text-center text-4xl font-semibold tracking-tight font-mono tabular-nums outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500 transition-colors duration-300 border-b-2 border-neutral-400 focus:border-black dark:border-white/35 dark:focus:border-white text-black";

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-white font-sans transition-colors duration-300 dark:bg-black">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-5xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
            Zetalog
          </h1>
          <p className="text-base tracking-wide text-neutral-500 dark:text-neutral-400">
            120 seconds. How fast can you go?
          </p>
          <button onClick={start} type="button" className={`mt-4 ${PRIMARY_BTN_PLAY}`}>
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
      <div className="flex min-h-screen flex-col items-center bg-white px-6 py-12 font-sans transition-colors duration-300 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6">
            <p className={LABEL_MUTED}>Game Over</p>
            <p className="text-8xl font-semibold tracking-tight text-black tabular-nums transition-colors duration-300 dark:text-white">
              {score}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              problems solved in 2 minutes
            </p>
            {todayAttemptNumber != null && (
              <p className="text-center text-sm font-medium tracking-tight text-black transition-colors duration-300 dark:text-white">
                Session Complete — Attempt #{todayAttemptNumber} today
              </p>
            )}
          </div>

          <div className="w-full rounded-sm border border-gray-200 bg-white px-5 py-6 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
            <p className={LABEL_MUTED}>Time per question</p>
            <SessionTimeChart
              points={timingPoints}
              height={260}
              className="mt-4 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className={OUTLINE_BTN_PLAY}>
              View Dashboard
            </Link>
            <button onClick={start} type="button" className={PRIMARY_BTN_PLAY}>
              Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white font-sans select-none transition-colors duration-300 dark:bg-black">
      <div className="fixed left-0 right-0 top-0 h-1 bg-neutral-200 transition-colors duration-300 dark:bg-neutral-800">
        <div
          className="h-full bg-black transition-[width] duration-1000 ease-linear dark:bg-white"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <header className="flex items-center justify-between px-8 pb-4 pt-8">
        <div className="flex items-baseline gap-1.5">
          <span className={LABEL_MUTED}>Time</span>
          <span className="font-mono text-lg font-semibold tabular-nums tracking-tight text-black transition-colors duration-300 dark:text-white">
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={LABEL_MUTED}>Score</span>
          <span className="font-mono text-lg font-semibold tabular-nums tracking-tight text-black transition-colors duration-300 dark:text-white">
            {score}
          </span>
        </div>
      </header>

      <main className="-mt-12 flex flex-1 flex-col items-center justify-center">
        <p className="text-6xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white sm:text-7xl">
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
            className={INPUT_UNDERLINE_PLAY}
            placeholder="?"
          />
        </div>
      </main>
    </div>
  );
}
