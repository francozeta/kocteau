import type { Database } from "@/lib/supabase/database.types";

export type StarterTrack =
  Database["public"]["Functions"]["get_starter_tracks"]["Returns"][number];
