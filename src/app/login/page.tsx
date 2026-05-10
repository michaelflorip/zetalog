"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LABEL =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

const UNDERLINE_INPUT =
  "w-full border-b border-neutral-400 bg-transparent pb-2 text-sm text-black outline-none transition-colors duration-300 placeholder:text-neutral-400 focus:border-black dark:border-white/35 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
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

        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
          Sign in
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
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-black transition-colors hover:opacity-80 dark:text-white"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
