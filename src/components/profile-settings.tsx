"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileSettingsProps {
  userId: string;
  initialIsPublic: boolean;
}

export default function ProfileSettings({
  userId,
  initialIsPublic,
}: ProfileSettingsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleId = `public-profile-${userId.slice(0, 8)}`;

  async function persist(next: boolean) {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ is_public: next })
      .eq("id", userId);

    setLoading(false);

    if (updateErr) {
      setIsPublic(!next);
      setError(updateErr.message);
    }
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setIsPublic(next);
    void persist(next);
  }

  return (
    <div className="border border-black/10 bg-foreground/[0.03] px-5 py-6 rounded-sm dark:border-white/15 dark:bg-white/[0.04]">
      <div className="flex items-start gap-4">
        <input
          id={toggleId}
          type="checkbox"
          checked={isPublic}
          onChange={handleCheckboxChange}
          disabled={loading}
          className="mt-1 h-[15px] w-[15px] shrink-0 cursor-pointer rounded-sm border border-foreground bg-background text-foreground accent-foreground focus:outline-none focus:ring-1 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
          aria-describedby={`${toggleId}-desc`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={toggleId}
            className={`block text-xs font-medium tracking-widest uppercase text-foreground ${
              loading ? "" : "cursor-pointer"
            }`}
          >
            Public profile
          </label>
          <p
            id={`${toggleId}-desc`}
            className="mt-2 text-xs leading-relaxed text-foreground/50"
          >
            If enabled, your scores and username will appear on the global
            leaderboard.
          </p>
          {error && (
            <p className="mt-3 text-xs text-red-800" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
