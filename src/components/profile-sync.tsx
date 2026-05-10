"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSync({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const supabase = createClient();

    async function syncProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[ProfileSync] auth.getUser() error:", userError);
        return;
      }

      if (!user) {
        console.log("[ProfileSync] No authenticated user detected.");
        return;
      }

      console.log("[ProfileSync] Authenticated user:", user.id);

      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("[ProfileSync] profiles select error:", selectError);
        return;
      }

      if (existing) {
        console.log("[ProfileSync] Profile row already exists, skipping upsert.");
        return;
      }

      const username = (user.email ?? "").split("@")[0];
      const upsertPayload = {
        id: user.id,
        username,
        full_name: user.email ?? "",
      };

      console.log("[ProfileSync] Firing profiles upsert for new user...", upsertPayload);

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(upsertPayload);

      if (upsertError) {
        console.error("[ProfileSync] profiles upsert error:", upsertError);
        return;
      }

      console.log("[ProfileSync] profiles upsert completed successfully.");
    }

    syncProfile();
  }, []);

  return <>{children}</>;
}
