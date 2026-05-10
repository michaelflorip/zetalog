"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsActions() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mt-16 flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full max-w-xs border border-gray-950 bg-white px-8 py-3 text-sm font-medium tracking-widest uppercase text-gray-950 rounded-sm transition-colors hover:bg-gray-50"
      >
        Sign Out
      </button>
      <button
        type="button"
        disabled
        className="w-full max-w-xs border border-gray-200 bg-transparent px-8 py-3 text-sm font-medium tracking-widest uppercase text-gray-300 rounded-sm cursor-not-allowed"
        title="Coming soon"
      >
        Change Password
      </button>
    </div>
  );
}
