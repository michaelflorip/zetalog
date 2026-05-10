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
    <div className="flex flex-1 flex-col bg-gray-50 font-sans pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Analytics
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              Dashboard
            </h1>
          </div>
          <Link
            href="/play"
            className="text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors"
          >
            → Play
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
    <div className="border border-gray-200 bg-white px-6 py-6 rounded-sm">
      <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-gray-950">
        {value}
      </p>
    </div>
  );
}
