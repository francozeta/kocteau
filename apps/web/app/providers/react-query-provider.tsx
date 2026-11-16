"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAccountQueryCache, makeQueryClient } from "@/lib/react-query/account-cache";
import { accountTransitionPath } from "@/lib/react-query/account-navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (mod) => mod.ReactQueryDevtools,
    ),
  { ssr: false },
);

const browserQueryCache = createAccountQueryCache();

function getQueryClient(accountId: string | null) {
  if (typeof window === "undefined") {
    // SSR: new per request (safe)
    return makeQueryClient();
  }
  return browserQueryCache.get(accountId);
}

export default function Providers({ children, accountId }: {
  children: React.ReactNode;
  accountId: string | null;
}) {
  const queryClient = getQueryClient(accountId);
  const shouldRenderDevtools = process.env.NODE_ENV === "development";

  React.useEffect(() => {
    let navigating = false;
    const { data: { subscription } } = supabaseBrowser().auth.onAuthStateChange(
      (event, session) => {
        if (navigating) return;
        let storage: Storage | null = null;
        try { storage = window.sessionStorage; } catch {}
        const path = accountTransitionPath({
          serverAccountId: accountId,
          browserAccountId: session?.user.id ?? null,
          event,
          currentPath: window.location.href,
          storage,
        });
        if (!path) return;
        navigating = true;
        browserQueryCache.clear();
        // Server-rendered viewer props must change with the cookie, too.
        if (path === window.location.href) window.location.reload();
        else window.location.replace(path);
      },
    );
    return () => subscription.unsubscribe();
  }, [accountId]);

  return (
    <QueryClientProvider key={accountId ?? "guest"} client={queryClient}>
      {children}
      {shouldRenderDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
