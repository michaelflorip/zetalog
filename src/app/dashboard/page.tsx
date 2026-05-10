import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardCharts from "@/components/dashboard-charts";
import DashboardSessionList from "@/components/dashboard-session-list";
import { averagesByOperator } from "@/lib/dashboard-aggregates";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [sessionsRes, highRes, countRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, score, created_at, raw_data, attempt_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sessions")
      .select("score")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const sessions = sessionsRes.data ?? [];
  const allTimeHigh = highRes.data?.score ?? null;
  const totalAttempts = countRes.count ?? 0;

  const last10 = sessions.slice(0, 10);
  const averageLast10 =
    last10.length === 0
      ? null
      : Math.round(
          (last10.reduce((acc, s) => acc + s.score, 0) / last10.length) * 10,
        ) / 10;

  const chronological = [...sessions].reverse();
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const lineData = chronological.map((s) => ({
    at: dateFmt.format(new Date(s.created_at)),
    score: s.score,
  }));

  const barAgg = averagesByOperator(sessions);
  const barData = barAgg.map(({ operator, avgMs }) => ({
    operator,
    avgMs,
  }));

  return (
    <div className="flex flex-1 flex-col bg-white pb-16 font-sans transition-colors duration-300 dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-8 py-20">
        <header className="w-full">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
            Analytics
          </p>
          <div className="mt-4 flex w-full items-baseline justify-between gap-6">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
              Dashboard
            </h1>
            <Link
              href="/play"
              className="shrink-0 font-mono text-xs tracking-wide text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
            >
              → Play
            </Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="All-time high"
            value={allTimeHigh != null ? String(allTimeHigh) : "—"}
          />
          <StatCard
            label="Average score (last 10)"
            value={
              averageLast10 != null
                ? averageLast10 % 1 === 0
                  ? String(Math.round(averageLast10))
                  : averageLast10.toFixed(1)
                : "—"
            }
          />
          <StatCard
            label="Total attempts"
            value={String(totalAttempts)}
          />
        </div>

        <DashboardCharts lineData={lineData} barData={barData} />

        <DashboardSessionList
          sessions={sessions.map((s) => ({
            id:
              s.id != null && s.id !== ""
                ? String(s.id)
                : `session-${s.created_at}-${s.score}`,
            created_at: s.created_at,
            score: s.score,
            attempt_number: s.attempt_number,
            raw_data: s.raw_data,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white px-4 py-4 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-black transition-colors duration-300 dark:text-white">
        {value}
      </p>
    </div>
  );
}
