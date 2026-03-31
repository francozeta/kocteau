import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let publicClient: ReturnType<typeof createClient<Database>> | undefined;

export function supabasePublic() {
  if (!publicClient) {
    publicClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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
