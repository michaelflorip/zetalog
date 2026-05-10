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
    <div className="border border-black/10 px-5 py-6 rounded-sm dark:border-white/15">
      <p className="text-xs font-medium tracking-widest uppercase text-foreground/50">
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
                  "text-xs tracking-[0.22em] uppercase transition-colors text-foreground/55 hover:text-foreground",
                  isActive
                    ? "font-semibold text-foreground underline decoration-foreground decoration-2 underline-offset-[6px]"
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
