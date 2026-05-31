import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function supabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabasePublishableKey()
    );
  }

  return browserClient;
}
