"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SandboxConfig } from "@/components/sandbox-config";
import { SandboxConfigSummaryLines } from "@/components/sandbox-config-summary";
import SessionDetailPanel from "@/components/session-detail-panel";
import { useSandboxMode } from "@/hooks/use-sandbox-mode";
import {
  DEFAULT_CONFIG,
  useZetamacGame,
  type GameConfig,
} from "@/hooks/use-zetamac-game";
import { localCalendarDayUtcIsoRange } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/client";
import {
  buildSandboxSettingsPayload,
  computeAccuracy,
  formatSandboxConfigSummary,
} from "@/lib/session-settings";

const GAME_DURATION_S = 120;
const SESSION_SOURCE = "zetavant";

const PRIMARY_BTN_PLAY =
  "px-10 py-3 text-sm font-medium tracking-widest uppercase rounded-sm transition-colors duration-300 bg-black text-white hover:opacity-90 dark:bg-white dark:text-black";

const OUTLINE_BTN_PLAY =
  "inline-flex px-10 py-3 text-sm font-medium tracking-widest uppercase rounded-sm transition-colors duration-300 border border-black bg-white text-black hover:bg-neutral-50 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/10";

const LABEL_MUTED =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const SANDBOX_STATUS_LABEL =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

/** Document-flow sandbox banner (py-2 + one line) — extra top space on /play only. */
const PLAY_SANDBOX_TOP_PADDING = "pt-8";

function playPageShellClass(isSandbox: boolean, base: string) {
  return [base, isSandbox ? PLAY_SANDBOX_TOP_PADDING : ""].filter(Boolean).join(" ");
}

const INPUT_UNDERLINE_PLAY =
  "w-full bg-transparent pb-2 text-center text-4xl font-semibold tracking-tight font-mono tabular-nums outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500 transition-colors duration-300 border-b-2 border-neutral-400 focus:border-black dark:border-white/35 dark:focus:border-white text-black";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Dedupe Strict Mode dev double-invoke across remount (same logical game end). */
function rankedSessionSaveStorageKey(historyTailTs: number, scoreVal: number) {
  return `zetavant_session_saved_${historyTailTs}_${scoreVal}`;
}

function sandboxSessionSaveStorageKey(historyTailTs: number, scoreVal: number) {
  return `zetavant_sandbox_saved_${historyTailTs}_${scoreVal}`;
}

const TECH_SPECS = [
  { label: "ADDITION", value: "2–100 + 2–100" },
  { label: "SUBTRACTION", value: "Inverted Addition" },
  { label: "MULTIPLICATION", value: "2–12 × 2–100" },
  { label: "DIVISION", value: "Inverted Multiplication" },
] as const;

const SPEC_RULE =
  "border-neutral-200/45 dark:border-white/[0.07]";

