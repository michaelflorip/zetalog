import { redirect } from "next/navigation";
import AppearanceSettings from "@/components/appearance-settings";
import ProfileSettings from "@/components/profile-settings";
import SettingsActions from "@/components/settings-actions";
import { createClient } from "@/lib/supabase/server";

const LABEL =
  "text-xs font-medium tracking-widest uppercase text-neutral-400 dark:text-neutral-500";

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
    .select("username, is_public")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username ?? "—";
  const initialIsPublic = profile?.is_public ?? false;

  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-8 py-24">
        <h1 className="text-xl font-semibold tracking-tight text-black transition-colors duration-300 dark:text-white">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Account details and actions.
        </p>

        <section className="mt-20 space-y-12">
          <div>
            <p className={LABEL}>Email</p>
            <p className="mt-2 font-mono text-sm text-black transition-colors duration-300 dark:text-white">
              {user.email}
            </p>
          </div>
          <div>
            <p className={LABEL}>Username</p>
            <p className="mt-2 font-mono text-sm text-black transition-colors duration-300 dark:text-white">
              {username}
            </p>
          </div>
        </section>

        <div className="mt-14">
          <AppearanceSettings />
        </div>

        <div className="mt-10">
          <ProfileSettings userId={user.id} initialIsPublic={initialIsPublic} />
        </div>

        <SettingsActions />
      </main>
    </div>
  );
}
