"use client";

import { useState } from "react";
import SessionDetailPanel from "@/components/session-detail-panel";
import { formatSwissDate } from "@/lib/datetime";

export interface DashboardSessionRow {
  id: string;
  created_at: string;
  score: number;
  attempt_number: number | null;
  raw_data: unknown;
}

const labelMutedClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

export default function DashboardSessionList({
  sessions,
}: {
  sessions: DashboardSessionRow[];
}) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-sm border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <h2 className={labelMutedClass}>Recent sessions</h2>
        <p className="mt-1 font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
          Last {sessions.length} games
        </p>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {sessions.map((s) => (
          <SessionListItem key={s.id} session={s} />
        ))}
      </ul>
    </section>
  );
}

function SessionListItem({ session }: { session: DashboardSessionRow }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="px-4 py-4 transition-colors duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="min-w-[96px]">
            <p className={labelMutedClass}>Date</p>
            <p className="mt-1 font-mono text-xs tabular-nums tracking-tight text-black dark:text-white">
              {formatSwissDate(session.created_at)}
            </p>
          </div>
          <div className="min-w-[72px]">
            <p className={labelMutedClass}>Attempt</p>
            <p className="mt-1 font-mono text-xs tabular-nums text-black dark:text-white">
              {session.attempt_number != null ? `#${session.attempt_number}` : "—"}
            </p>
          </div>
          <div className="min-w-[72px]">
            <p className={labelMutedClass}>Score</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-black dark:text-white">
              {session.score}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium tracking-widest uppercase text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open && (
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <SessionDetailPanel rawData={session.raw_data} />
        </div>
      )}
    </li>
  );
}
