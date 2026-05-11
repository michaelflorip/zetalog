"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

function profileVerifiedStorageKey(userId: string) {
  return `zetavant_profile_verified_${userId}`;
}

export default function ProfileSync({
  children,
}: {
  children: React.ReactNode;
}) {
  const inFlightRef = useRef(new Set<string>());

  useEffect(() => {
    const supabase = createClient();
    const inFlight = inFlightRef.current;

    async function syncProfile(userId: string, email: string | null) {
      if (typeof window !== "undefined") {
        if (sessionStorage.getItem(profileVerifiedStorageKey(userId))) {
          console.log(
            "[ProfileSync] Profile already verified this browser session, skipping.",
            userId,
          );
          return;
        }
      }

      if (inFlight.has(userId)) {
        console.log("[ProfileSync] Sync already in flight for user, skipping.", userId);
        return;
      }
      inFlight.add(userId);

      try {
        console.log("[ProfileSync] Running profile sync for user:", userId);

        const { data: existing, error: selectError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (selectError) {
          console.error("[ProfileSync] profiles select error:", selectError);
          return;
        }

        if (existing) {
          console.log(
            "[ProfileSync] Profile row already exists, skipping upsert.",
          );
          if (typeof window !== "undefined") {
            sessionStorage.setItem(profileVerifiedStorageKey(userId), "1");
          }
          return;
        }

        const username = (email ?? "").split("@")[0];
        const upsertPayload = {
          id: userId,
          username,
          full_name: email ?? "",
        };

        console.log(
          "[ProfileSync] Firing profiles upsert for new user...",
          upsertPayload,
        );

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(upsertPayload);

        if (upsertError) {
          console.error("[ProfileSync] profiles upsert error:", upsertError);
          return;
        }

        console.log("[ProfileSync] profiles upsert completed successfully.");
        if (typeof window !== "undefined") {
          sessionStorage.setItem(profileVerifiedStorageKey(userId), "1");
        }
      } finally {
        inFlight.delete(userId);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ProfileSync] onAuthStateChange:", event);

      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") {
        return;
      }

      if (!session?.user) {
        console.log("[ProfileSync] No session user for event:", event);
        return;
      }

      const { id, email } = session.user;
      void syncProfile(id, email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  );
}
