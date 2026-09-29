import type { CatalogSignalProposal } from "./signal-proposals";

export type SignalSelection = { chosen: string[]; removed: string[]; allowSuggestions: boolean };

export function createSignalSelection(savedIds: string[] = []): SignalSelection {
  return { chosen: savedIds, removed: [], allowSuggestions: savedIds.length === 0 };
}

export function selectedSignalIds(selection: SignalSelection, proposal: CatalogSignalProposal | null) {
  const ids = new Set(selection.chosen);
  if (selection.allowSuggestions) {
    for (const signal of proposal?.signals ?? []) {
      if (ids.size < 12 && !selection.removed.includes(signal.tagId)) ids.add(signal.tagId);
    }
  }
  return ids;
}

export function toggleSignal(selection: SignalSelection, id: string, selected: Set<string>): SignalSelection {
  return selected.has(id) ? {
    ...selection, chosen: selection.chosen.filter((value) => value !== id), removed: [...selection.removed, id],
  } : {
    ...selection, chosen: [...new Set([...selection.chosen, id])], removed: selection.removed.filter((value) => value !== id),
  };
}

export function clearSignalSelection(): SignalSelection {
  return { chosen: [], removed: [], allowSuggestions: false };
}
