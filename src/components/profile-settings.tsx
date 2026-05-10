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
    <div className="rounded-sm border border-gray-200 bg-white px-5 py-6 transition-colors duration-300 dark:border-gray-800 dark:bg-black">
      <div className="flex items-start gap-4">
        <input
          id={toggleId}
          type="checkbox"
          checked={isPublic}
          onChange={handleCheckboxChange}
          disabled={loading}
          className="mt-1 h-[15px] w-[15px] shrink-0 cursor-pointer rounded-sm border border-black bg-white text-black accent-black focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white dark:bg-black dark:text-white dark:accent-white dark:focus:ring-white dark:focus:ring-offset-black"
          aria-describedby={`${toggleId}-desc`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={toggleId}
            className={`block text-xs font-medium tracking-widest uppercase text-black dark:text-white ${
              loading ? "" : "cursor-pointer"
            }`}
          >
            Public profile
          </label>
          <p
            id={`${toggleId}-desc`}
            className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
          >
            If enabled, your username and best results can appear on the public
            Hall of Fame.
          </p>
          {error && (
            <p className="mt-3 text-xs text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
