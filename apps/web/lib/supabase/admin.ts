import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseSecretKey, getSupabaseUrl } from "./env";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function supabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseSecretKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return adminClient;
}