function TechnicalSpecifications() {
  return (
    <section
      className="w-full max-w-xs sm:max-w-sm"
      aria-label="Operator specifications"
    >
      <div
        className={`overflow-hidden rounded-sm border ${SPEC_RULE} divide-y divide-neutral-200/40 dark:divide-white/[0.06]`}
      >
        {TECH_SPECS.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-2 divide-x divide-neutral-200/40 font-mono text-[10px] tracking-widest dark:divide-white/[0.06]`}
          >
            <div className="px-2.5 py-1.5 text-neutral-400 dark:text-neutral-400">
              {row.label}
            </div>
            <div className="px-2.5 py-1.5 text-right text-neutral-600 dark:text-white">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PlayPage() {
  const { isSandbox } = useSandboxMode();
  const [sandboxConfig, setSandboxConfig] =
    useState<GameConfig>(DEFAULT_CONFIG);
  const gameConfig = useMemo(
    () => (isSandbox ? sandboxConfig : DEFAULT_CONFIG),
    [isSandbox, sandboxConfig],
  );

  const {
    status,
    timeLeft,
    score,
    history,
    currentProblem,
    start,
    submitAnswer,
  } = useZetamacGame(gameConfig);

  const [input, setInput] = useState("");
  const [todayAttemptNumber, setTodayAttemptNumber] = useState<number | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const rankedSaveAttemptedRef = useRef(false);
  const sandboxSaveAttemptedRef = useRef(false);

  useEffect(() => {
    if (status === "playing") {
      rankedSaveAttemptedRef.current = false;
      sandboxSaveAttemptedRef.current = false;
      setTodayAttemptNumber(null);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "finished" || isSandbox) return;

    async function saveSession() {
      const lastTs = history[history.length - 1]?.timestamp ?? 0;
      const dedupeKey = rankedSessionSaveStorageKey(lastTs, score);
      if (typeof window !== "undefined") {
        if (window.sessionStorage.getItem(dedupeKey)) {
          console.log("[Play] Session save skipped (already persisted this round).");
          return;
        }
      }

      if (rankedSaveAttemptedRef.current) return;
      rankedSaveAttemptedRef.current = true;

      const supabase = createClient();

      const {
        data: { user: userFromGetUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[Play] auth.getUser() error:");
        console.dir(userError, { depth: null });
        rankedSaveAttemptedRef.current = false;
        return;
      }

      let user = userFromGetUser;

      if (!user) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[Play] auth.getSession() error:");
          console.dir(sessionError, { depth: null });
        }

        user = session?.user ?? null;

        if (user) {
          console.warn(
            "[Play] getUser() had no user; using session.user for insert (check JWT / cookie sync).",
          );
        }
      }

      if (!user) {
        console.warn("[Play] No user session — skipping session insert.");
        rankedSaveAttemptedRef.current = false;
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
        console.error("[Play] sessions count error (today local) — RLS may block SELECT on sessions:");
        console.dir(countError, { depth: null });
        rankedSaveAttemptedRef.current = false;
        return;
      }

      const attempt_number = (todayCount ?? 0) + 1;
      setTodayAttemptNumber(attempt_number);

      const accuracy = computeAccuracy(history);

      const row = {
        user_id: user.id,
        score,
        accuracy,
        duration_seconds: GAME_DURATION_S,
        attempt_number,
        source: SESSION_SOURCE,
        raw_data: { history },
        settings: { mode: "default" },
      };

      console.log("[Play] Attempting to save session...", row);
      console.log(
        "[Play] Verifying insert user_id matches auth user id:",
        row.user_id === user.id,
        "| user_id:",
        row.user_id,
        "| auth.user.id:",
        user.id,
      );

      try {
        const { data: insertRows, error: insertError } = await supabase
          .from("sessions")
          .insert(row)
          .select();

        if (insertError) {
          console.error("[Play] sessions insert failed (code / details / hint):");
          console.dir(insertError, { depth: null });
          setTodayAttemptNumber(null);
          rankedSaveAttemptedRef.current = false;
          return;
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(dedupeKey, "1");
        }
        console.log("[Play] Session saved successfully.", insertRows);
      } catch (err) {
        console.error("[Play] sessions insert threw (unexpected):");
        console.dir(err, { depth: null });
        setTodayAttemptNumber(null);
        rankedSaveAttemptedRef.current = false;
      }
    }

    void saveSession();
  }, [status, score, history, isSandbox]);

  useEffect(() => {
    if (status !== "finished" || !isSandbox) return;

    async function saveSandboxSession() {
      const lastTs = history[history.length - 1]?.timestamp ?? 0;
      const dedupeKey = sandboxSessionSaveStorageKey(lastTs, score);
      if (typeof window !== "undefined") {
        if (window.sessionStorage.getItem(dedupeKey)) {
          console.log(
            "[Play] Sandbox session save skipped (already persisted this round).",
          );
          return;
        }
      }

      if (sandboxSaveAttemptedRef.current) return;
      sandboxSaveAttemptedRef.current = true;

      const supabase = createClient();

      const {
        data: { user: userFromGetUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[Play] auth.getUser() error:");
        console.dir(userError, { depth: null });
        sandboxSaveAttemptedRef.current = false;
        return;
      }

      let user = userFromGetUser;

      if (!user) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[Play] auth.getSession() error:");
          console.dir(sessionError, { depth: null });
        }

        user = session?.user ?? null;

        if (user) {
          console.warn(
            "[Play] getUser() had no user; using session.user for insert (check JWT / cookie sync).",
          );
        }
      }

      if (!user) {
        console.warn("[Play] No user session — skipping sandbox session insert.");
        sandboxSaveAttemptedRef.current = false;
        return;
      }

      const accuracy = computeAccuracy(history);
      const settings = buildSandboxSettingsPayload(gameConfig);

      const row = {
        user_id: user.id,
        score,
        accuracy,
        duration_seconds: gameConfig.duration,
        attempt_number: null,
        source: "sandbox",
        raw_data: { history },
        settings,
      };

      console.log("[Play] Attempting to save sandbox session...", row);

      try {
        const { data: insertRows, error: insertError } = await supabase
          .from("sessions")
          .insert(row)
          .select();

        if (insertError) {
          console.error(
            "[Play] sandbox sessions insert failed (code / details / hint):",
          );
          console.dir(insertError, { depth: null });
          sandboxSaveAttemptedRef.current = false;
          return;
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(dedupeKey, "1");
        }
        console.log("[Play] Sandbox session saved successfully.", insertRows);
      } catch (err) {
        console.error("[Play] sandbox sessions insert threw (unexpected):");
        console.dir(err, { depth: null });
        sandboxSaveAttemptedRef.current = false;
      }
    }

    void saveSandboxSession();
  }, [status, score, history, isSandbox, gameConfig]);

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

  const progress =
    gameConfig.duration > 0 ? timeLeft / gameConfig.duration : 0;

  if (status === "idle") {
    return (
      <div
        className={playPageShellClass(
          isSandbox,
          "flex min-h-0 w-full flex-1 flex-col items-center justify-center bg-white px-4 font-sans transition-colors duration-300 dark:bg-black",
        )}
      >
        <div className="flex w-full flex-col items-center justify-center gap-5 sm:gap-7">
          <h1 className="text-center text-4xl font-semibold tracking-tight text-black transition-colors duration-300 sm:text-5xl dark:text-white">
            Zetavant
          </h1>
          {isSandbox ? (
            <>
              <p className="max-w-[280px] text-center text-sm leading-relaxed tracking-wide text-neutral-500 sm:text-base dark:text-neutral-400">
                Sharpen speed and accuracy under pressure.
              </p>
              <div className="flex w-full max-w-md flex-col items-center pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
                <SandboxConfig
                  config={sandboxConfig}
                  onChange={setSandboxConfig}
                />
                <button
                  onClick={start}
                  type="button"
                  className={`mt-10 ${PRIMARY_BTN_PLAY}`}
                >
                  Start
                </button>
              </div>
            </>
          ) : (
            <div className="flex w-full max-w-md flex-col items-center pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
              <p className="mb-10 max-w-[280px] text-center text-sm leading-relaxed tracking-wide text-neutral-500 sm:text-base dark:text-neutral-400">
                Two minutes. Sharpen speed and accuracy under pressure.
              </p>
              <button onClick={start} type="button" className={PRIMARY_BTN_PLAY}>
                Start
              </button>
              <p className="mt-10 text-center text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500">
                2:00 MIN • [+ , − , × , ÷] • ALL INTEGERS
              </p>
              <TechnicalSpecifications />
              <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                Want custom practice? Enable Sandbox Mode in{" "}
                <Link
                  href="/settings"
                  className="text-neutral-400 underline underline-offset-2 transition-colors duration-200 hover:text-black dark:text-neutral-500 dark:hover:text-white"
                >
                  Settings
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div
        className={playPageShellClass(
          isSandbox,
          "flex min-h-0 w-full flex-1 flex-col items-center bg-white px-6 py-12 font-sans transition-colors duration-300 dark:bg-black",
        )}
      >
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6">
            <p className={LABEL_MUTED}>Game Over</p>
            <p className="text-8xl font-semibold tracking-tight text-black tabular-nums transition-colors duration-300 dark:text-white">
              {score}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              problems solved in 2 minutes
            </p>
            {isSandbox ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className={SANDBOX_STATUS_LABEL}>SANDBOX — NOT RANKED</p>
                <SandboxConfigSummaryLines
                  summary={formatSandboxConfigSummary(gameConfig)}
                />
              </div>
            ) : (
              todayAttemptNumber != null && (
                <p className="text-center text-sm font-medium tracking-tight text-black transition-colors duration-300 dark:text-white">
                  Session Complete — Attempt #{todayAttemptNumber} today
                </p>
              )
            )}
          </div>

          <div className="w-full rounded-sm border border-gray-200 bg-white px-5 py-6 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
            <SessionDetailPanel
              rawData={{ history }}
              settings={
                isSandbox ? buildSandboxSettingsPayload(gameConfig) : undefined
              }
              chartHeight={260}
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
    <div
      className={playPageShellClass(
        isSandbox,
        "relative flex min-h-0 w-full flex-1 flex-col bg-white font-sans select-none transition-colors duration-300 dark:bg-black",
      )}
    >
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
