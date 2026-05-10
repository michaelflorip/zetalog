import { redirect } from "next/navigation";
import AppearanceSettings from "@/components/appearance-settings";
import ProfileSettings from "@/components/profile-settings";
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
    .select("username, is_public")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username ?? "—";
  const initialIsPublic = profile?.is_public ?? false;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-8 py-24">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/50">
          Account details and actions.
        </p>

        <section className="mt-20 space-y-12">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-foreground/45">
              Email
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-foreground/45">
              Username
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">{username}</p>
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
