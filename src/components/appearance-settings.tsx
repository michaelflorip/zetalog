"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MODES = [
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
  { value: "system" as const, label: "System" },
] as const;

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = theme ?? "system";

  return (
    <div className="rounded-sm border border-gray-200 bg-white px-5 py-6 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <p className="text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500">
        Appearance
      </p>
      {!mounted ? (
        <div className="mt-6 h-[22px]" aria-hidden />
      ) : (
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          {MODES.map(({ value, label }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={[
                  "text-xs tracking-[0.22em] uppercase transition-colors text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white",
                  isActive
                    ? "font-semibold text-black underline decoration-2 underline-offset-[6px] decoration-black dark:text-white dark:decoration-white"
                    : "font-normal",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
