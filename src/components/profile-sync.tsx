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
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existing) return;

      const username = (user.email ?? "").split("@")[0];

      await supabase.from("profiles").upsert({
        id: user.id,
        username,
        full_name: user.email ?? "",
      });
    }

    syncProfile();
  }, []);

  return <>{children}</>;
}
