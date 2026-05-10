import type { Metadata } from "next";
import LeaderboardClient from "@/components/leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard — ZETALOG",
  description:
    "Top scores among players who have chosen to appear on the public leaderboard.",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
