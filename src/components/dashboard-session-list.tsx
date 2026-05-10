"use client";

import { useState } from "react";
import SessionTimeChart, {
  sanitizeTimingPoints,
} from "@/components/session-time-chart";
import { formatSwissDate } from "@/lib/datetime";

export interface DashboardSessionRow {
  id: string;
  created_at: string;
  score: number;
  attempt_number: number | null;
  raw_data: unknown;
}

export default function DashboardSessionList({
  sessions,
}: {
  sessions: DashboardSessionRow[];
}) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 bg-white rounded-sm">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="text-xs font-medium tracking-widest uppercase text-gray-400">
          Recent sessions
        </h2>
        <p className="mt-1 text-sm text-gray-500">Last {sessions.length} games</p>
      </div>
      <ul className="divide-y divide-gray-200">
        {sessions.map((s) => (
          <SessionListItem key={s.id} session={s} />
        ))}
      </ul>
    </section>
  );
}

function SessionListItem({ session }: { session: DashboardSessionRow }) {
  const [open, setOpen] = useState(false);
  const points = sanitizeTimingPoints(session.raw_data);

  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="min-w-[96px]">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Date
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums tracking-tight text-gray-950">
              {formatSwissDate(session.created_at)}
            </p>
          </div>
          <div className="min-w-[72px]">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Attempt
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-gray-950">
              {session.attempt_number != null ? `#${session.attempt_number}` : "—"}
            </p>
          </div>
          <div className="min-w-[72px]">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Score
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-950">
              {session.score}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium tracking-widest uppercase text-gray-500 hover:text-gray-950 transition-colors"
        >
          {open ? "Collapse" : "Expand details"}
        </button>
      </div>
      {open && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Time per question
          </p>
          <SessionTimeChart
            points={points}
            height={260}
            className="mt-4 max-w-full"
          />
        </div>
      )}
    </li>
  );
}
