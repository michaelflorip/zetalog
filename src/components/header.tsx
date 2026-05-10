import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest uppercase text-gray-950"
        >
          Zetalog
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-gray-400 font-mono truncate max-w-[200px]">
                {user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
