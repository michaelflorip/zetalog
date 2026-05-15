"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zetavant_sandbox_mode";
const CHANGE_EVENT = "zetavant-sandbox-mode";

function readFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return false;
  return raw === "true";
}

function writeToStorage(val: boolean): void {
  localStorage.setItem(STORAGE_KEY, val ? "true" : "false");
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: val }));
}

export function useSandboxMode() {
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    setIsSandbox(readFromStorage());

    const sync = () => setIsSandbox(readFromStorage());

    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setSandbox = useCallback((val: boolean) => {
    writeToStorage(val);
    setIsSandbox(val);
  }, []);

  const toggleSandbox = useCallback(() => {
    const next = !readFromStorage();
    writeToStorage(next);
    setIsSandbox(next);
  }, []);

  return { isSandbox, toggleSandbox, setSandbox } as const;
}
