"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
      router.push("/play");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <Link
          href="/"
          className="mb-10 block text-sm font-semibold tracking-widest uppercase text-gray-950"
        >
          Zetalog
        </Link>

        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-gray-950">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium tracking-widest uppercase text-gray-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-gray-300 bg-transparent pb-2 text-sm text-gray-950 outline-none placeholder:text-gray-300 focus:border-gray-950 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-widest uppercase text-gray-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-gray-300 bg-transparent pb-2 text-sm text-gray-950 outline-none placeholder:text-gray-300 focus:border-gray-950 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-gray-950 border border-gray-200 px-3 py-2 rounded-sm bg-gray-50">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gray-950 py-3 text-sm font-medium tracking-widest uppercase text-white rounded-sm hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
