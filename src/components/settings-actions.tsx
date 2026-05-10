"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LABEL =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const UNDERLINE_INPUT =
  "w-full border-b border-neutral-400 bg-transparent pb-2 text-sm text-black outline-none transition-colors duration-300 placeholder:text-neutral-400 focus:border-black dark:border-white/35 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white";

const OUTLINE_BTN =
  "w-full rounded-sm border border-black bg-transparent px-8 py-3 text-sm font-medium tracking-widest uppercase text-black transition-colors duration-300 hover:bg-neutral-50 dark:border-white dark:text-white dark:hover:bg-white/10";

export default function SettingsActions() {
  const router = useRouter();
  const [changeOpen, setChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user?.email) {
      setLoading(false);
      setError(userErr?.message ?? "Could not read your session.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      const msg = signInError.message.toLowerCase();
      if (
        msg.includes("invalid") ||
        msg.includes("credential") ||
        signInError.message === "Invalid login credentials"
      ) {
        setError("Incorrect current password.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Password updated");
    router.refresh();
  };

  return (
    <div className="mt-16 flex w-full max-w-xs flex-col items-center gap-5">
      <button type="button" onClick={handleSignOut} className={OUTLINE_BTN}>
        Sign Out
      </button>

      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            setChangeOpen((wasOpen) => {
              if (wasOpen) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
              setError(null);
              setSuccess(null);
              return !wasOpen;
            });
          }}
          className={OUTLINE_BTN}
        >
          {changeOpen ? "Hide" : "Change password"}
        </button>

        {changeOpen && (
          <form
            onSubmit={handlePasswordSubmit}
            className="mt-8 flex w-full flex-col gap-6"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="current-password" className={LABEL}>
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={UNDERLINE_INPUT}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className={LABEL}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={UNDERLINE_INPUT}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className={LABEL}>
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={UNDERLINE_INPUT}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 transition-colors duration-300 dark:border-red-900 dark:bg-red-950/35 dark:text-red-200">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-sm border border-gray-200 bg-neutral-50 px-3 py-2 text-xs text-black transition-colors duration-300 dark:border-gray-800 dark:bg-neutral-950 dark:text-white">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-sm bg-black py-3 text-sm font-medium tracking-widest uppercase text-white transition-colors duration-300 hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
