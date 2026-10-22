import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";
import { createPublicReadFetch } from "./public-fetch";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let publicClient: PostgrestClient<Database> | undefined;

export function supabasePublic() {
  if (!publicClient) {
    const key = getSupabasePublishableKey();
    publicClient = new PostgrestClient<Database>(
      getSupabaseUrl().replace(/\/+$/, "") + "/rest/v1",
      {
        headers: { apikey: key, Authorization: "Bearer " + key },
        retry: false,
        fetch: createPublicReadFetch(),
      },
    );
  }
  return publicClient;
}
