"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `sm` breakpoint (640px): true when viewport is mobile/narrow. */
const MAX_SM_QUERY = "(max-width: 639px)";

export function useNarrowViewport() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MAX_SM_QUERY);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return narrow;
}
