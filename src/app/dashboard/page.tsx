import { redirect } from "next/navigation";
import {
  DashboardClient,
  type DashboardSessionRecord,
} from "@/components/dashboard-client";
import { createClient } from "@/lib/supabase/server";

const RANKED_SESSION_SOURCE = "zetavant";

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
      .select("id, score, created_at, raw_data, attempt_number, source, settings")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sessions")
      .select("score")
      .eq("user_id", user.id)
      .eq("source", RANKED_SESSION_SOURCE)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("source", RANKED_SESSION_SOURCE),
  ]);

  const sessions: DashboardSessionRecord[] = (sessionsRes.data ?? []).map(
    (s) => ({
      id:
        s.id != null && s.id !== ""
          ? String(s.id)
          : `session-${s.created_at}-${s.score}`,
      created_at: s.created_at,
      score: s.score,
      attempt_number: s.attempt_number,
      source: s.source ?? null,
      settings: s.settings ?? null,
      raw_data: s.raw_data,
    }),
  );

  const rankedAllTimeHigh = highRes.data?.score ?? null;
  const rankedTotalAttempts = countRes.count ?? 0;

  return (
    <div className="flex flex-1 flex-col bg-white pb-16 font-sans transition-colors duration-300 dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-8 py-20">
        <DashboardClient
          sessions={sessions}
          rankedAllTimeHigh={rankedAllTimeHigh}
          rankedTotalAttempts={rankedTotalAttempts}
        />
      </div>
    </div>
  );
}
