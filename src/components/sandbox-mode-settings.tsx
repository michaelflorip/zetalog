"use client";

import { useEffect, useState } from "react";
import { useSandboxMode } from "@/hooks/use-sandbox-mode";

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const TOGGLE_ID = "sandbox-mode";

export function SandboxModeSettings() {
  const { isSandbox, setSandbox } = useSandboxMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSandbox(e.target.checked);
  }

  return (
    <div className="rounded-sm border border-gray-200 bg-white px-5 py-6 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <p className={SECTION_LABEL}>MODE</p>
      {!mounted ? (
        <div className="mt-6 h-[52px]" aria-hidden />
      ) : (
        <div className="mt-6 flex items-start gap-4">
          <input
            id={TOGGLE_ID}
            type="checkbox"
            checked={isSandbox}
            onChange={handleCheckboxChange}
            className="mt-1 h-[15px] w-[15px] shrink-0 cursor-pointer rounded-sm border border-black bg-white text-black accent-black focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-2 focus:ring-offset-white dark:border-white dark:bg-black dark:text-white dark:accent-white dark:focus:ring-white dark:focus:ring-offset-black"
            aria-describedby={`${TOGGLE_ID}-desc`}
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor={TOGGLE_ID}
              className="block cursor-pointer text-xs font-medium tracking-widest uppercase text-black dark:text-white"
            >
              SANDBOX MODE
            </label>
            <p
              id={`${TOGGLE_ID}-desc`}
              className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
            >
              Practice without affecting your ranked stats or leaderboard
              standing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
