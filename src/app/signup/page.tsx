"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteOrigin } from "@/lib/site-url";

const LABEL =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const UNDERLINE_INPUT =
  "w-full border-b border-neutral-400 bg-transparent pb-2 text-sm text-black outline-none transition-colors duration-300 placeholder:text-neutral-400 focus:border-black dark:border-white/35 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = getSiteOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 transition-colors duration-300 dark:bg-black">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-10 block text-sm font-semibold tracking-widest uppercase text-black transition-colors duration-300 dark:text-white"
        >
          Zetavant
        </Link>

        {awaitingConfirmation ? (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              We sent a verification link to{" "}
              <span className="font-mono text-black dark:text-white">
                {email}
              </span>
              . Open it to confirm your account, then sign in at{" "}
              <span className="font-mono text-black dark:text-white">
                {getSiteOrigin()}
              </span>
              .
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-8 text-2xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
              Create account
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={LABEL}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={UNDERLINE_INPUT}
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={LABEL}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={UNDERLINE_INPUT}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 transition-colors duration-300 dark:border-red-900 dark:bg-red-950/35 dark:text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-sm bg-black py-3 text-sm font-medium tracking-widest uppercase text-white transition-colors duration-300 hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-black transition-colors hover:opacity-80 dark:text-white"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
