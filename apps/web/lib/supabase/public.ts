import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let publicClient: ReturnType<typeof createClient<Database>> | undefined;

export function supabasePublic() {
  if (!publicClient) {
    publicClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return publicClient;
}
