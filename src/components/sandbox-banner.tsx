"use client";

import { useSandboxMode } from "@/hooks/use-sandbox-mode";

export function SandboxBanner() {
  const { isSandbox } = useSandboxMode();

  if (!isSandbox) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-black py-2 text-white transition-colors duration-300 dark:bg-white dark:text-black"
    >
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em]">
        SANDBOX MODE &nbsp;·&nbsp; PRACTICE ONLY
      </p>
    </div>
  );
}
