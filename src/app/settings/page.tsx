import { redirect } from "next/navigation";
import SettingsActions from "@/components/settings-actions";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username ?? "—";

  return (
    <div className="flex flex-1 flex-col bg-white font-sans">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-8 py-24">
        <h1 className="text-xl font-semibold tracking-tight text-gray-950">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Account details and actions.
        </p>

        <section className="mt-20 space-y-12">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Email
            </p>
            <p className="mt-2 font-mono text-sm text-gray-950">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400">
              Username
            </p>
            <p className="mt-2 font-mono text-sm text-gray-950">{username}</p>
          </div>
        </section>

        <SettingsActions />
      </main>
    </div>
  );
}
