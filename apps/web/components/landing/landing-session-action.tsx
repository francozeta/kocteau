"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Keep /home static and indexable. Only the small CTA adapts after hydration. */
export default function LandingSessionAction() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let alive = true;
    const auth = supabaseBrowser().auth;
    void auth.getSession().then(({ data }) => {
      if (alive) setAuthenticated(Boolean(data.session?.user));
    }).catch(() => {
      // Public landing still works if a browser rejects session storage.
    });
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      if (alive) setAuthenticated(Boolean(session?.user));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Link
      href={authenticated ? "/" : "/login"}
      className={cn(
        buttonVariants({ variant: "default", size: "sm" }),
        "h-8 rounded-full border-0 px-2.5 font-circular text-[12px] font-medium shadow-none sm:px-3 sm:text-[13px]",
      )}
    >
      {authenticated ? "Open app" : "Log in"}
    </Link>
  );
}
