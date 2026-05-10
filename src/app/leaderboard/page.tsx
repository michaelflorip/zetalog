import type { Metadata } from "next";
import LeaderboardClient from "@/components/leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard — ZETAVANT",
  description:
    "Public Hall of Fame and session rankings on Zetavant—the mental math training platform for competitive mastery.",
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    url: "/leaderboard",
    title: "Leaderboard — ZETAVANT",
    description:
      "Public Hall of Fame and session rankings on Zetavant—the mental math training platform for competitive mastery.",
  },
  twitter: {
    title: "Leaderboard — ZETAVANT",
    description:
      "Public Hall of Fame and session rankings on Zetavant—the mental math training platform for competitive mastery.",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
