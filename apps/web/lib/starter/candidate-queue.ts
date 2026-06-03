export const editorialCandidateStatuses = [
  "queued",
  "approved",
  "dismissed",
  "archived",
] as const;

export type EditorialCandidateStatus = (typeof editorialCandidateStatuses)[number];

const editorialCandidateStatusLabels: Record<EditorialCandidateStatus, string> = {
  queued: "Queued",
  approved: "Approved",
  dismissed: "Dismissed",
  archived: "Archived",
};

export function isEditorialCandidateDecisionStatus(
  status: EditorialCandidateStatus,
) {
  return status !== "queued";
}

export function getEditorialCandidateStatusLabel(
  status: EditorialCandidateStatus,
) {
  return editorialCandidateStatusLabels[status];
}
