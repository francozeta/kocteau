type EntityCandidate = { provider_id: string; entity_id?: string | null };

export async function attachEntityIds<T extends EntityCandidate>(
  candidates: readonly T[],
  lookup: (providerIds: string[]) => Promise<ReadonlyMap<string, string>>,
): Promise<(T & { entity_id: string | null })[]> {
  const known = new Map(candidates.flatMap((candidate) =>
    candidate.entity_id == null ? [] : [[candidate.provider_id, candidate.entity_id] as const],
  ));
  const unresolved = Array.from(new Set(candidates
    .filter((candidate) => !known.has(candidate.provider_id))
    .map((candidate) => candidate.provider_id))).sort();
  let entityIds = known;

  if (unresolved.length) {
    try {
      entityIds = new Map([...await lookup(unresolved), ...known]);
    } catch {
      // Preserve available identities when the shared lookup fails.
    }
  }

  return candidates.map((candidate) => ({
    ...candidate,
    entity_id: candidate.entity_id ?? entityIds.get(candidate.provider_id) ?? null,
  }));
}
