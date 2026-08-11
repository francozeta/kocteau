import type { Database } from "@/lib/supabase/database.types";

export const curatorAvailabilityValues = [
  "occasional",
  "weekly",
  "frequent",
] as const;

export const curatorApplicationStatuses = [
  "submitted",
  "reviewing",
  "accepted",
  "declined",
] as const;

export const curatorDecisionStatuses = [
  "reviewing",
  "accepted",
  "declined",
] as const;

export type CuratorAvailability = (typeof curatorAvailabilityValues)[number];
export type CuratorApplicationStatus = (typeof curatorApplicationStatuses)[number];
export type CuratorApplication =
  Database["public"]["Tables"]["curator_applications"]["Row"];

export const curatorAvailabilityOptions = [
  {
    value: "occasional",
    label: "Occasional",
    note: "A few thoughtful picks each month.",
  },
  {
    value: "weekly",
    label: "Weekly",
    note: "A steady weekly contribution.",
  },
  {
    value: "frequent",
    label: "Frequent",
    note: "Several listening sessions each week.",
  },
] as const satisfies readonly {
  value: CuratorAvailability;
  label: string;
  note: string;
}[];

export function getCuratorStatusLabel(status: string) {
  switch (status) {
    case "reviewing":
      return "In review";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Not selected";
    default:
      return "Submitted";
  }
}
